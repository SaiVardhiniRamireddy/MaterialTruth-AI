import { Router } from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { Analysis } from '../models/Analysis.js';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { analysisUpload, verifyUploads } from '../middleware/upload.js';
import { acousticFeaturesSchema } from '../services/processing/audioService.js';
import { runAnalysis } from '../services/analysisService.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

const router = Router();
router.use(requireAuth);

const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 40,
  keyGenerator: (req) => String(req.user._id),
  message: { success: false, error: { message: 'Hourly analysis limit reached. Please try again later.' } },
});

const parseJSONField = (raw, name) => {
  if (raw === undefined || raw === '') return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    throw new ApiError(400, `${name} must be valid JSON`);
  }
};

const bodySchema = z.object({
  text: z.string().max(2000, 'Packaging text is limited to 2000 characters').optional(),
  objectHint: z.string().trim().max(120).optional(),
  thumbnail: z
    .string()
    .max(250_000, 'Thumbnail too large')
    .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, 'Invalid thumbnail')
    .optional(),
});

const ensureId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid report id');
};

// POST /api/analysis — multipart: image?, labelImage?, audio?, text?, sensors?(JSON), acousticFeatures?(JSON), thumbnail?, objectHint?
router.post(
  '/',
  analysisLimiter,
  analysisUpload,
  verifyUploads,
  asyncHandler(async (req, res) => {
    const body = bodySchema.parse({ text: req.body.text, objectHint: req.body.objectHint, thumbnail: req.body.thumbnail || undefined });
    const sensorsInput = parseJSONField(req.body.sensors, 'sensors');
    const featuresRaw = parseJSONField(req.body.acousticFeatures, 'acousticFeatures');
    const acousticFeatures = featuresRaw && req.files?.audio ? acousticFeaturesSchema.parse(featuresRaw) : undefined;

    const report = await runAnalysis({
      userId: req.user._id,
      files: req.files || {},
      text: body.text,
      objectHint: body.objectHint,
      thumbnail: body.thumbnail,
      sensorsInput,
      acousticFeatures,
    });
    res.status(201).json({ success: true, data: report });
  })
);

// GET /api/analysis?search=&category=&page=&limit=
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = z
      .object({
        search: z.string().trim().max(100).optional(),
        category: z.string().trim().max(40).optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(12),
      })
      .parse(req.query);

    const filter = { user: req.user._id };
    if (q.category && q.category !== 'All') {
      if (q.category === 'Inconclusive') filter.status = 'inconclusive';
      else filter['composition.primaryCategory'] = q.category;
    }
    if (q.search) {
      const safe = q.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [{ objectName: { $regex: safe, $options: 'i' } }, { 'composition.primaryMaterialName': { $regex: safe, $options: 'i' } }];
    }

    // sanitizeFilter is on globally; we build operators ourselves so trust() them.
    const query = mongoose.trusted(filter);
    const [items, total] = await Promise.all([
      Analysis.find(query)
        .sort({ createdAt: -1 })
        .skip((q.page - 1) * q.limit)
        .limit(q.limit)
        .select('objectName status composition.primaryMaterialName composition.primaryCategory composition.structure confidence.level evidenceMeta.modalities evidenceMeta.image.thumbnail createdAt')
        .lean(),
      Analysis.countDocuments(query),
    ]);
    res.json({ success: true, data: { items, total, page: q.page, pages: Math.ceil(total / q.limit) } });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    ensureId(req.params.id);
    const report = await Analysis.findOne({ _id: req.params.id, user: req.user._id }).lean();
    if (!report) throw new ApiError(404, 'Report not found');
    // Track recently viewed (most recent first, max 6).
    await User.updateOne({ _id: req.user._id }, mongoose.trusted({ $pull: { recentlyViewed: report._id } }));
    await User.updateOne({ _id: req.user._id }, mongoose.trusted({ $push: { recentlyViewed: { $each: [report._id], $position: 0, $slice: 6 } } }));
    res.json({ success: true, data: report });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    ensureId(req.params.id);
    const result = await Analysis.deleteOne({ _id: req.params.id, user: req.user._id });
    if (!result.deletedCount) throw new ApiError(404, 'Report not found');
    await User.updateOne({ _id: req.user._id }, mongoose.trusted({ $pull: { recentlyViewed: req.params.id } }));
    res.json({ success: true, data: { id: req.params.id } });
  })
);

export default router;

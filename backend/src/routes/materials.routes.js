import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Material } from '../models/Material.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

const router = Router();

const listQuery = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(40).optional(),
});

async function search(req, res) {
  const { q, category } = listQuery.parse(req.query);
  const filter = {};
  if (category && category !== 'All') filter.category = category;
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = ['name', 'aliases', 'commonExamples', 'category'].map((f) => ({ [f]: { $regex: safe, $options: 'i' } }));
  }
  const items = await Material.find(mongoose.trusted(filter)).sort({ category: 1, name: 1 }).lean();
  res.json({ success: true, data: items });
}

// Public: the knowledge library is reference information.
router.get('/', asyncHandler(search));
router.get('/search', asyncHandler(search));

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const filter = mongoose.isValidObjectId(id) ? { _id: id } : { key: String(id).slice(0, 40) };
    const item = await Material.findOne(filter).lean();
    if (!item) throw new ApiError(404, 'Material not found');
    res.json({ success: true, data: item });
  })
);

export default router;

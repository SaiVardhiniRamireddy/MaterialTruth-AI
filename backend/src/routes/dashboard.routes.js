import { Router } from 'express';
import { Analysis } from '../models/Analysis.js';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();

// All statistics are aggregated from the user's real analysis records.
router.get(
  '/stats',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const [total, byCategory, byConfidence, byStructure, byModality, recent, recyclableAgg, userDoc] = await Promise.all([
      Analysis.countDocuments({ user: userId }),
      Analysis.aggregate([{ $match: { user: userId } }, { $group: { _id: '$composition.primaryCategory', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Analysis.aggregate([{ $match: { user: userId } }, { $group: { _id: '$confidence.level', count: { $sum: 1 } } }]),
      Analysis.aggregate([{ $match: { user: userId } }, { $group: { _id: '$composition.structure', count: { $sum: 1 } } }]),
      Analysis.aggregate([{ $match: { user: userId } }, { $unwind: '$evidenceMeta.modalities' }, { $group: { _id: '$evidenceMeta.modalities', count: { $sum: 1 } } }]),
      Analysis.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('objectName status composition.primaryMaterialName composition.primaryCategory confidence.level evidenceMeta.image.thumbnail createdAt')
        .lean(),
      Analysis.aggregate([
        { $match: { user: userId, status: 'completed' } },
        { $unwind: '$ecoImpact' },
        { $match: { 'ecoImpact.isPrimary': true } },
        { $group: { _id: '$ecoImpact.recyclability.level', count: { $sum: 1 } } },
      ]),
      User.findById(userId).populate({ path: 'recentlyViewed', select: 'objectName composition.primaryMaterialName confidence.level createdAt' }).lean(),
    ]);

    const toObj = (arr) => Object.fromEntries(arr.map((x) => [x._id || 'Unknown', x.count]));
    const recyclability = toObj(recyclableAgg);
    const widely = (recyclability['Widely recycled'] || 0) + (recyclability['Often recycled'] || 0);
    const completed = recyclableAgg.reduce((s, x) => s + x.count, 0);
    const composites = toObj(byStructure)['Multilayer composite'] || 0;

    const insights = [];
    if (total === 0) insights.push('Run your first analysis to start building your sustainability profile.');
    else {
      if (completed) insights.push(`${Math.round((widely / completed) * 100)}% of your identified items are made of commonly recycled materials.`);
      if (composites) insights.push(`${composites} item${composites > 1 ? 's were' : ' was'} suspected multilayer packaging — these are rarely recyclable kerbside, so look for take-back schemes.`);
      const inconclusive = toObj(byConfidence).Inconclusive || 0;
      if (inconclusive) insights.push(`${inconclusive} analysis${inconclusive > 1 ? 'es were' : ' was'} inconclusive. Adding a clear label photo usually improves certainty.`);
    }

    res.json({
      success: true,
      data: {
        total,
        byCategory: byCategory.map((c) => ({ category: c._id || 'Unknown', count: c.count })),
        byConfidence: toObj(byConfidence),
        byStructure: toObj(byStructure),
        byModality: toObj(byModality),
        recyclability,
        recent,
        recentlyViewed: (userDoc?.recentlyViewed || []).filter(Boolean),
        insights,
      },
    });
  })
);

export default router;

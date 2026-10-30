import mongoose from 'mongoose';
import { Material } from '../models/Material.js';

/**
 * EcoImpact Intelligence: looks up VERIFIED knowledge records for each identified
 * component. Nothing here is AI-generated. Missing records are reported as unavailable.
 */
export async function buildEcoImpact(layers, primaryKey) {
  const keys = [...new Set([primaryKey, ...layers.map((l) => l.materialKey)].filter((k) => k && k !== 'unknown'))];
  if (!keys.length) return [];
  const records = await Material.find(mongoose.trusted({ key: { $in: keys } })).lean();
  const byKey = Object.fromEntries(records.map((r) => [r.key, r]));

  return keys.map((key) => {
    const r = byKey[key];
    const usedBy = layers.filter((l) => l.materialKey === key).map((l) => l.position);
    if (!r) return { materialKey: key, available: false, message: 'Verified environmental information unavailable for this material.' };
    return {
      materialKey: key,
      materialId: r._id,
      available: true,
      isPrimary: key === primaryKey,
      components: usedBy,
      name: r.name,
      category: r.category,
      composition: r.composition,
      properties: r.properties,
      biodegradability: r.biodegradability,
      recyclability: r.recyclability,
      decomposition: r.decomposition,
      environmentalImpact: r.environmentalImpact,
      sources: r.sources,
      lastVerified: r.lastVerified,
    };
  });
}

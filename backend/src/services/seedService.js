import { Material } from '../models/Material.js';
import { materials } from '../data/materials.js';

/** Upserts curated records; safe to run repeatedly. */
export async function seedMaterials({ verbose = false } = {}) {
  const lastVerified = new Date('2026-10-30');
  const ops = materials.map((m) => ({
    updateOne: { filter: { key: m.key }, update: { $set: { ...m, lastVerified } }, upsert: true },
  }));
  // bulkWrite bypasses sanitizeFilter concerns since the data is trusted server-side.
  const res = await Material.bulkWrite(ops);
  if (verbose) console.log(`[seed] materials upserted=${res.upsertedCount} modified=${res.modifiedCount}`);
}

import mongoose from 'mongoose';

const sourceSchema = new mongoose.Schema(
  {
    organisation: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, enum: ['government', 'peer-reviewed', 'standard', 'organisation'], required: true },
  },
  { _id: false }
);

const materialSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['Plastic', 'Paper & Fibre', 'Metal', 'Glass', 'Organic', 'Textile', 'Composite'],
    },
    aliases: [String],
    resinCode: { type: Number, default: null },
    commonExamples: [String],
    properties: [String],
    biodegradability: {
      classification: {
        type: String,
        enum: ['Biodegradable', 'Conditionally biodegradable', 'Non-biodegradable', 'Not applicable'],
      },
      notes: String,
    },
    recyclability: {
      level: { type: String, enum: ['Widely recycled', 'Often recycled', 'Limited', 'Rarely recycled', 'Specialised only'] },
      notes: String,
    },
    composition: { type: String, enum: ['Single material', 'Composite'], default: 'Single material' },
    decomposition: {
      process: { type: String, enum: ['Biodegradation', 'Fragmentation', 'Corrosion', 'Mixed', 'Negligible'] },
      // Ranges are commonly cited estimates, never constants. null => unavailable.
      timeframe: {
        min: { type: Number, default: null },
        max: { type: Number, default: null },
        unit: { type: String, enum: ['days', 'months', 'years', null], default: null },
        qualifier: String,
      },
      description: String,
      conditions: [String],
      requiresIndustrial: { type: Boolean, default: false },
      persistent: { type: Boolean, default: false },
    },
    environmentalImpact: {
      persistence: String,
      microplastics: String,
      wildlife: String,
      soilWater: String,
      landfill: String,
      recyclingBenefits: String,
    },
    disposal: {
      primary: { type: String, enum: ['Reuse', 'Recycle', 'Home composting', 'Industrial composting', 'Specialised collection', 'General waste'] },
      actions: [String],
      steps: [String],
    },
    sources: [sourceSchema],
    lastVerified: { type: Date, required: true },
  },
  { timestamps: true }
);

materialSchema.index({ name: 'text', aliases: 'text', commonExamples: 'text', category: 'text' });

export const Material = mongoose.model('Material', materialSchema);

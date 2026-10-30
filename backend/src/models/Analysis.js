import mongoose from 'mongoose';

const Mixed = mongoose.Schema.Types.Mixed;

const layerSchema = new mongoose.Schema(
  {
    position: String, // e.g. "Outer", "Inner", "Lid", "Body"
    role: String,
    materialKey: String,
    materialName: String,
    status: { type: String, enum: ['Confirmed', 'Suspected'] },
    confidence: { type: String, enum: ['High', 'Medium', 'Low', 'Inconclusive'] },
    evidence: [String],
  },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    objectName: { type: String, default: 'Unidentified object' },
    status: { type: String, enum: ['completed', 'inconclusive'], default: 'completed' },
    evidenceMeta: {
      modalities: [String],
      image: Mixed, // { mime, size, width?, thumbnail(dataURL) }
      labelImage: Mixed,
      audio: Mixed,
      text: String,
      sensors: Mixed,
    },
    evidence: {
      image: Mixed,
      label: Mixed,
      text: Mixed,
      audio: Mixed,
      sensors: Mixed,
    },
    composition: {
      primaryMaterialKey: String,
      primaryMaterialName: String,
      primaryCategory: String,
      structure: { type: String, enum: ['Single material', 'Multi-material', 'Multilayer composite', 'Unknown'] },
      layers: [layerSchema],
      summary: String,
    },
    confidence: {
      level: { type: String, enum: ['High', 'Medium', 'Low', 'Inconclusive'] },
      reasons: [String],
      aiSelfAssessment: String,
    },
    ecoImpact: [Mixed], // snapshot of verified records per component
    disposal: Mixed,
    limitations: [String],
    suggestions: [String],
    model: String,
  },
  { timestamps: true }
);

analysisSchema.index({ objectName: 'text', 'composition.primaryMaterialName': 'text' });

export const Analysis = mongoose.model('Analysis', analysisSchema);

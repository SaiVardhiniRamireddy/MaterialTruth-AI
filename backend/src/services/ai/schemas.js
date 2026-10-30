import { materials } from '../../data/materials.js';

export const MATERIAL_KEYS = materials.map((m) => m.key);
export const MATERIAL_KEY_ENUM = [...MATERIAL_KEYS, 'unknown'];

export const materialCatalogText = materials
  .map((m) => `- ${m.key}: ${m.name} [${m.category}]${m.resinCode ? ` resin code ${m.resinCode}` : ''}`)
  .join('\n');

const symbolSchema = {
  type: 'OBJECT',
  properties: {
    symbol: { type: 'STRING', description: 'What the symbol looks like, e.g. "chasing-arrows triangle with 1 and PET"' },
    code: { type: 'STRING', description: 'The literal code text exactly as printed, or empty if unreadable' },
    readable: { type: 'BOOLEAN' },
  },
  required: ['symbol', 'code', 'readable'],
};

export const imageEvidenceSchema = {
  type: 'OBJECT',
  properties: {
    objectName: { type: 'STRING' },
    objectRecognition: { type: 'STRING', enum: ['clear', 'probable', 'uncertain'] },
    description: { type: 'STRING' },
    visualCharacteristics: {
      type: 'OBJECT',
      properties: {
        texture: { type: 'STRING' },
        transparency: { type: 'STRING' },
        colour: { type: 'STRING' },
        surface: { type: 'STRING' },
        rigidityCues: { type: 'STRING' },
      },
      required: ['texture', 'transparency', 'colour', 'surface', 'rigidityCues'],
    },
    visibleComponents: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          component: { type: 'STRING' },
          appearance: { type: 'STRING' },
          candidateMaterials: { type: 'ARRAY', items: { type: 'STRING', description: 'Material key from catalogue' } },
        },
        required: ['component', 'appearance', 'candidateMaterials'],
      },
    },
    layerCues: { type: 'ARRAY', items: { type: 'STRING' } },
    recyclingSymbols: { type: 'ARRAY', items: symbolSchema },
    ocrText: { type: 'STRING', description: 'All legible printed text verbatim; empty if none' },
    imageQuality: { type: 'STRING', enum: ['good', 'fair', 'poor'] },
    limitations: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['objectName', 'objectRecognition', 'description', 'visualCharacteristics', 'visibleComponents', 'layerCues', 'recyclingSymbols', 'ocrText', 'imageQuality', 'limitations'],
};

export const labelEvidenceSchema = {
  type: 'OBJECT',
  properties: {
    ocrText: { type: 'STRING', description: 'All legible text verbatim' },
    materialStatements: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Verbatim phrases describing material/packaging composition or disposal' },
    recyclingSymbols: { type: 'ARRAY', items: symbolSchema },
    readability: { type: 'STRING', enum: ['good', 'partial', 'unreadable'] },
    limitations: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['ocrText', 'materialStatements', 'recyclingSymbols', 'readability', 'limitations'],
};

export const audioEvidenceSchema = {
  type: 'OBJECT',
  properties: {
    soundType: { type: 'STRING', enum: ['tap', 'knock', 'crinkle', 'scrape', 'squeeze', 'speech', 'silence', 'noise', 'other'] },
    usable: { type: 'BOOLEAN', description: 'True only if a handling/tapping sound of an object is clearly audible' },
    description: { type: 'STRING' },
    acousticCues: { type: 'ARRAY', items: { type: 'STRING' } },
    consistentWithFamilies: {
      type: 'ARRAY',
      items: { type: 'STRING', enum: ['Plastic', 'Paper & Fibre', 'Metal', 'Glass', 'Organic', 'Textile', 'Composite'] },
    },
    limitations: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['soundType', 'usable', 'description', 'acousticCues', 'consistentWithFamilies', 'limitations'],
};

export const fusionSchema = {
  type: 'OBJECT',
  properties: {
    outcome: { type: 'STRING', enum: ['identified', 'inconclusive'] },
    objectName: { type: 'STRING' },
    structure: { type: 'STRING', enum: ['Single material', 'Multi-material', 'Multilayer composite', 'Unknown'] },
    primaryMaterialKey: { type: 'STRING', description: 'One exact key from the catalogue, or "unknown"' },
    summary: { type: 'STRING' },
    layers: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          position: { type: 'STRING', description: 'e.g. Outer layer, Inner layer, Body, Lid, Label, Cap' },
          role: { type: 'STRING', description: 'Function, e.g. printing surface, moisture/oxygen barrier, structure, seal' },
          materialKey: { type: 'STRING', description: 'One exact key from the catalogue, or "unknown"' },
          basis: { type: 'STRING', enum: ['label_or_code', 'directly_visible', 'inferred'] },
          confidence: { type: 'STRING', enum: ['High', 'Medium', 'Low', 'Inconclusive'] },
          evidence: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['position', 'role', 'materialKey', 'basis', 'confidence', 'evidence'],
      },
    },
    selfConfidence: { type: 'STRING', enum: ['High', 'Medium', 'Low', 'Inconclusive'] },
    confidenceReason: { type: 'STRING' },
    limitations: { type: 'ARRAY', items: { type: 'STRING' } },
    suggestions: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Additional evidence that would improve certainty' },
  },
  required: ['outcome', 'objectName', 'structure', 'primaryMaterialKey', 'summary', 'layers', 'selfConfidence', 'confidenceReason', 'limitations', 'suggestions'],
};

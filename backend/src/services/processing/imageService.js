import { generateJSON, inline } from '../ai/geminiClient.js';
import { imageEvidenceSchema, labelEvidenceSchema, materialCatalogText } from '../ai/schemas.js';

const IMAGE_SYSTEM = `You are the visual evidence extractor of MaterialTruth AI, a material identification system.
Describe ONLY what is visible in the photo. Rules:
- Never claim exact chemical composition from a photo.
- Hidden layers are never "visible"; report possible layer cues (e.g. metallic inner sheen, peeling film at a torn edge) as cues only.
- Transcribe recycling codes/text EXACTLY as printed. If a symbol is present but unreadable, set readable=false and code="". Never guess a code.
- candidateMaterials must come from this catalogue (use "unknown" if nothing fits):
${materialCatalogText}
- If the image does not show a physical object or is too blurry, say so in limitations and set imageQuality="poor".`;

const LABEL_SYSTEM = `You are the OCR and label reader of MaterialTruth AI.
Transcribe ALL legible text verbatim into ocrText. Extract phrases that state material composition, recycling codes or disposal instructions into materialStatements, verbatim.
Never infer or invent text, codes or symbols that are not legible. If unreadable, set readability="unreadable".`;

export async function extractImageEvidence(file) {
  const result = await generateJSON({
    system: IMAGE_SYSTEM,
    schema: imageEvidenceSchema,
    parts: [inline(file.buffer, file.detectedMime), { text: 'Extract visual material evidence from this object photo.' }],
  });
  return { ...result, analysed: true };
}

export async function extractLabelEvidence(file) {
  const result = await generateJSON({
    system: LABEL_SYSTEM,
    schema: labelEvidenceSchema,
    temperature: 0,
    parts: [inline(file.buffer, file.detectedMime), { text: 'Read the packaging label / recycling symbols in this image.' }],
  });
  return { ...result, analysed: true };
}

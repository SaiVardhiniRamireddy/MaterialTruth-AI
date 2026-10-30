import { generateJSON } from './geminiClient.js';
import { fusionSchema, materialCatalogText } from './schemas.js';

const FUSION_SYSTEM = `You are the multimodal reasoning engine of MaterialTruth AI.
You receive evidence ALREADY EXTRACTED from the modalities the user actually provided. Combine it into a material composition estimate.

STRICT RULES
1. Use ONLY the evidence given. Never mention a modality that is marked "not provided".
2. Never invent material codes, text, sensor values or sources.
3. Never claim exact chemical composition from a photo.
4. For each layer/component set "basis":
   - "label_or_code": a literal code or composition statement in the label/OCR/user text supports it.
   - "directly_visible": the component is plainly visible (e.g. a separate lid, a paper sleeve).
   - "inferred": suspected from indirect cues (e.g. metallic sheen implies a possible metallised barrier). Hidden layers are ALWAYS "inferred".
5. Audio and sensor readings are supporting evidence only and cannot by themselves justify High confidence.
6. If evidence is weak, contradictory or the object cannot be recognised, set outcome="inconclusive", primaryMaterialKey="unknown", and explain what extra evidence would help in suggestions.
7. Use "Multilayer composite" only when bonded layers are suspected (e.g. chip bag, coated cup, carton). Use "Multi-material" for separable parts (e.g. glass jar + metal lid).
8. materialKey values must come from this verified catalogue (or "unknown"):
${materialCatalogText}`;

export async function fuseEvidence(evidenceDigest) {
  return generateJSON({
    system: FUSION_SYSTEM,
    schema: fusionSchema,
    temperature: 0.1,
    parts: [{ text: `EVIDENCE (JSON):\n${JSON.stringify(evidenceDigest, null, 2)}\n\nProduce the material composition estimate.` }],
  });
}

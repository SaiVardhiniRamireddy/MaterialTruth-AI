import { env } from '../config/env.js';
import { Analysis } from '../models/Analysis.js';
import { ApiError } from '../utils/errors.js';
import { extractImageEvidence, extractLabelEvidence } from './processing/imageService.js';
import { extractAudioEvidence } from './processing/audioService.js';
import { processTextInput, parseMaterialTerms } from './processing/textService.js';
import { processSensors } from './processing/sensorService.js';
import { fuseEvidence } from './ai/fusionService.js';
import { MATERIAL_KEY_ENUM } from './ai/schemas.js';
const VALID_KEYS = new Set(MATERIAL_KEY_ENUM);
import { assessConfidence, normaliseLayers, categoryOf } from './confidenceEngine.js';
import { buildEcoImpact } from './ecoImpactService.js';
import { buildDisposal } from './disposalService.js';

const NOT_PROVIDED = 'not provided';

/**
 * Full pipeline:
 * validate → per-modality extraction → fusion → confidence → verified lookup → disposal → store
 */
export async function runAnalysis({ userId, files, text, sensorsInput, acousticFeatures, thumbnail, objectHint }) {
  const image = files.image?.[0];
  const labelImage = files.labelImage?.[0];
  const audio = files.audio?.[0];
  const textResult = processTextInput(text);
  const sensors = processSensors(sensorsInput);

  const modalities = [
    image && 'image',
    labelImage && 'label',
    audio && 'audio',
    textResult.analysed && 'text',
    sensors.analysed && 'sensors',
  ].filter(Boolean);

  if (!image && !labelImage && !audio && !textResult.analysed) {
    throw new ApiError(400, 'Provide at least an image, label photo, audio recording or packaging text. Sensor readings alone are not enough to identify a material.');
  }

  // 1. Evidence extraction — modalities run in parallel and only when provided.
  const [imageEv, labelEv, audioEv] = await Promise.all([
    image ? extractImageEvidence(image) : null,
    labelImage ? extractLabelEvidence(labelImage) : null,
    audio ? extractAudioEvidence(audio, acousticFeatures) : null,
  ]);

  // 2. Deterministic code/term detection over user text and every OCR result.
  const labelDetections = [
    ...textResult.detections,
    ...parseMaterialTerms(labelEv?.ocrText, 'label_ocr'),
    ...parseMaterialTerms((labelEv?.recyclingSymbols || []).filter((s) => s.readable).map((s) => s.code).join(' '), 'label_symbol'),
    ...parseMaterialTerms(imageEv?.ocrText, 'image_ocr'),
    ...parseMaterialTerms((imageEv?.recyclingSymbols || []).filter((s) => s.readable).map((s) => s.code).join(' '), 'image_symbol'),
  ];
  const textEvidence = { ...textResult, ocrDetections: labelDetections.filter((d) => d.source !== 'user_text') };

  // 3. Fusion
  const digest = {
    objectHint: objectHint || NOT_PROVIDED,
    image: imageEv || NOT_PROVIDED,
    labelImage: labelEv || NOT_PROVIDED,
    packagingText: textResult.analysed ? textResult.text : NOT_PROVIDED,
    detectedCodesAndTerms: labelDetections.length ? labelDetections : 'none detected',
    audio: audioEv ? { signalAnalysis: audioEv.signalAnalysis || 'client features unavailable', listening: audioEv.ai } : NOT_PROVIDED,
    sensors: sensors.analysed ? { readings: sensors.readings, observations: sensors.observations } : NOT_PROVIDED,
  };
  const fusion = await fuseEvidence(digest);

  // 4. Confidence & layers
  const layers = normaliseLayers(fusion.layers, labelDetections);
  // Clamp primaryMaterialKey: if model returns an unknown key, treat as 'unknown'
  const safePrimaryKey = VALID_KEYS.has(fusion.primaryMaterialKey) ? fusion.primaryMaterialKey : 'unknown';
  const confidence = assessConfidence({ fusion: { ...fusion, primaryMaterialKey: safePrimaryKey }, labelDetections, image: imageEv, audio: audioEv, sensors });
  const inconclusive = confidence.level === 'Inconclusive';
  const primaryKey = inconclusive ? 'unknown' : safePrimaryKey;

  // 5. Verified EcoImpact + disposal
  const ecoImpact = inconclusive ? [] : await buildEcoImpact(layers, primaryKey);
  const disposal = await buildDisposal({ primaryKey, structure: fusion.structure, layers, confidence: confidence.level });
  const primaryRecord = ecoImpact.find((e) => e.materialKey === primaryKey);

  const limitations = [
    ...new Set([
      'Material identity is an AI estimate from consumer-grade evidence; exact chemical composition cannot be determined from photos or sound.',
      ...(fusion.limitations || []),
      ...(imageEv?.limitations || []),
      ...(labelEv?.limitations || []),
      ...(audioEv ? audioEv.ai.limitations || [] : []),
      ...(audioEv?.signalAnalysis?.caveats || []),
    ]),
  ].slice(0, 12);

  const report = await Analysis.create({
    user: userId,
    objectName: fusion.objectName || imageEv?.objectName || 'Unidentified object',
    status: inconclusive ? 'inconclusive' : 'completed',
    evidenceMeta: {
      modalities,
      image: image ? { mime: image.detectedMime, size: image.size, thumbnail } : null,
      labelImage: labelImage ? { mime: labelImage.detectedMime, size: labelImage.size } : null,
      audio: audio ? { mime: audio.detectedMime, size: audio.size, durationSec: acousticFeatures?.durationSec ?? null } : null,
      text: textResult.analysed ? textResult.text : '',
      sensors: sensors.analysed ? sensors.readings : null,
    },
    evidence: {
      image: imageEv,
      label: labelEv,
      text: textResult.analysed || labelDetections.length ? textEvidence : null,
      audio: audioEv,
      sensors: sensors.analysed ? sensors : null,
    },
    composition: {
      primaryMaterialKey: primaryKey,
      primaryMaterialName: primaryRecord?.name || (inconclusive ? 'Inconclusive' : 'Unknown material'),
      primaryCategory: categoryOf(primaryKey) || 'Unknown',
      structure: inconclusive ? 'Unknown' : fusion.structure,
      layers,
      summary: fusion.summary,
    },
    confidence,
    ecoImpact,
    disposal,
    limitations,
    suggestions: fusion.suggestions || [],
    model: env.geminiModel,
  });

  return report;
}

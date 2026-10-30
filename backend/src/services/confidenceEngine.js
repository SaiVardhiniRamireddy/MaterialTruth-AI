import { materials } from '../data/materials.js';

const LEVELS = ['Inconclusive', 'Low', 'Medium', 'High'];
const rank = (l) => Math.max(0, LEVELS.indexOf(l));
const minLevel = (...ls) => LEVELS[Math.min(...ls.map(rank))];
const down = (l) => LEVELS[Math.max(0, rank(l) - 1)];
const byKey = Object.fromEntries(materials.map((m) => [m.key, m]));
export const categoryOf = (key) => byKey[key]?.category;

// Materials whose label term is a legitimate component of a composite.
const COMPOSITE_PARTS = {
  multilayer_flexible: ['pp', 'ldpe', 'pet', 'aluminium'],
  liquid_carton: ['paper', 'cardboard', 'ldpe', 'aluminium'],
  coated_paper: ['paper', 'cardboard', 'ldpe'],
};

/**
 * Rule-based Material Confidence Engine.
 * The final level is the MINIMUM of the evidence rules and the AI's self-assessment,
 * so the model can never talk its way into higher confidence than the evidence allows.
 * No numeric percentages are produced because no calibrated score exists.
 */
export function assessConfidence({ fusion, labelDetections, image, audio, sensors }) {
  const reasons = [];
  const primary = fusion.primaryMaterialKey;

  if (fusion.outcome === 'inconclusive' || !primary || primary === 'unknown') {
    reasons.push('The available evidence was insufficient or contradictory to identify a primary material.');
    return { level: 'Inconclusive', reasons, aiSelfAssessment: fusion.selfConfidence };
  }

  const primaryCat = categoryOf(primary);
  const labelKeys = new Set(labelDetections.map((d) => d.materialKey));
  const explicitDirect = labelKeys.has(primary);

  const visualCandidates = new Set((image?.visibleComponents || []).flatMap((c) => c.candidateMaterials || []));
  const visual = image?.analysed && (visualCandidates.has(primary) || [...visualCandidates].some((k) => categoryOf(k) === primaryCat));

  const conflicting = [...labelKeys].filter((k) => {
    if (k === primary) return false;
    if ((COMPOSITE_PARTS[primary] || []).includes(k)) return false;
    if (fusion.layers?.some((l) => l.materialKey === k)) return false; // label term explained by a layer
    return true;
  });

  const audioFamilies = new Set([...(audio?.signalAnalysis?.families || []), ...(audio?.ai?.usable ? audio.ai.consistentWithFamilies : [])]);
  const audioSupports = audio?.analysed && audioFamilies.has(primaryCat);
  const audioContradicts = audio?.analysed && audio?.ai?.usable && audioFamilies.size > 0 && !audioFamilies.has(primaryCat);
  const sensorSupports = sensors?.analysed && (sensors.supportsFamilies || []).includes(primaryCat);
  const sensorContradicts = sensors?.analysed && (sensors.contradictsKeys || []).includes(primary);

  let level;
  if (explicitDirect && visual) {
    level = 'High';
    reasons.push(`The packaging label/text explicitly identifies ${byKey[primary].name}, and the visual evidence is consistent with it.`);
  } else if (explicitDirect) {
    level = 'Medium';
    reasons.push(`Label/text explicitly mentions ${byKey[primary].name}, but there is no image to confirm the label belongs to this object.`);
  } else if (visual && (audioSupports || sensorSupports)) {
    level = 'Medium';
    reasons.push(`Visual characteristics suggest ${primaryCat.toLowerCase()} and ${[audioSupports && 'acoustic', sensorSupports && 'sensor'].filter(Boolean).join(' and ')} evidence is consistent, but no material code or label confirms it.`);
  } else if (visual) {
    level = 'Low';
    reasons.push(`The object appears to be ${primaryCat.toLowerCase()} from its appearance, but no material code or reliable packaging information is available.`);
  } else {
    level = 'Low';
    reasons.push('The estimate relies on indirect evidence only (no consistent visual or label confirmation).');
  }

  if (conflicting.length) {
    level = minLevel(level, 'Low');
    reasons.push(`Label/text mentions ${conflicting.map((k) => byKey[k]?.name || k).join(', ')}, which conflicts with the visual estimate.`);
  }
  if (audioContradicts) {
    level = down(level);
    reasons.push('The tapping/handling sound is not typical of the estimated material family, so confidence was reduced.');
  }
  if (sensorContradicts) {
    level = minLevel(level, 'Low');
    reasons.push('Sensor readings contradict the estimated material.');
  }
  if (image?.analysed && image.imageQuality === 'poor') {
    level = down(level);
    reasons.push('Image quality is poor, which limits visual analysis.');
  }
  if (primaryCat === 'Composite' && !explicitDirect && level === 'High') {
    level = 'Medium';
    reasons.push('Hidden layers in composite packaging are inferred, not directly observable.');
  }

  const finalLevel = minLevel(level, fusion.selfConfidence || 'Low');
  if (rank(finalLevel) < rank(level)) reasons.push(`The AI reasoning stage assessed its own estimate as ${fusion.selfConfidence}: ${fusion.confidenceReason}`);
  return { level: finalLevel, reasons, aiSelfAssessment: fusion.selfConfidence };
}

/** Normalises layers: only label/code-backed layers can be "Confirmed". */
export function normaliseLayers(fusionLayers = [], labelDetections = []) {
  const labelKeys = new Set(labelDetections.map((d) => d.materialKey));
  return fusionLayers.map((l) => {
    // Clamp any model hallucination to a known key
    const key = byKey[l.materialKey] ? l.materialKey : 'unknown';
    const confirmed = l.basis === 'label_or_code' && labelKeys.has(key);
    let confidence = l.confidence;
    if (l.basis === 'inferred') confidence = minLevel(confidence, 'Medium');
    if (l.basis === 'label_or_code' && !confirmed) confidence = minLevel(confidence, 'Low');
    const evidence = [...(l.evidence || [])];
    if (l.basis === 'label_or_code' && !confirmed) evidence.push('AI cited label evidence, but no matching code/term was found in the extracted text — treated as suspected.');
    if (l.basis === 'inferred') evidence.push('Inferred from indirect cues — not directly visible.');
    return {
      position: l.position,
      role: l.role,
      materialKey: key,
      materialName: byKey[key]?.name || 'Unknown material',
      status: confirmed ? 'Confirmed' : 'Suspected',
      confidence: key === 'unknown' ? 'Inconclusive' : confidence,
      evidence,
    };
  });
}

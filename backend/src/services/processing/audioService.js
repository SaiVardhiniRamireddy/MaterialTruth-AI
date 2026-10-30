import { z } from 'zod';
import { generateJSON, inline } from '../ai/geminiClient.js';
import { audioEvidenceSchema } from '../ai/schemas.js';

/**
 * Acoustic features are computed in the browser with the Web Audio API
 * (decoding WebM/MP3/M4A in Node would require ffmpeg). The backend validates
 * them strictly and derives conservative interpretations. The raw audio is
 * also sent to Gemini, which accepts audio natively, for a qualitative check.
 */
export const acousticFeaturesSchema = z
  .object({
    durationSec: z.number().min(0).max(120),
    sampleRate: z.number().int().min(8000).max(192000),
    peakAmplitude: z.number().min(0).max(1),
    rms: z.number().min(0).max(1),
    dominantFrequencyHz: z.number().min(0).max(96000),
    spectralCentroidHz: z.number().min(0).max(96000),
    highFreqRatio: z.number().min(0).max(1), // energy above 4 kHz / total
    decayTimeMs: z.number().min(0).max(120000).nullable(), // time for onset envelope to fall 20 dB
    onsetCount: z.number().int().min(0).max(1000),
    zeroCrossingRate: z.number().min(0).max(1),
    bands: z.array(z.object({ label: z.string().max(20), energy: z.number().min(0).max(1) })).max(16).optional(),
  })
  .strict();

export function interpretAcoustics(f) {
  const cues = [];
  const caveats = [
    'Acoustic cues are supporting evidence only; tap force, object size, thickness, shape, contents and the surface it rests on all change the sound.',
  ];
  if (!f || f.peakAmplitude < 0.02) {
    return { usable: false, cues: ['Recording is too quiet to extract reliable acoustic features.'], families: [], caveats };
  }
  const families = new Set();
  const longRing = f.decayTimeMs !== null && f.decayTimeMs > 250;
  const shortDecay = f.decayTimeMs !== null && f.decayTimeMs < 80;

  if (longRing && f.spectralCentroidHz > 2500) {
    cues.push(`Sustained, bright resonance (decay ≈ ${Math.round(f.decayTimeMs)} ms, centroid ≈ ${Math.round(f.spectralCentroidHz)} Hz) — typical of rigid, low-damping materials.`);
    families.add('Glass').add('Metal');
  } else if (longRing) {
    cues.push(`Sustained lower-pitched resonance (decay ≈ ${Math.round(f.decayTimeMs)} ms) — consistent with a rigid hollow body such as a can or thick container.`);
    families.add('Metal').add('Plastic');
  }
  if (shortDecay && f.spectralCentroidHz < 2000) {
    cues.push(`Short, dull sound (decay ≈ ${Math.round(f.decayTimeMs)} ms) — indicates high internal damping, as in paperboard, soft plastics or fabric.`);
    families.add('Paper & Fibre').add('Plastic').add('Textile');
  }
  if (f.highFreqRatio > 0.45 && f.onsetCount > 8 && f.zeroCrossingRate > 0.15) {
    cues.push('Many rapid broadband transients — a crinkling pattern typical of thin films and foils.');
    families.add('Plastic').add('Composite').add('Metal');
  }
  if (!cues.length) cues.push('Acoustic profile is not distinctive enough to suggest a material family.');
  return { usable: families.size > 0, cues, families: [...families], caveats };
}

const AUDIO_SYSTEM = `You are the acoustic evidence analyst of MaterialTruth AI.
Listen to a short recording of someone safely tapping, squeezing or handling an object.
Describe what you hear (resonance, pitch, ring/decay, crinkle). State which material families the sound is CONSISTENT WITH — never claim certainty.
If the clip is silence, speech, or background noise without a clear object sound, set usable=false.`;

export async function extractAudioEvidence(file, features) {
  const local = features ? interpretAcoustics(features) : null;
  const ai = await generateJSON({
    system: AUDIO_SYSTEM,
    schema: audioEvidenceSchema,
    parts: [inline(file.buffer, file.detectedMime), { text: 'Analyse this handling/tapping sound.' }],
  });
  return { analysed: true, features: features || null, signalAnalysis: local, ai };
}

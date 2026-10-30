import { z } from 'zod';

const num = (min, max) => z.coerce.number().finite().min(min).max(max);

export const sensorSchema = z
  .object({
    weightGrams: num(0.01, 50000).optional(),
    volumeCm3: num(0.01, 100000).optional(),
    temperatureC: num(-40, 150).optional(),
    ambientTemperatureC: num(-40, 60).optional(),
    magnetic: z.enum(['yes', 'no', 'unknown']).optional(),
  })
  .strict();

// Typical bulk densities (g/cm³) of solid materials – textbook ranges.
const DENSITY = [
  { family: 'Plastic', note: 'polyolefins (PE/PP)', min: 0.85, max: 0.97 },
  { family: 'Plastic', note: 'PET / PVC / PS', min: 1.04, max: 1.45 },
  { family: 'Paper & Fibre', note: 'paper / board', min: 0.6, max: 1.2 },
  { family: 'Metal', note: 'aluminium', min: 2.6, max: 2.8 },
  { family: 'Glass', note: 'soda-lime glass', min: 2.4, max: 2.6 },
  { family: 'Metal', note: 'steel', min: 7.7, max: 8.1 },
];

export function processSensors(input) {
  if (!input || !Object.values(input).some((v) => v !== undefined && v !== 'unknown')) {
    return { analysed: false, readings: {}, observations: [] };
  }
  const r = sensorSchema.parse(input);
  const observations = [];
  const supports = new Set();
  const contradicts = new Set();

  if (r.weightGrams !== undefined && r.volumeCm3 !== undefined) {
    const d = r.weightGrams / r.volumeCm3;
    const matches = DENSITY.filter((x) => d >= x.min * 0.9 && d <= x.max * 1.1);
    observations.push({
      reading: 'Apparent density',
      value: `${d.toFixed(2)} g/cm³`,
      interpretation: matches.length
        ? `Within the typical range of ${matches.map((m) => m.note).join(', ')}. Only meaningful if the volume entered is the volume of the material itself, not the enclosed space of a hollow item.`
        : 'Does not match a single solid material — likely because the volume includes air/contents, or the item is a composite.',
    });
    matches.forEach((m) => supports.add(m.family));
  } else if (r.weightGrams !== undefined) {
    observations.push({
      reading: 'Weight',
      value: `${r.weightGrams} g`,
      interpretation: 'Weight alone cannot determine material; it is recorded as context (e.g. a very light item argues against thick glass or steel). Add the material volume to compute density.',
    });
  }

  if (r.temperatureC !== undefined) {
    const delta = r.ambientTemperatureC !== undefined ? r.temperatureC - r.ambientTemperatureC : null;
    observations.push({
      reading: 'Surface temperature',
      value: `${r.temperatureC} °C${delta !== null ? ` (Δ ${delta >= 0 ? '+' : ''}${delta.toFixed(1)} °C vs ambient)` : ''}`,
      interpretation:
        'At equilibrium every object reaches ambient temperature, so a thermometer reading does not reveal material by itself. It is used as context (e.g. hot-fill or food-contact use) and to flag unsafe handling.',
    });
    if (r.temperatureC > 60) observations.push({ reading: 'Safety', value: 'Hot item', interpretation: 'Item is hot — allow to cool before handling or disposal.' });
  }

  if (r.magnetic === 'yes') {
    observations.push({ reading: 'Magnet test', value: 'Attracted', interpretation: 'Strong evidence of a ferrous metal (steel/tinplate) component.' });
    supports.add('Metal');
  } else if (r.magnetic === 'no') {
    observations.push({ reading: 'Magnet test', value: 'Not attracted', interpretation: 'Rules out steel for the tested area; aluminium, plastics, glass and paper are non-magnetic.' });
    contradicts.add('steel');
  }

  return { analysed: true, readings: r, observations, supportsFamilies: [...supports], contradictsKeys: [...contradicts] };
}

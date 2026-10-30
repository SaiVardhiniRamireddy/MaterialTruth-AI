import mongoose from 'mongoose';
import { Material } from '../models/Material.js';

const GENERAL_NOTICE =
  'General guidance only. Local recycling rules are not available for your area — acceptance varies by council and facility, so check your local authority before disposing.';

/**
 * Smart Disposal Advisor. Builds recommendations from verified records and the
 * identified structure. Composite and multi-material items get component-level advice.
 */
export async function buildDisposal({ primaryKey, structure, layers, confidence }) {
  if (!primaryKey || primaryKey === 'unknown' || confidence === 'Inconclusive') {
    return {
      headline: 'Material could not be identified reliably',
      primaryAction: 'General waste',
      steps: [
        'Look for a recycling symbol or material code on the item or its packaging.',
        'If you cannot determine the material, follow your local authority\'s guidance or dispose of it as general waste to avoid contaminating recycling.',
      ],
      components: [],
      isGeneralGuidance: true,
      notice: GENERAL_NOTICE,
    };
  }

  const keys = [...new Set([primaryKey, ...layers.map((l) => l.materialKey)].filter((k) => k && k !== 'unknown'))];
  const records = await Material.find(mongoose.trusted({ key: { $in: keys } })).lean();
  const byKey = Object.fromEntries(records.map((r) => [r.key, r]));
  const primary = byKey[primaryKey];

  let headline;
  let steps = [...(primary?.disposal?.steps || [])];
  const components = [];

  if (structure === 'Multi-material') {
    headline = 'Separate the components and dispose of each one appropriately';
    steps = ['Separate parts made of different materials (e.g. lid, body, label) where possible.', ...steps];
    for (const l of layers) {
      const r = byKey[l.materialKey];
      if (r) components.push({ component: l.position, material: r.name, action: r.disposal.primary, steps: r.disposal.steps, status: l.status });
    }
  } else if (structure === 'Multilayer composite') {
    headline = 'Bonded layers cannot be separated at home — use specialised collection if available';
    steps = [
      'Do not try to peel apart bonded layers.',
      ...(primary?.category === 'Composite' ? primary.disposal.steps : ['Check whether your local programme accepts this type of composite packaging.', 'Otherwise dispose of it as general waste.']),
    ];
    for (const l of layers) {
      const r = byKey[l.materialKey];
      if (r) components.push({ component: l.position, material: r.name, note: `${l.status} layer — bonded; handled as part of the composite, not separately.`, status: l.status });
    }
  } else {
    headline = primary ? `${primary.disposal.primary}: ${primary.name}` : 'Follow local guidance';
  }

  if (confidence === 'Low') {
    steps.push('Confidence is low — if unsure, do not place in recycling ("when in doubt, leave it out") and verify the material first.');
  }

  return {
    headline,
    primaryAction: primary?.category === 'Composite' || structure === 'Multilayer composite' ? 'Specialised collection' : primary?.disposal?.primary || 'General waste',
    actions: primary?.disposal?.actions || [],
    steps,
    components,
    isGeneralGuidance: true,
    notice: GENERAL_NOTICE,
  };
}

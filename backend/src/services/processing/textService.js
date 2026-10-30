/**
 * Deterministic text/code parser. Runs on user-entered packaging text and on
 * OCR output. Only reports terms that literally appear — never infers codes.
 */
const RULES = [
  { key: 'pet', patterns: [/\bPETE?\b/i, /polyethylene\s+terephthalate/i, /♳/, /(?:^|[^\d])#?\s?0?1\s*(?:PETE?)\b/i] },
  { key: 'hdpe', patterns: [/\bHDPE\b/i, /\bPE-?HD\b/i, /high[-\s]density\s+polyethylene/i, /♴/] },
  { key: 'pvc', patterns: [/\bPVC\b/i, /polyvinyl\s+chloride/i, /♵/] },
  { key: 'ldpe', patterns: [/\bL?LDPE\b/i, /\bPE-?LD\b/i, /low[-\s]density\s+polyethylene/i, /♶/] },
  { key: 'pp', patterns: [/\bB?O?PP\b/, /polypropylene/i, /♷/] },
  { key: 'ps', patterns: [/\bE?PS\b/, /polystyrene/i, /styrofoam/i, /♸/] },
  { key: 'other_plastic', patterns: [/\bpolycarbonate\b/i, /♹/, /\bOTHER\b/] },
  { key: 'pla', patterns: [/\bPLA\b/, /polylactic/i, /\bcompostable\b/i, /EN\s?13432/i] },
  { key: 'aluminium', patterns: [/\balumin(?:i)?um\b/i, /\bALU\b/i, /\bfoil\b/i] },
  { key: 'steel', patterns: [/\bsteel\b/i, /\btinplate\b/i, /\bFE\s?40\b/i] },
  { key: 'glass', patterns: [/\bglass\b/i, /\bGL\s?7[0-2]\b/i] },
  { key: 'cardboard', patterns: [/\bcardboard\b/i, /\bcorrugated\b/i, /\bpaperboard\b/i, /\bPAP\s?2[01]\b/i] },
  { key: 'paper', patterns: [/\bpaper\b/i, /\bkraft\b/i, /\bPAP\s?22\b/i] },
  { key: 'coated_paper', patterns: [/(?:plastic|PE|poly)[-\s]?(?:coated|lined|laminated)\s+(?:paper|board)/i, /C\/PAP\s?8[0-4]/i] },
  { key: 'liquid_carton', patterns: [/\b(?:tetra|aseptic|beverage)\s?(?:pak|carton)\b/i, /\bC\/PAP\s?84\b/i] },
  { key: 'multilayer_flexible', patterns: [/\bmulti[-\s]?layer/i, /\bmetalli[sz]ed\b/i, /\blaminate[d]?\b/i, /\bC\/(?:PP|LDPE|PE)\b/i] },
  { key: 'cotton', patterns: [/\bcotton\b/i] },
];

const RESIN_DIGIT = { 1: 'pet', 2: 'hdpe', 3: 'pvc', 4: 'ldpe', 5: 'pp', 6: 'ps', 7: 'other_plastic' };

export function parseMaterialTerms(text, source) {
  if (!text || !text.trim()) return [];
  const found = new Map();
  for (const rule of RULES) {
    for (const p of rule.patterns) {
      const m = text.match(p);
      if (m) {
        if (!found.has(rule.key)) found.set(rule.key, { materialKey: rule.key, matched: m[0].trim(), source });
        break;
      }
    }
  }
  // Explicit resin-code phrasing such as "resin code 5" / "recycling code 2" / "♻ 1"
  const resin = text.match(/(?:resin|recycl\w*)\s*(?:identification\s*)?code\s*#?\s*([1-7])\b/i) || text.match(/♻\s*([1-7])\b/);
  if (resin && !found.has(RESIN_DIGIT[resin[1]])) {
    found.set(RESIN_DIGIT[resin[1]], { materialKey: RESIN_DIGIT[resin[1]], matched: resin[0].trim(), source });
  }
  // "paper" also matches inside coated-paper statements; drop the weaker term in that case.
  if (found.has('coated_paper')) found.delete('paper');
  return [...found.values()];
}

export function processTextInput(text) {
  const clean = (text || '').slice(0, 2000);
  const detections = parseMaterialTerms(clean, 'user_text');
  return {
    analysed: Boolean(clean.trim()),
    text: clean,
    detections,
    note: detections.length
      ? 'Material terms were found literally in the text you entered. They are treated as label evidence but are only as reliable as the source text.'
      : 'No recognised material codes or composition terms were found in the entered text.',
  };
}

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { ApiError, asyncHandler } from '../utils/errors.js';
import { generateJSON } from '../services/ai/geminiClient.js';
import { z } from 'zod';

const router = express.Router();
router.use(requireAuth);

const SUPPORTED = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  ar: 'Arabic',
  zh: 'Chinese (Simplified)',
  ja: 'Japanese',
  ko: 'Korean',
  ru: 'Russian',
  it: 'Italian',
  bn: 'Bengali',
  ur: 'Urdu',
};

const bodySchema = z.object({
  targetLang: z.string().min(2).max(5).refine((v) => v in SUPPORTED, { message: 'Unsupported language' }),
  texts: z.record(z.string().max(3000)).refine((o) => Object.keys(o).length <= 40, { message: 'Too many text fields' }),
});

// GET /api/translate/languages
router.get('/languages', (_req, res) => {
  res.json({ success: true, data: SUPPORTED });
});

// POST /api/translate
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { targetLang, texts } = bodySchema.parse(req.body);

    if (targetLang === 'en') {
      return res.json({ success: true, data: texts });
    }

    const langName = SUPPORTED[targetLang];
    const keys = Object.keys(texts);
    const values = Object.values(texts);

    // Build a numbered list so the schema stays simple
    const inputLines = values.map((v, i) => `[${i + 1}] ${v}`).join('\n');

    const system = `You are a professional translator. Translate the following numbered text items into ${langName}.
Rules:
- Preserve ALL technical/scientific terms (e.g. "PET", "HDPE", "polyethylene terephthalate", material codes) in their original form.
- Keep numbers, percentages, and units unchanged.
- Return ONLY a JSON object with integer keys "1","2",... matching the input numbers.
- Do NOT add explanations or extra fields.`;

    const schema = {
      type: 'OBJECT',
      properties: Object.fromEntries(keys.map((_, i) => [String(i + 1), { type: 'STRING' }])),
      required: keys.map((_, i) => String(i + 1)),
    };

    const result = await generateJSON({
      system,
      parts: [{ text: inputLines }],
      schema,
      temperature: 0.1,
      timeoutMs: 60000,
    });

    // Re-map back to original keys
    const translated = Object.fromEntries(keys.map((k, i) => [k, result[String(i + 1)] || texts[k]]));
    res.json({ success: true, data: translated });
  })
);

export default router;

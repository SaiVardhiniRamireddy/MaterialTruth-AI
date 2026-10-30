import { env } from '../../config/env.js';
import { ApiError } from '../../utils/errors.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export function isAiConfigured() {
  return Boolean(env.geminiApiKey && env.geminiApiKey !== 'your-gemini-api-key');
}

/**
 * Calls Gemini generateContent with a structured JSON response schema.
 * The API key is only ever read server-side from env and sent in a header.
 */
export async function generateJSON({ system, parts, schema, temperature = 0.2, timeoutMs = 120000 }) {
  if (!isAiConfigured()) {
    throw new ApiError(503, 'AI analysis is unavailable: the server has no Gemini API key configured.');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(`${BASE}/${encodeURIComponent(env.geminiModel)}:generateContent`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.geminiApiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts }],
        generationConfig: { temperature, responseMimeType: 'application/json', responseSchema: schema },
      }),
    });
  } catch (e) {
    if (e.name === 'AbortError') throw new ApiError(504, 'The AI service timed out. Please try again.');
    throw new ApiError(502, 'Could not reach the AI service. Check the server network connection.');
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[gemini] HTTP ${res.status}: ${body.slice(0, 300)}`);
    if (res.status === 429) throw new ApiError(429, 'AI service rate limit reached. Please wait a moment and retry.');
    if (res.status === 400 && /API key/i.test(body)) throw new ApiError(503, 'AI service rejected the server API key.');
    if (res.status === 403) throw new ApiError(503, 'AI service rejected the server API key.');
    throw new ApiError(502, 'The AI service returned an error. Please try again.');
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  if (!candidate || candidate.finishReason === 'SAFETY') {
    throw new ApiError(422, 'The AI service declined to analyse this input.');
  }
  const text = candidate.content?.parts?.map((p) => p.text || '').join('') || '';
  try {
    return JSON.parse(text);
  } catch {
    console.error('[gemini] Non-JSON response:', text.slice(0, 200));
    throw new ApiError(502, 'The AI service returned an unreadable response.');
  }
}

export const inline = (buffer, mimeType) => ({ inlineData: { mimeType, data: buffer.toString('base64') } });

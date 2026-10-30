import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { seedMaterials } from './services/seedService.js';
import { isAiConfigured } from './services/ai/geminiClient.js';

try {
  await connectDB();
  await seedMaterials();
} catch (e) {
  console.error('[startup] Database unavailable:', e.message);
  process.exit(1);
}

if (!isAiConfigured()) console.warn('[startup] GEMINI_API_KEY not set — analysis requests will return 503 until configured.');

createApp().listen(env.port, () => console.log(`[server] MaterialTruth API listening on http://localhost:${env.port}`));

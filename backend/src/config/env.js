import 'dotenv/config';

const required = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`[config] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: [
    ...new Set(
      [
        'http://localhost:5173',
        'https://material-truth-ai.vercel.app',
        ...(process.env.CLIENT_ORIGIN || '').split(','),
      ]
        .map((s) => s.trim().replace(/\/+$/, ''))
        .filter(Boolean)
    ),
  ],
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  maxImageBytes: Number(process.env.MAX_IMAGE_MB || 8) * 1024 * 1024,
  maxAudioBytes: Number(process.env.MAX_AUDIO_MB || 10) * 1024 * 1024,
};

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import analysisRoutes from './routes/analysis.routes.js';
import materialRoutes from './routes/materials.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import translateRoutes from './routes/translate.routes.js';
import { isAiConfigured } from './services/ai/geminiClient.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // Render sits behind a proxy

  const corsOptions = {
    origin: (origin, cb) => cb(null, !origin || env.clientOrigin.includes(origin)),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false, // JWT is sent as a Bearer header, not cookies
    maxAge: 600,
    optionsSuccessStatus: 204,
  };
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(express.json({ limit: '300kb' }));
  app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 200, standardHeaders: true, legacyHeaders: false }));

  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        ai: isAiConfigured() ? { provider: 'Google Gemini', model: env.geminiModel, configured: true } : { configured: false },
        time: new Date().toISOString(),
      },
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/analysis', analysisRoutes);
  app.use('/api/materials', materialRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/translate', translateRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

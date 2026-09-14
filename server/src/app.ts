import cors from 'cors';
import express from 'express';
import type { Env } from './config/env.js';
import { healthRouter } from './routes/health.js';

export function createApp(env: Env) {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());

  app.use('/api', healthRouter);

  return app;
}

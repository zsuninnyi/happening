import cors from 'cors';
import express from 'express';
import type { Env } from './config/env.js';
import { adminRouter } from './routes/admin.js';
import { alertsRouter } from './routes/alerts.js';
import { authRouter } from './routes/auth.js';
import { deliveriesRouter } from './routes/deliveries.js';
import { healthRouter } from './routes/health.js';

export function createApp(env: Env) {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());

  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/alerts', alertsRouter);
  app.use('/api/deliveries', deliveriesRouter);
  app.use('/api/admin', adminRouter);

  return app;
}

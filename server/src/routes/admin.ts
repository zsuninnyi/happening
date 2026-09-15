import { Router } from 'express';
import { requireAdmin, requireAuth } from '../auth/middleware.js';

/** Admin mount: auth + role gate. Business routes land here in later steps. */
export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

import { Router } from 'express';
import { ZodError } from 'zod';
import { requireAdmin, requireAuth } from '../auth/middleware.js';
import { AlertError, toggleAlertById, toggleAlertInputSchema } from '../services/alerts.js';

/** Admin mount: auth + role gate. */
export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.patch('/alerts/:id', async (req, res) => {
  try {
    const alertId = req.params.id;
    if (!alertId) {
      res.status(400).json({ error: 'Alert id is required' });
      return;
    }
    const input = toggleAlertInputSchema.parse(req.body);
    const alert = await toggleAlertById(alertId, input);
    res.json({ alert });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Invalid alert payload' });
      return;
    }
    if (error instanceof AlertError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

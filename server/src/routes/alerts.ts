import { Router } from 'express';
import { ZodError } from 'zod';
import { requireAuth, type AuthedRequest } from '../auth/middleware.js';
import {
  AlertError,
  createAlertForUser,
  listAlertsForUser,
  toggleAlertForUser,
  toggleAlertInputSchema,
} from '../services/alerts.js';
import { createAlertInputSchema } from '../domain/types.js';

function getAuthed(req: Parameters<typeof requireAuth>[0]): AuthedRequest {
  return req as unknown as AuthedRequest;
}

export const alertsRouter = Router();

alertsRouter.use(requireAuth);

alertsRouter.get('/', async (req, res) => {
  try {
    const { user } = getAuthed(req);
    const alerts = await listAlertsForUser(user.id);
    res.json({ alerts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

alertsRouter.post('/', async (req, res) => {
  try {
    const { user } = getAuthed(req);
    const input = createAlertInputSchema.parse(req.body);
    const alert = await createAlertForUser(user.id, input);
    res.status(201).json({ alert });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Invalid alert payload' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

alertsRouter.patch('/:id', async (req, res) => {
  try {
    const { user } = getAuthed(req);
    const alertId = req.params.id;
    if (!alertId) {
      res.status(400).json({ error: 'Alert id is required' });
      return;
    }
    const input = toggleAlertInputSchema.parse(req.body);
    const alert = await toggleAlertForUser(user.id, alertId, input);
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

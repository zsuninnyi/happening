import { Router } from 'express';
import { ZodError } from 'zod';
import { requireAdmin, requireAuth, type AuthedRequest } from '../auth/middleware.js';
import {
  AlertError,
  listAllAlerts,
  toggleAlertById,
  toggleAlertInputSchema,
} from '../services/alerts.js';
import { listAllDeliveries } from '../services/deliveries.js';
import { createAndProcessEvent, listEvents } from '../services/events.js';
import { listPublicUsers } from '../services/users.js';

/** Admin mount: auth + role gate. */
export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

function getAuthed(req: Parameters<typeof requireAuth>[0]): AuthedRequest {
  return req as unknown as AuthedRequest;
}

adminRouter.get('/events', async (_req, res) => {
  try {
    const events = await listEvents();
    res.json({ events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

adminRouter.get('/alerts', async (_req, res) => {
  try {
    const alerts = await listAllAlerts();
    res.json({ alerts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

adminRouter.get('/deliveries', async (_req, res) => {
  try {
    const deliveries = await listAllDeliveries();
    res.json({ deliveries });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

adminRouter.get('/users', async (_req, res) => {
  try {
    const users = await listPublicUsers();
    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

adminRouter.post('/events', async (req, res) => {
  try {
    const { user } = getAuthed(req);
    const result = await createAndProcessEvent(user.id, req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Invalid event payload' });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

import { Router } from 'express';
import { requireAuth, type AuthedRequest } from '../auth/middleware.js';
import { listDeliveriesForUser } from '../services/deliveries.js';

export const deliveriesRouter = Router();

deliveriesRouter.use(requireAuth);

function getAuthed(req: Parameters<typeof requireAuth>[0]): AuthedRequest {
  return req as unknown as AuthedRequest;
}

deliveriesRouter.get('/', async (req, res) => {
  try {
    const { user } = getAuthed(req);
    const deliveries = await listDeliveriesForUser(user.id);
    res.json({ deliveries });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

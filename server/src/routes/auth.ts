import { Router } from 'express';
import { ZodError } from 'zod';
import { AuthError, login, loginInputSchema } from '../auth/login.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  try {
    const input = loginInputSchema.parse(req.body);
    const result = await login(input);
    res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Invalid login payload' });
      return;
    }
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

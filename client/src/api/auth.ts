import { z } from 'zod';
import { apiFetch } from './client';
import { publicUserSchema } from './types';

const loginResponseSchema = z.object({
  token: z.string().min(1),
  user: publicUserSchema,
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

export function loginRequest(email: string, password: string): Promise<LoginResponse> {
  return apiFetch('/api/auth/login', loginResponseSchema, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

import { z } from 'zod';

const clientEnvSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:3001'),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export const env: ClientEnv = clientEnvSchema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
});

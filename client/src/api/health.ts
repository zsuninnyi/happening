import { z } from 'zod';
import { env } from '../config/env';

const healthSchema = z.object({
  status: z.string(),
  service: z.string(),
  database: z.string(),
});

export type HealthResponse = z.infer<typeof healthSchema>;

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${env.VITE_API_URL}/api/health`);
  if (!response.ok) {
    throw new Error(`Health check failed (${response.status})`);
  }
  return healthSchema.parse(await response.json());
}

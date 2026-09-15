import { z } from 'zod';
import { apiFetch } from './client';
import { alertSchema, type Alert } from './types';

const alertsResponseSchema = z.object({ alerts: z.array(alertSchema) });
const alertResponseSchema = z.object({ alert: alertSchema });

export function listAlerts(token: string): Promise<Alert[]> {
  return apiFetch('/api/alerts', alertsResponseSchema, { token }).then((data) => data.alerts);
}

export function createAlert(
  token: string,
  input: {
    name: string;
    categories: string[];
    minSeverity?: string;
    channel: string;
    destination: string;
  },
): Promise<Alert> {
  return apiFetch('/api/alerts', alertResponseSchema, {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  }).then((data) => data.alert);
}

export function toggleAlert(token: string, id: string, enabled: boolean): Promise<Alert> {
  return apiFetch(`/api/alerts/${id}`, alertResponseSchema, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ enabled }),
  }).then((data) => data.alert);
}

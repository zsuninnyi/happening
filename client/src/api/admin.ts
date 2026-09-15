import { z } from 'zod';
import { apiFetch } from './client';
import {
  alertSchema,
  deliveryCountsSchema,
  deliverySchema,
  eventSchema,
  publicUserSchema,
  type Alert,
  type Delivery,
  type Event,
  type PublicUser,
} from './types';

const eventsResponseSchema = z.object({ events: z.array(eventSchema) });
const alertsResponseSchema = z.object({ alerts: z.array(alertSchema) });
const deliveriesResponseSchema = z.object({ deliveries: z.array(deliverySchema) });
const usersResponseSchema = z.object({ users: z.array(publicUserSchema) });
const alertResponseSchema = z.object({ alert: alertSchema });
const createEventResponseSchema = z.object({
  event: eventSchema,
  counts: deliveryCountsSchema,
});

export function listAdminEvents(token: string): Promise<Event[]> {
  return apiFetch('/api/admin/events', eventsResponseSchema, { token }).then((data) => data.events);
}

export function listAdminAlerts(token: string): Promise<Alert[]> {
  return apiFetch('/api/admin/alerts', alertsResponseSchema, { token }).then((data) => data.alerts);
}

export function listAdminDeliveries(token: string): Promise<Delivery[]> {
  return apiFetch('/api/admin/deliveries', deliveriesResponseSchema, { token }).then(
    (data) => data.deliveries,
  );
}

export function listAdminUsers(token: string): Promise<PublicUser[]> {
  return apiFetch('/api/admin/users', usersResponseSchema, { token }).then((data) => data.users);
}

export function toggleAdminAlert(token: string, id: string, enabled: boolean): Promise<Alert> {
  return apiFetch(`/api/admin/alerts/${id}`, alertResponseSchema, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ enabled }),
  }).then((data) => data.alert);
}

export function createAdminEvent(
  token: string,
  input: {
    title: string;
    summary?: string;
    category: string;
    severity: string;
    externalId?: string;
  },
) {
  return apiFetch('/api/admin/events', createEventResponseSchema, {
    method: 'POST',
    token,
    body: JSON.stringify(input),
  });
}

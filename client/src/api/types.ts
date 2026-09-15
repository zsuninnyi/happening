import { z } from 'zod';

export const publicUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['user', 'admin']),
  createdAt: z.coerce.date(),
});

export type PublicUser = z.infer<typeof publicUserSchema>;

export const categorySchema = z.enum(['news', 'markets', 'disasters']);
export const severitySchema = z.enum(['low', 'medium', 'high']);
export const channelSchema = z.enum(['email', 'slack']);

export const alertSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  categories: z.array(categorySchema).min(1),
  minSeverity: severitySchema,
  channel: channelSchema,
  destination: z.string(),
  enabled: z.boolean(),
  createdAt: z.coerce.date(),
});

export type Alert = z.infer<typeof alertSchema>;

export const deliverySchema = z.object({
  id: z.string(),
  eventId: z.string(),
  alertId: z.string(),
  userId: z.string(),
  dedupeKey: z.string(),
  channel: channelSchema,
  destination: z.string(),
  status: z.enum(['sent', 'failed']),
  error: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export type Delivery = z.infer<typeof deliverySchema>;

export const eventSchema = z.object({
  id: z.string(),
  externalId: z.string().nullable(),
  title: z.string(),
  summary: z.string().nullable(),
  category: categorySchema,
  severity: severitySchema,
  createdById: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export type Event = z.infer<typeof eventSchema>;

export const deliveryCountsSchema = z.object({
  matched: z.number(),
  sent: z.number(),
  failed: z.number(),
  skipped: z.number(),
});

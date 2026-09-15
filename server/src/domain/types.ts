import { z } from 'zod';

export const roleSchema = z.enum(['user', 'admin']);
export const categorySchema = z.enum(['news', 'markets', 'disasters']);
export const severitySchema = z.enum(['low', 'medium', 'high']);
export const channelSchema = z.enum(['email', 'slack']);
export const deliveryStatusSchema = z.enum(['sent', 'failed']);

export type Role = z.infer<typeof roleSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Severity = z.infer<typeof severitySchema>;
export type Channel = z.infer<typeof channelSchema>;
export type DeliveryStatus = z.infer<typeof deliveryStatusSchema>;

export const categoriesSchema = z.array(categorySchema).min(1);

export const userSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(1),
  role: roleSchema,
  createdAt: z.coerce.date(),
});

export const publicUserSchema = userSchema.omit({ password: true });

export const alertSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().min(1),
  categories: categoriesSchema,
  minSeverity: severitySchema,
  channel: channelSchema,
  destination: z.string().min(1),
  enabled: z.boolean(),
  createdAt: z.coerce.date(),
});

export const eventSchema = z.object({
  id: z.string().min(1),
  externalId: z.string().min(1).nullable(),
  title: z.string().min(1),
  summary: z.string().nullable(),
  category: categorySchema,
  severity: severitySchema,
  createdById: z.string().min(1).nullable(),
  createdAt: z.coerce.date(),
});

export const deliverySchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  alertId: z.string().min(1),
  userId: z.string().min(1),
  dedupeKey: z.string().min(1),
  channel: channelSchema,
  destination: z.string().min(1),
  status: deliveryStatusSchema,
  error: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;
export type Alert = z.infer<typeof alertSchema>;
export type Event = z.infer<typeof eventSchema>;
export type Delivery = z.infer<typeof deliverySchema>;

/** Input for creating an alert (API/MVP). */
export const createAlertInputSchema = z.object({
  name: z.string().min(1),
  categories: categoriesSchema,
  minSeverity: severitySchema.default('low'),
  channel: channelSchema,
  destination: z.string().min(1),
});

export type CreateAlertInput = z.infer<typeof createAlertInputSchema>;

/** Input for creating/firing an event (API/MVP). */
export const createEventInputSchema = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
  category: categorySchema,
  severity: severitySchema,
  externalId: z.string().min(1).optional(),
});

export type CreateEventInput = z.infer<typeof createEventInputSchema>;

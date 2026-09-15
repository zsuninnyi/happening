import type { Alert as PrismaAlert } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { parseCategories } from '../domain/categories.js';
import { createAlertInputSchema, type Alert } from '../domain/types.js';

export const toggleAlertInputSchema = z.object({
  enabled: z.boolean(),
});

export type ToggleAlertInput = z.infer<typeof toggleAlertInputSchema>;

export class AlertError extends Error {
  constructor(
    message: string,
    readonly statusCode: 400 | 404,
  ) {
    super(message);
    this.name = 'AlertError';
  }
}

export function toAlert(row: PrismaAlert): Alert {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    categories: parseCategories(row.categories),
    minSeverity: row.minSeverity,
    channel: row.channel,
    destination: row.destination,
    enabled: row.enabled,
    createdAt: row.createdAt,
  };
}

export async function listAlertsForUser(userId: string): Promise<Alert[]> {
  const rows = await prisma.alert.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toAlert);
}

export async function createAlertForUser(userId: string, input: unknown): Promise<Alert> {
  const data = createAlertInputSchema.parse(input);
  const row = await prisma.alert.create({
    data: {
      userId,
      name: data.name,
      categories: data.categories,
      minSeverity: data.minSeverity,
      channel: data.channel,
      destination: data.destination,
      enabled: true,
    },
  });
  return toAlert(row);
}

export async function toggleAlertForUser(
  userId: string,
  alertId: string,
  input: ToggleAlertInput,
): Promise<Alert> {
  const existing = await prisma.alert.findFirst({
    where: { id: alertId, userId },
  });
  if (!existing) {
    throw new AlertError('Alert not found', 404);
  }

  const row = await prisma.alert.update({
    where: { id: existing.id },
    data: { enabled: input.enabled },
  });
  return toAlert(row);
}

/** Admin: toggle any alert by id (no ownership check). */
export async function toggleAlertById(alertId: string, input: ToggleAlertInput): Promise<Alert> {
  const existing = await prisma.alert.findUnique({ where: { id: alertId } });
  if (!existing) {
    throw new AlertError('Alert not found', 404);
  }

  const row = await prisma.alert.update({
    where: { id: existing.id },
    data: { enabled: input.enabled },
  });
  return toAlert(row);
}

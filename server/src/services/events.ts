import { prisma } from '../db/prisma.js';
import { createEventInputSchema, type Event } from '../domain/types.js';
import { matchAlerts } from '../matching/matchAlerts.js';
import { toAlert } from './alerts.js';
import { deliverForMatchedAlerts, type DeliveryCounts } from './notifications.js';

type EventRow = {
  id: string;
  externalId: string | null;
  title: string;
  summary: string | null;
  category: Event['category'];
  severity: Event['severity'];
  createdById: string | null;
  createdAt: Date;
};

export function toEvent(row: EventRow): Event {
  return {
    id: row.id,
    externalId: row.externalId,
    title: row.title,
    summary: row.summary,
    category: row.category,
    severity: row.severity,
    createdById: row.createdById,
    createdAt: row.createdAt,
  };
}

export type CreateEventResult = {
  event: Event;
  counts: DeliveryCounts;
};

export async function createAndProcessEvent(
  adminUserId: string,
  input: unknown,
): Promise<CreateEventResult> {
  const data = createEventInputSchema.parse(input);

  const row = await prisma.event.create({
    data: {
      title: data.title,
      summary: data.summary ?? null,
      category: data.category,
      severity: data.severity,
      externalId: data.externalId ?? null,
      createdById: adminUserId,
    },
  });

  const event = toEvent(row);

  const alertRows = await prisma.alert.findMany({
    where: { enabled: true },
  });
  const alerts = alertRows.map(toAlert);
  const matched = matchAlerts(alerts, event);
  const counts = await deliverForMatchedAlerts(event, matched);

  return { event, counts };
}

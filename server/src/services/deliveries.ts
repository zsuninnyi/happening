import { prisma } from '../db/prisma.js';
import type { Delivery } from '../domain/types.js';

type DeliveryRow = {
  id: string;
  eventId: string;
  alertId: string;
  userId: string;
  dedupeKey: string;
  channel: Delivery['channel'];
  destination: string;
  status: Delivery['status'];
  error: string | null;
  createdAt: Date;
};

export function toDelivery(row: DeliveryRow): Delivery {
  return {
    id: row.id,
    eventId: row.eventId,
    alertId: row.alertId,
    userId: row.userId,
    dedupeKey: row.dedupeKey,
    channel: row.channel,
    destination: row.destination,
    status: row.status,
    error: row.error,
    createdAt: row.createdAt,
  };
}

export async function listDeliveriesForUser(userId: string): Promise<Delivery[]> {
  const rows = await prisma.delivery.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toDelivery);
}

export async function listAllDeliveries(): Promise<Delivery[]> {
  const rows = await prisma.delivery.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toDelivery);
}

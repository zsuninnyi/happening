import { getChannel } from '../channels/registry.js';
import { prisma } from '../db/prisma.js';
import { buildDedupeKey } from '../domain/dedupe.js';
import type { Alert, Event } from '../domain/types.js';

export type DeliveryCounts = {
  matched: number;
  sent: number;
  failed: number;
  skipped: number;
};

export async function deliverForMatchedAlerts(
  event: Event,
  matchedAlerts: Alert[],
): Promise<DeliveryCounts> {
  const counts: DeliveryCounts = {
    matched: matchedAlerts.length,
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  const dedupeKey = buildDedupeKey(event);

  for (const alert of matchedAlerts) {
    const existing = await prisma.delivery.findUnique({
      where: {
        alertId_dedupeKey: {
          alertId: alert.id,
          dedupeKey,
        },
      },
    });

    if (existing) {
      counts.skipped += 1;
      continue;
    }

    const channel = getChannel(alert.channel);
    try {
      if (!channel) {
        throw new Error(`Unknown notification channel: ${alert.channel}`);
      }
      await channel.send({ destination: alert.destination, event, alert });
      await prisma.delivery.create({
        data: {
          eventId: event.id,
          alertId: alert.id,
          userId: alert.userId,
          dedupeKey,
          channel: alert.channel,
          destination: alert.destination,
          status: 'sent',
        },
      });
      counts.sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Notification failed';
      await prisma.delivery.create({
        data: {
          eventId: event.id,
          alertId: alert.id,
          userId: alert.userId,
          dedupeKey,
          channel: alert.channel,
          destination: alert.destination,
          status: 'failed',
          error: message,
        },
      });
      counts.failed += 1;
    }
  }

  return counts;
}

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '../db/prisma.js';
import type { Event } from '../domain/types.js';
import { createAlertForUser } from './alerts.js';
import { deliverForMatchedAlerts } from './notifications.js';

describe('deliverForMatchedAlerts', () => {
  let userId: string;

  beforeAll(async () => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: 'alice@happening.local' },
    });
    userId = user.id;
  });

  afterEach(async () => {
    await prisma.delivery.deleteMany({ where: { userId } });
    await prisma.event.deleteMany({ where: { createdById: userId } });
    await prisma.alert.deleteMany({ where: { userId } });
    vi.restoreAllMocks();
  });

  async function seedEvent(externalId: string): Promise<Event> {
    const row = await prisma.event.create({
      data: {
        title: 'Quake',
        category: 'disasters',
        severity: 'high',
        externalId,
        createdById: userId,
      },
    });
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

  it('records sent deliveries for successful adapters', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const created = await createAlertForUser(userId, {
      name: 'Disasters',
      categories: ['disasters'],
      channel: 'email',
      destination: 'alice@example.com',
    });
    const event = await seedEvent('ext_notify_sent');

    const counts = await deliverForMatchedAlerts(event, [created]);

    expect(counts).toEqual({ matched: 1, sent: 1, failed: 0, skipped: 0 });
    expect(log).toHaveBeenCalled();
    const deliveries = await prisma.delivery.findMany({ where: { alertId: created.id } });
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]?.status).toBe('sent');
  });

  it('skips without inserting a second row on duplicate dedupe key', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const created = await createAlertForUser(userId, {
      name: 'Disasters',
      categories: ['disasters'],
      channel: 'slack',
      destination: '#alerts',
    });

    const firstEvent = await seedEvent('ext_notify_dup');
    expect(await deliverForMatchedAlerts(firstEvent, [created])).toEqual({
      matched: 1,
      sent: 1,
      failed: 0,
      skipped: 0,
    });

    const secondEvent = await seedEvent('ext_notify_dup');
    expect(await deliverForMatchedAlerts(secondEvent, [created])).toEqual({
      matched: 1,
      sent: 0,
      failed: 0,
      skipped: 1,
    });
    expect(await prisma.delivery.count({ where: { alertId: created.id } })).toBe(1);
  });

  it('records failed as terminal for fail@ destinations', async () => {
    const created = await createAlertForUser(userId, {
      name: 'Failing',
      categories: ['disasters'],
      channel: 'email',
      destination: 'fail@example.com',
    });
    const event = await seedEvent('ext_notify_fail');

    expect(await deliverForMatchedAlerts(event, [created])).toEqual({
      matched: 1,
      sent: 0,
      failed: 1,
      skipped: 0,
    });

    expect(await deliverForMatchedAlerts(event, [created])).toEqual({
      matched: 1,
      sent: 0,
      failed: 0,
      skipped: 1,
    });

    const delivery = await prisma.delivery.findFirst({ where: { alertId: created.id } });
    expect(delivery?.status).toBe('failed');
    expect(await prisma.delivery.count({ where: { alertId: created.id } })).toBe(1);
  });
});

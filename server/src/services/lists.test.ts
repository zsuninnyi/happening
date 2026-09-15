import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '../db/prisma.js';
import { createAlertForUser, listAllAlerts } from './alerts.js';
import { listAllDeliveries, listDeliveriesForUser } from './deliveries.js';
import { createAndProcessEvent, listEvents } from './events.js';
import { listPublicUsers } from './users.js';

describe('history and admin lists', () => {
  let aliceId: string;
  let bobId: string;
  let adminId: string;

  beforeAll(async () => {
    aliceId = (await prisma.user.findUniqueOrThrow({ where: { email: 'alice@happening.local' } }))
      .id;
    bobId = (await prisma.user.findUniqueOrThrow({ where: { email: 'bob@happening.local' } })).id;
    adminId = (await prisma.user.findUniqueOrThrow({ where: { email: 'admin@happening.local' } }))
      .id;
  });

  afterEach(async () => {
    await prisma.delivery.deleteMany({
      where: { userId: { in: [aliceId, bobId] } },
    });
    await prisma.event.deleteMany({ where: { createdById: adminId } });
    await prisma.alert.deleteMany({ where: { userId: { in: [aliceId, bobId] } } });
    vi.restoreAllMocks();
  });

  it('lists only the current users deliveries', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await createAlertForUser(aliceId, {
      name: 'Alice news',
      categories: ['news'],
      channel: 'email',
      destination: 'alice@example.com',
    });
    await createAlertForUser(bobId, {
      name: 'Bob news',
      categories: ['news'],
      channel: 'slack',
      destination: '#bob',
    });

    await createAndProcessEvent(adminId, {
      title: 'Headline',
      category: 'news',
      severity: 'high',
      externalId: 'hist_ext_1',
    });

    const aliceDeliveries = await listDeliveriesForUser(aliceId);
    const bobDeliveries = await listDeliveriesForUser(bobId);

    expect(aliceDeliveries).toHaveLength(1);
    expect(aliceDeliveries[0]?.userId).toBe(aliceId);
    expect(bobDeliveries).toHaveLength(1);
    expect(bobDeliveries[0]?.userId).toBe(bobId);
  });

  it('lists all events, alerts, deliveries, and public users for admin', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await createAlertForUser(aliceId, {
      name: 'Alice markets',
      categories: ['markets'],
      channel: 'email',
      destination: 'alice@example.com',
    });

    await createAndProcessEvent(adminId, {
      title: 'Markets move',
      category: 'markets',
      severity: 'medium',
      externalId: 'hist_ext_2',
    });

    const events = await listEvents();
    const alerts = await listAllAlerts();
    const deliveries = await listAllDeliveries();
    const users = await listPublicUsers();

    expect(events.some((event) => event.externalId === 'hist_ext_2')).toBe(true);
    expect(alerts.some((alert) => alert.userId === aliceId)).toBe(true);
    expect(deliveries.some((delivery) => delivery.userId === aliceId)).toBe(true);
    expect(users.length).toBeGreaterThanOrEqual(3);
    expect(users.every((user) => !('password' in user))).toBe(true);
  });
});

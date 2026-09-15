import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { login } from '../auth/login.js';
import { tokenStore } from '../auth/tokens.js';
import { prisma } from '../db/prisma.js';
import {
  createAlertForUser,
  listAlertsForUser,
  listAllAlerts,
  toggleAlertById,
} from '../services/alerts.js';
import { listAllDeliveries, listDeliveriesForUser } from '../services/deliveries.js';
import { createAndProcessEvent, listEvents } from '../services/events.js';
import { listPublicUsers } from '../services/users.js';

/**
 * End-to-end path for the MVP backend (no HTTP / UI):
 * login → create alert → admin fire event → history lists → dedupe → admin disable.
 */
describe('MVP backend flow (e2e path)', () => {
  let aliceId: string;
  let adminId: string;

  beforeAll(async () => {
    aliceId = (await prisma.user.findUniqueOrThrow({ where: { email: 'alice@happening.local' } }))
      .id;
    adminId = (await prisma.user.findUniqueOrThrow({ where: { email: 'admin@happening.local' } }))
      .id;
    await prisma.delivery.deleteMany({ where: { userId: aliceId } });
    await prisma.alert.deleteMany({ where: { userId: aliceId } });
  });

  afterEach(async () => {
    await prisma.delivery.deleteMany({
      where: { OR: [{ userId: aliceId }, { userId: adminId }] },
    });
    await prisma.event.deleteMany({ where: { createdById: adminId } });
    await prisma.alert.deleteMany({ where: { userId: aliceId } });
    tokenStore.clear();
    vi.restoreAllMocks();
  });

  it('runs login → alert → fire event → lists → dedupe → admin disable', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const aliceSession = await login({
      email: 'alice@happening.local',
      password: 'alice123',
    });
    expect(aliceSession.user.role).toBe('user');
    expect(aliceSession.token).toBeTruthy();

    const adminSession = await login({
      email: 'admin@happening.local',
      password: 'admin123',
    });
    expect(adminSession.user.role).toBe('admin');

    const alert = await createAlertForUser(aliceId, {
      name: 'Breaking news',
      categories: ['news'],
      minSeverity: 'medium',
      channel: 'email',
      destination: 'alice@example.com',
    });
    expect(await listAlertsForUser(aliceId)).toHaveLength(1);

    const first = await createAndProcessEvent(adminId, {
      title: 'Market open',
      category: 'news',
      severity: 'high',
      externalId: 'e2e_ext_1',
    });
    expect(first.counts).toEqual({ matched: 1, sent: 1, failed: 0, skipped: 0 });

    const ownHistory = await listDeliveriesForUser(aliceId);
    expect(ownHistory).toHaveLength(1);
    expect(ownHistory[0]?.status).toBe('sent');

    const adminEvents = await listEvents();
    const adminAlerts = await listAllAlerts();
    const adminDeliveries = await listAllDeliveries();
    const adminUsers = await listPublicUsers();

    expect(adminEvents.some((event) => event.id === first.event.id)).toBe(true);
    expect(adminAlerts.some((item) => item.id === alert.id)).toBe(true);
    expect(adminDeliveries.some((item) => item.alertId === alert.id)).toBe(true);
    expect(adminUsers.some((user) => user.email === 'alice@happening.local')).toBe(true);
    expect(adminUsers.every((user) => !('password' in user))).toBe(true);

    const second = await createAndProcessEvent(adminId, {
      title: 'Market open (replay)',
      category: 'news',
      severity: 'high',
      externalId: 'e2e_ext_1',
    });
    expect(second.counts).toEqual({ matched: 1, sent: 0, failed: 0, skipped: 1 });
    expect(await listDeliveriesForUser(aliceId)).toHaveLength(1);

    await toggleAlertById(alert.id, { enabled: false });
    const afterDisable = await createAndProcessEvent(adminId, {
      title: 'Another headline',
      category: 'news',
      severity: 'high',
      externalId: 'e2e_ext_2',
    });
    expect(afterDisable.counts.matched).toBe(0);
  });
});

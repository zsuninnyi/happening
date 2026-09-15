import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { login } from '../auth/login.js';
import { tokenStore } from '../auth/tokens.js';
import { prisma } from '../db/prisma.js';
import { createAlertForUser, listAlertsForUser, toggleAlertById } from '../services/alerts.js';
import { createAndProcessEvent } from '../services/events.js';

/**
 * End-to-end path for the MVP backend so far (no HTTP / UI):
 * login → create alert → admin fire event → deliveries + dedupe → admin toggle.
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

  it('runs login → alert → fire event → dedupe → admin disable', async () => {
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

    const second = await createAndProcessEvent(adminId, {
      title: 'Market open (replay)',
      category: 'news',
      severity: 'high',
      externalId: 'e2e_ext_1',
    });
    expect(second.counts).toEqual({ matched: 1, sent: 0, failed: 0, skipped: 1 });

    const deliveries = await prisma.delivery.findMany({ where: { alertId: alert.id } });
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]?.status).toBe('sent');

    const lowSeverity = await createAndProcessEvent(adminId, {
      title: 'Minor blip',
      category: 'news',
      severity: 'low',
      externalId: 'e2e_ext_low',
    });
    expect(lowSeverity.counts.matched).toBe(0);

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

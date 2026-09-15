import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../db/prisma.js';
import {
  AlertError,
  createAlertForUser,
  listAlertsForUser,
  toggleAlertById,
  toggleAlertForUser,
} from './alerts.js';

const aliceEmail = 'alice@happening.local';
const bobEmail = 'bob@happening.local';

describe('alerts service', () => {
  let aliceId: string;
  let bobId: string;

  beforeAll(async () => {
    const alice = await prisma.user.findUniqueOrThrow({ where: { email: aliceEmail } });
    const bob = await prisma.user.findUniqueOrThrow({ where: { email: bobEmail } });
    aliceId = alice.id;
    bobId = bob.id;
  });

  afterEach(async () => {
    await prisma.alert.deleteMany({
      where: { userId: { in: [aliceId, bobId] } },
    });
  });

  it('creates an alert with default minSeverity low', async () => {
    const alert = await createAlertForUser(aliceId, {
      name: 'Markets',
      categories: ['markets'],
      channel: 'email',
      destination: 'alice@example.com',
    });

    expect(alert.userId).toBe(aliceId);
    expect(alert.minSeverity).toBe('low');
    expect(alert.enabled).toBe(true);
    expect(alert.categories).toEqual(['markets']);
  });

  it('lists only the current user alerts', async () => {
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

    const aliceAlerts = await listAlertsForUser(aliceId);
    expect(aliceAlerts).toHaveLength(1);
    expect(aliceAlerts[0]?.name).toBe('Alice news');
  });

  it('rejects empty categories via create validation', async () => {
    await expect(
      createAlertForUser(aliceId, {
        name: 'Bad',
        categories: [],
        channel: 'email',
        destination: 'alice@example.com',
      }),
    ).rejects.toThrow();
  });

  it('toggles own alert enabled flag', async () => {
    const created = await createAlertForUser(aliceId, {
      name: 'Toggle me',
      categories: ['disasters'],
      minSeverity: 'high',
      channel: 'slack',
      destination: '#alerts',
    });

    const disabled = await toggleAlertForUser(aliceId, created.id, { enabled: false });
    expect(disabled.enabled).toBe(false);

    const enabled = await toggleAlertForUser(aliceId, created.id, { enabled: true });
    expect(enabled.enabled).toBe(true);
  });

  it('returns 404 when toggling another users alert', async () => {
    const bobAlert = await createAlertForUser(bobId, {
      name: 'Bob only',
      categories: ['news'],
      channel: 'email',
      destination: 'bob@example.com',
    });

    await expect(toggleAlertForUser(aliceId, bobAlert.id, { enabled: false })).rejects.toSatisfy(
      (error: unknown) => error instanceof AlertError && error.statusCode === 404,
    );
  });

  it('returns 404 for unknown alert id', async () => {
    await expect(
      toggleAlertForUser(aliceId, 'missing_alert', { enabled: false }),
    ).rejects.toSatisfy(
      (error: unknown) => error instanceof AlertError && error.statusCode === 404,
    );
  });

  it('allows admin toggle of another users alert', async () => {
    const bobAlert = await createAlertForUser(bobId, {
      name: 'Bob admin-toggle',
      categories: ['markets'],
      channel: 'email',
      destination: 'bob@example.com',
    });

    const disabled = await toggleAlertById(bobAlert.id, { enabled: false });
    expect(disabled.enabled).toBe(false);
    expect(disabled.userId).toBe(bobId);
  });

  it('returns 404 when admin toggles unknown alert id', async () => {
    await expect(toggleAlertById('missing_alert', { enabled: false })).rejects.toSatisfy(
      (error: unknown) => error instanceof AlertError && error.statusCode === 404,
    );
  });
});

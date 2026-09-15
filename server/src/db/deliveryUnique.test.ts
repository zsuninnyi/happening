import { Category, Channel, DeliveryStatus, PrismaClient, Severity } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildDedupeKey } from '../domain/dedupe.js';

const prisma = new PrismaClient();
const testEmail = 'unique-test@happening.local';

async function cleanupTestData() {
  const user = await prisma.user.findUnique({ where: { email: testEmail } });
  if (!user) return;

  await prisma.delivery.deleteMany({ where: { userId: user.id } });
  await prisma.event.deleteMany({ where: { createdById: user.id } });
  await prisma.alert.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
}

describe('Delivery unique (alertId, dedupeKey)', () => {
  beforeAll(async () => {
    await prisma.$connect();
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it('rejects a second delivery for the same alert and dedupe key', async () => {
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Unique Test',
        password: 'test',
        role: 'user',
      },
    });

    const alert = await prisma.alert.create({
      data: {
        userId: user.id,
        name: 'News',
        categories: [Category.news],
        minSeverity: Severity.low,
        channel: Channel.email,
        destination: testEmail,
      },
    });

    const event = await prisma.event.create({
      data: {
        externalId: 'ext_unique_1',
        title: 'Breaking',
        category: Category.news,
        severity: Severity.medium,
        createdById: user.id,
      },
    });

    const dedupeKey = buildDedupeKey(event);

    await prisma.delivery.create({
      data: {
        eventId: event.id,
        alertId: alert.id,
        userId: user.id,
        dedupeKey,
        channel: Channel.email,
        destination: alert.destination,
        status: DeliveryStatus.sent,
      },
    });

    await expect(
      prisma.delivery.create({
        data: {
          eventId: event.id,
          alertId: alert.id,
          userId: user.id,
          dedupeKey,
          channel: Channel.email,
          destination: alert.destination,
          status: DeliveryStatus.failed,
          error: 'should not insert',
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });
});

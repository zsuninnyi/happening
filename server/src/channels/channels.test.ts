import { describe, expect, it, vi } from 'vitest';
import { emailChannel } from './emailChannel.js';
import { getChannel } from './registry.js';
import { FAIL_DESTINATION_PREFIX, shouldSimulateFailure } from './types.js';

describe('channel registry', () => {
  it('resolves email and slack adapters', () => {
    expect(getChannel('email')?.type).toBe('email');
    expect(getChannel('slack')?.type).toBe('slack');
  });
});

describe('simulated channel failure', () => {
  it('detects fail@ destinations', () => {
    expect(shouldSimulateFailure(`${FAIL_DESTINATION_PREFIX}example.com`)).toBe(true);
    expect(shouldSimulateFailure('alice@example.com')).toBe(false);
  });

  it('email adapter throws for fail@ destinations', async () => {
    await expect(
      emailChannel.send({
        destination: 'fail@example.com',
        event: {
          id: 'e1',
          externalId: null,
          title: 't',
          summary: null,
          category: 'news',
          severity: 'low',
          createdById: null,
          createdAt: new Date(),
        },
        alert: {
          id: 'a1',
          userId: 'u1',
          name: 'n',
          categories: ['news'],
          minSeverity: 'low',
          channel: 'email',
          destination: 'fail@example.com',
          enabled: true,
          createdAt: new Date(),
        },
      }),
    ).rejects.toThrow(/Simulated email failure/);
  });

  it('email adapter logs on success', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    await emailChannel.send({
      destination: 'ok@example.com',
      event: {
        id: 'e1',
        externalId: null,
        title: 't',
        summary: null,
        category: 'news',
        severity: 'low',
        createdById: null,
        createdAt: new Date(),
      },
      alert: {
        id: 'a1',
        userId: 'u1',
        name: 'n',
        categories: ['news'],
        minSeverity: 'low',
        channel: 'email',
        destination: 'ok@example.com',
        enabled: true,
        createdAt: new Date(),
      },
    });
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});

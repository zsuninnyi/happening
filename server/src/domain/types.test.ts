import { describe, expect, it } from 'vitest';
import { parseCategories } from './categories.js';
import { createAlertInputSchema, createEventInputSchema, publicUserSchema } from './types.js';

describe('createAlertInputSchema', () => {
  it('defaults minSeverity to low', () => {
    const parsed = createAlertInputSchema.parse({
      name: 'Markets',
      categories: ['markets'],
      channel: 'email',
      destination: 'alice@example.com',
    });

    expect(parsed.minSeverity).toBe('low');
  });

  it('rejects empty categories', () => {
    const result = createAlertInputSchema.safeParse({
      name: 'Empty',
      categories: [],
      channel: 'slack',
      destination: '#alerts',
    });

    expect(result.success).toBe(false);
  });

  it('rejects unknown channel', () => {
    const result = createAlertInputSchema.safeParse({
      name: 'Bad channel',
      categories: ['news'],
      channel: 'sms',
      destination: '+10000000000',
    });

    expect(result.success).toBe(false);
  });
});

describe('createEventInputSchema', () => {
  it('accepts a minimal event', () => {
    const parsed = createEventInputSchema.parse({
      title: 'Quake',
      category: 'disasters',
      severity: 'high',
    });

    expect(parsed.externalId).toBeUndefined();
  });
});

describe('parseCategories', () => {
  it('accepts a valid JSON array', () => {
    expect(parseCategories(['news', 'disasters'])).toEqual(['news', 'disasters']);
  });

  it('rejects empty arrays', () => {
    expect(() => parseCategories([])).toThrow();
  });
});

describe('publicUserSchema', () => {
  it('omits password', () => {
    const parsed = publicUserSchema.parse({
      id: 'user_1',
      email: 'alice@happening.local',
      name: 'Alice',
      role: 'user',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(parsed).not.toHaveProperty('password');
  });
});

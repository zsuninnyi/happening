import { describe, expect, it } from 'vitest';
import type { Alert } from '../domain/types.js';
import { alertMatchesEvent, matchAlerts } from './matchAlerts.js';

function alert(overrides: Partial<Alert>): Alert {
  return {
    id: 'alert_1',
    userId: 'user_1',
    name: 'Test',
    categories: ['news'],
    minSeverity: 'low',
    channel: 'email',
    destination: 'a@example.com',
    enabled: true,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('alertMatchesEvent', () => {
  it('matches enabled alert with category and severity', () => {
    expect(
      alertMatchesEvent(alert({ categories: ['news'], minSeverity: 'medium' }), {
        category: 'news',
        severity: 'high',
      }),
    ).toBe(true);
  });

  it('rejects disabled alerts', () => {
    expect(
      alertMatchesEvent(alert({ enabled: false }), { category: 'news', severity: 'high' }),
    ).toBe(false);
  });

  it('rejects category mismatch', () => {
    expect(
      alertMatchesEvent(alert({ categories: ['markets'] }), {
        category: 'news',
        severity: 'high',
      }),
    ).toBe(false);
  });

  it('rejects when event severity is below min', () => {
    expect(
      alertMatchesEvent(alert({ minSeverity: 'high' }), {
        category: 'news',
        severity: 'low',
      }),
    ).toBe(false);
  });
});

describe('matchAlerts', () => {
  it('returns only matching alerts', () => {
    const alerts = [
      alert({ id: 'a1', categories: ['news'] }),
      alert({ id: 'a2', categories: ['markets'] }),
      alert({ id: 'a3', categories: ['news'], enabled: false }),
    ];

    const matched = matchAlerts(alerts, { category: 'news', severity: 'medium' });
    expect(matched.map((item) => item.id)).toEqual(['a1']);
  });
});

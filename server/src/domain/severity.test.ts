import { describe, expect, it } from 'vitest';
import { severityMeetsMin, severityRank } from './severity.js';

describe('severityRank', () => {
  it('orders low < medium < high', () => {
    expect(severityRank('low')).toBeLessThan(severityRank('medium'));
    expect(severityRank('medium')).toBeLessThan(severityRank('high'));
  });
});

describe('severityMeetsMin', () => {
  it('matches equal severity', () => {
    expect(severityMeetsMin('medium', 'medium')).toBe(true);
  });

  it('allows higher event severity', () => {
    expect(severityMeetsMin('high', 'low')).toBe(true);
  });

  it('rejects lower event severity', () => {
    expect(severityMeetsMin('low', 'high')).toBe(false);
  });

  it('does not use lexicographic string order', () => {
    // Lexicographic: "high" < "low" < "medium" — must not drive matching.
    expect(severityMeetsMin('high', 'medium')).toBe(true);
    expect(severityMeetsMin('low', 'medium')).toBe(false);
  });
});

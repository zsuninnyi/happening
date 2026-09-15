import { describe, expect, it } from 'vitest';
import { buildDedupeKey } from './dedupe.js';

describe('buildDedupeKey', () => {
  it('uses externalId when present', () => {
    expect(buildDedupeKey({ id: 'evt_1', externalId: 'ext_abc' })).toBe('ext_abc');
  });

  it('falls back to event id when externalId is null', () => {
    expect(buildDedupeKey({ id: 'evt_1', externalId: null })).toBe('evt_1');
  });
});

import { describe, expect, it } from 'vitest';
import { TokenStore } from './tokens.js';

describe('TokenStore', () => {
  it('issues a random token and resolves the session', () => {
    const store = new TokenStore();
    const token = store.issue('user_1', 'user');

    expect(token).toHaveLength(64);
    expect(store.get(token)).toEqual({ userId: 'user_1', role: 'user' });
  });

  it('returns undefined for unknown tokens', () => {
    const store = new TokenStore();
    expect(store.get('missing')).toBeUndefined();
  });

  it('revokes tokens', () => {
    const store = new TokenStore();
    const token = store.issue('user_1', 'admin');

    expect(store.revoke(token)).toBe(true);
    expect(store.get(token)).toBeUndefined();
  });
});

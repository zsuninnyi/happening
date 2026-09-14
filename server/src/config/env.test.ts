import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.js';

describe('loadEnv', () => {
  it('parses valid env with defaults', () => {
    const env = loadEnv({
      DATABASE_URL: 'file:./dev.db',
    });

    expect(env.PORT).toBe(3001);
    expect(env.NODE_ENV).toBe('development');
    expect(env.DATABASE_URL).toBe('file:./dev.db');
  });

  it('rejects missing DATABASE_URL', () => {
    expect(() => loadEnv({})).toThrow(/Invalid environment/);
  });
});

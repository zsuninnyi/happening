import { describe, expect, it } from 'vitest';
import { env } from '../config/env';

describe('client env', () => {
  it('exposes an API URL', () => {
    expect(env.VITE_API_URL).toMatch(/^https?:\/\//);
  });
});

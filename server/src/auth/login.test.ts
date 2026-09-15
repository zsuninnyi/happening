import { afterEach, describe, expect, it } from 'vitest';
import { AuthError, login, loginInputSchema } from './login.js';
import { tokenStore } from './tokens.js';

describe('loginInputSchema', () => {
  it('rejects invalid email', () => {
    const result = loginInputSchema.safeParse({ email: 'nope', password: 'x' });
    expect(result.success).toBe(false);
  });
});

describe('login', () => {
  afterEach(() => {
    tokenStore.clear();
  });

  it('returns a token and public user for valid credentials', async () => {
    const result = await login({
      email: 'admin@happening.local',
      password: 'admin123',
    });

    expect(result.token).toHaveLength(64);
    expect(result.user).toMatchObject({
      email: 'admin@happening.local',
      role: 'admin',
      name: 'Admin',
    });
    expect(result.user).not.toHaveProperty('password');
    expect(tokenStore.get(result.token)?.role).toBe('admin');
  });

  it('issues a user-role session for a regular user', async () => {
    const result = await login({
      email: 'alice@happening.local',
      password: 'alice123',
    });

    expect(result.user.role).toBe('user');
    expect(tokenStore.get(result.token)?.role).toBe('user');
  });

  it('throws 401 for wrong password', async () => {
    await expect(login({ email: 'alice@happening.local', password: 'wrong' })).rejects.toSatisfy(
      (error: unknown) => error instanceof AuthError && error.statusCode === 401,
    );
  });

  it('throws 401 for unknown email', async () => {
    await expect(
      login({ email: 'missing@happening.local', password: 'anything' }),
    ).rejects.toSatisfy((error: unknown) => error instanceof AuthError && error.statusCode === 401);
  });
});

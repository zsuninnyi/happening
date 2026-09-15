import type { NextFunction, Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../db/prisma.js';
import { requireAdmin, requireAuth, type AuthedRequest } from './middleware.js';
import { tokenStore } from './tokens.js';

function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as typeof res & Response;
}

describe('requireAuth', () => {
  beforeEach(() => {
    tokenStore.clear();
  });

  afterEach(() => {
    tokenStore.clear();
    vi.restoreAllMocks();
  });

  it('returns 401 when Authorization header is missing', async () => {
    const req = { header: () => undefined } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    await requireAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for an invalid token', async () => {
    const req = {
      header: (name: string) => (name === 'authorization' ? 'Bearer deadbeef' : undefined),
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    await requireAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('attaches the public user and calls next for a valid token', async () => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: 'alice@happening.local' },
    });
    const token = tokenStore.issue(user.id, user.role);

    const req = {
      header: (name: string) => (name === 'authorization' ? `Bearer ${token}` : undefined),
    } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect((req as AuthedRequest).user).toMatchObject({
      id: user.id,
      email: user.email,
      role: 'user',
    });
    expect((req as AuthedRequest).user).not.toHaveProperty('password');
  });
});

describe('requireAdmin', () => {
  it('returns 403 for non-admin users', () => {
    const req = {
      user: {
        id: 'user_alice',
        email: 'alice@happening.local',
        name: 'Alice',
        role: 'user',
        createdAt: new Date(),
      },
    } as AuthedRequest;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireAdmin(req, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'Forbidden' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next for admin users', () => {
    const req = {
      user: {
        id: 'user_admin',
        email: 'admin@happening.local',
        name: 'Admin',
        role: 'admin',
        createdAt: new Date(),
      },
    } as AuthedRequest;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 401 when auth middleware did not run', () => {
    const req = {} as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireAdmin(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
});

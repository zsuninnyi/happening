import { describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from './client';
import { z } from 'zod';

describe('apiFetch', () => {
  it('parses a successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true }),
      }),
    );

    const result = await apiFetch('/api/health', z.object({ ok: z.boolean() }));
    expect(result).toEqual({ ok: true });
  });

  it('throws ApiError with server message on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      }),
    );

    await expect(apiFetch('/api/alerts', z.object({}))).rejects.toSatisfy(
      (error: unknown) => error instanceof ApiError && error.status === 401,
    );
  });
});

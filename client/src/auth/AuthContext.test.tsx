import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import type { ReactNode } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('logs in and exposes token/user', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          token: 'abc',
          user: {
            id: '1',
            email: 'admin@happening.local',
            name: 'Admin',
            role: 'admin',
            createdAt: new Date().toISOString(),
          },
        }),
      }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('admin@happening.local', 'admin123');
    });

    await waitFor(() => {
      expect(result.current.token).toBe('abc');
      expect(result.current.user?.role).toBe('admin');
    });
  });

  it('logout clears session', async () => {
    localStorage.setItem(
      'happening.auth',
      JSON.stringify({
        token: 'abc',
        user: {
          id: '1',
          email: 'a@b.c',
          name: 'A',
          role: 'user',
          createdAt: new Date().toISOString(),
        },
      }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.token).toBe('abc');

    act(() => {
      result.current.logout();
    });

    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('happening.auth')).toBeNull();
  });
});

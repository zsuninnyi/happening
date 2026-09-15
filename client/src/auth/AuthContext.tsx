import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { loginRequest } from '../api/auth';
import type { PublicUser } from '../api/types';

const STORAGE_KEY = 'happening.auth';

type StoredAuth = {
  token: string;
  user: PublicUser;
};

type AuthContextValue = {
  token: string | null;
  user: PublicUser | null;
  login: (email: string, password: string) => Promise<PublicUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(() => readStoredAuth());

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password);
    const next = { token: result.token, user: result.user };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setAuth(next);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  }, []);

  const value = useMemo(
    () => ({
      token: auth?.token ?? null,
      user: auth?.user ?? null,
      login,
      logout,
    }),
    [auth, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

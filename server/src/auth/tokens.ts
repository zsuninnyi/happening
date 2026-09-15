import { randomBytes } from 'node:crypto';
import type { Role } from '../domain/types.js';

export type Session = {
  userId: string;
  role: Role;
};

export class TokenStore {
  private readonly sessions = new Map<string, Session>();

  issue(userId: string, role: Role): string {
    const token = randomBytes(32).toString('hex');
    this.sessions.set(token, { userId, role });
    return token;
  }

  get(token: string): Session | undefined {
    return this.sessions.get(token);
  }

  revoke(token: string): boolean {
    return this.sessions.delete(token);
  }

  clear(): void {
    this.sessions.clear();
  }
}

export const tokenStore = new TokenStore();

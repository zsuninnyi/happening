import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { publicUserSchema, type PublicUser } from '../domain/types.js';
import { tokenStore } from './tokens.js';

export type AuthedRequest = Request & {
  user: PublicUser;
  token: string;
};

function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, value] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !value) return null;
  return value;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractBearerToken(req.header('authorization'));
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const session = tokenStore.get(token);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    tokenStore.revoke(token);
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const publicUser = publicUserSchema.parse(user);
  (req as AuthedRequest).user = publicUser;
  (req as AuthedRequest).token = token;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as AuthedRequest).user;
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  next();
}

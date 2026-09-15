import { prisma } from '../db/prisma.js';
import { publicUserSchema, type PublicUser } from '../domain/types.js';

export async function listPublicUsers(): Promise<PublicUser[]> {
  const rows = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
  });
  return rows.map((row) => publicUserSchema.parse(row));
}

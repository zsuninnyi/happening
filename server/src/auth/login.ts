import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { publicUserSchema, type PublicUser } from '../domain/types.js';
import { tokenStore } from './tokens.js';

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export type LoginResult = {
  token: string;
  user: PublicUser;
};

export class AuthError extends Error {
  constructor(
    message: string,
    readonly statusCode: 401 | 403 | 400,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || user.password !== input.password) {
    throw new AuthError('Invalid email or password', 401);
  }

  const publicUser = publicUserSchema.parse(user);
  const token = tokenStore.issue(user.id, publicUser.role);

  return { token, user: publicUser };
}

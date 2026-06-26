import { createHash, randomBytes } from 'node:crypto';
import type { DataStore, User } from '../data/types.js';

const sessionDays = 30;

export function hashSessionToken(token: string, secret: string): string {
  return createHash('sha256').update(`${secret}:${token}`).digest('base64url');
}

export function readBearerToken(authorization: string | undefined): string | undefined {
  if (!authorization) return undefined;
  const [scheme, token] = authorization.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return undefined;
  return token;
}

export function createSessionService(store: DataStore, secret: string) {
  return {
    async createForUser(userId: string): Promise<string> {
      const token = randomBytes(32).toString('base64url');
      const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000).toISOString();
      await store.sessions.create({
        userId,
        tokenHash: hashSessionToken(token, secret),
        expiresAt
      });
      return token;
    },
    async findUserByToken(token: string | undefined): Promise<User | undefined> {
      if (!token) return undefined;
      const session = await store.sessions.findByTokenHash(hashSessionToken(token, secret));
      if (!session || session.expiresAt <= new Date().toISOString()) return undefined;
      const user = await store.users.findById(session.userId);
      if (!user || user.status !== 'active') return undefined;
      return user;
    },
    async deleteToken(token: string | undefined): Promise<boolean> {
      if (!token) return false;
      return store.sessions.deleteByTokenHash(hashSessionToken(token, secret));
    }
  };
}

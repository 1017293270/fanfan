import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { DataStore, User } from '../data/types.js';
import { LoginSchema, RegisterSchema } from '../schemas/auth.js';
import { hashPassword, verifyPassword } from '../services/password.js';
import { createSessionService, readBearerToken } from '../services/sessions.js';

export type AuthRouteDeps = {
  store: DataStore;
  sessionSecret: string;
};

export function publicUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt
  };
}

export async function requireUser(request: FastifyRequest, deps: AuthRouteDeps): Promise<User | undefined> {
  const token = readBearerToken(request.headers.authorization);
  const sessions = createSessionService(deps.store, deps.sessionSecret);
  return sessions.findUserByToken(token);
}

export async function registerAuthRoutes(app: FastifyInstance, deps: AuthRouteDeps) {
  const sessions = createSessionService(deps.store, deps.sessionSecret);

  app.post('/api/auth/register', async (request, reply) => {
    const parsed = RegisterSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: 'Invalid registration request', issues: parsed.error.flatten() });
    }

    const invite = await deps.store.inviteCodes.findByCode(parsed.data.inviteCode);
    if (!invite || invite.status !== 'unused') {
      return reply.status(400).send({ message: 'Invalid or used invite code' });
    }

    const existing = await deps.store.users.findByUsername(parsed.data.username);
    if (existing) {
      return reply.status(409).send({ message: 'Username already exists' });
    }

    const user = await deps.store.users.create({
      username: parsed.data.username,
      displayName: parsed.data.displayName,
      passwordHash: await hashPassword(parsed.data.password),
      role: 'user'
    });
    await deps.store.inviteCodes.update(invite.id, {
      status: 'used',
      usedByUserId: user.id,
      usedAt: new Date().toISOString()
    });
    const token = await sessions.createForUser(user.id);
    return reply.status(201).send({ user: publicUser(user), token });
  });

  app.post('/api/auth/login', async (request, reply) => {
    const parsed = LoginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ message: 'Invalid login request', issues: parsed.error.flatten() });
    }

    const user = await deps.store.users.findByUsername(parsed.data.username);
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return reply.status(401).send({ message: 'Invalid username or password' });
    }
    if (user.status !== 'active') {
      return reply.status(403).send({ message: 'Account disabled' });
    }

    const updated = await deps.store.users.update(user.id, { lastLoginAt: new Date().toISOString() });
    const token = await sessions.createForUser(user.id);
    return reply.send({ user: publicUser(updated || user), token });
  });

  app.post('/api/auth/logout', async (request) => {
    const token = readBearerToken(request.headers.authorization);
    await sessions.deleteToken(token);
    return { ok: true };
  });

  app.get('/api/auth/me', async (request, reply) => {
    const user = await requireUser(request, deps);
    if (!user) return reply.status(401).send({ message: 'Authentication required' });
    return { user: publicUser(user) };
  });
}

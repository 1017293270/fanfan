import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { DataStore, User } from '../data/types.js';
import { AccountStatusSchema, InviteCodeCreateSchema, InviteCodeStatusSchema } from '../schemas/account.js';
import { publicUser, requireUser } from './auth.js';

type AdminRouteDeps = {
  store: DataStore;
  sessionSecret: string;
};

function randomInviteCode(): string {
  return `FAN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function requireAdmin(request: FastifyRequest, deps: AdminRouteDeps): Promise<User | undefined> {
  const user = await requireUser(request, deps);
  return user?.role === 'super_admin' ? user : undefined;
}

export async function registerAdminRoutes(app: FastifyInstance, deps: AdminRouteDeps) {
  app.get('/api/admin/users', async (request, reply) => {
    const admin = await requireAdmin(request, deps);
    if (!admin) return reply.status(403).send({ message: 'Admin access required' });
    const users = await deps.store.users.list();
    return { users: users.map(publicUser) };
  });

  app.patch('/api/admin/users/:id/status', async (request, reply) => {
    const admin = await requireAdmin(request, deps);
    if (!admin) return reply.status(403).send({ message: 'Admin access required' });
    const parsed = AccountStatusSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ message: 'Invalid account status' });
    const id = (request.params as { id: string }).id;
    const user = await deps.store.users.update(id, { status: parsed.data.status });
    if (!user) return reply.status(404).send({ message: 'User not found' });
    return { user: publicUser(user) };
  });

  app.get('/api/admin/invite-codes', async (request, reply) => {
    const admin = await requireAdmin(request, deps);
    if (!admin) return reply.status(403).send({ message: 'Admin access required' });
    return { inviteCodes: await deps.store.inviteCodes.list() };
  });

  app.post('/api/admin/invite-codes', async (request, reply) => {
    const admin = await requireAdmin(request, deps);
    if (!admin) return reply.status(403).send({ message: 'Admin access required' });
    const parsed = InviteCodeCreateSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ message: 'Invalid invite code request' });
    const inviteCode = await deps.store.inviteCodes.create({
      code: (parsed.data.code || randomInviteCode()).toUpperCase(),
      createdByUserId: admin.id
    });
    return reply.status(201).send({ inviteCode });
  });

  app.patch('/api/admin/invite-codes/:id/status', async (request, reply) => {
    const admin = await requireAdmin(request, deps);
    if (!admin) return reply.status(403).send({ message: 'Admin access required' });
    const parsed = InviteCodeStatusSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ message: 'Invalid invite code status' });
    const id = (request.params as { id: string }).id;
    const inviteCode = await deps.store.inviteCodes.update(id, { status: parsed.data.status });
    if (!inviteCode) return reply.status(404).send({ message: 'Invite code not found' });
    return { inviteCode };
  });
}

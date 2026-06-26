import type { FastifyInstance } from 'fastify';
import type { DataStore } from '../data/types.js';
import { AmapImportSchema, LinkUpdateSchema, StoreCreateSchema, StoreUpdateSchema } from '../schemas/stores.js';
import { createManualStoreForPlaces, importAmapStoreToPlace } from '../services/storeLibrary.js';
import { requireUser } from './auth.js';

type StoreRouteDeps = {
  store: DataStore;
  sessionSecret: string;
};

async function listStoreViews(store: DataStore, userId: string) {
  const [stores, links] = await Promise.all([store.stores.listByUser(userId), store.storePlaceLinks.listByUser(userId)]);
  return stores.map((item) => ({
    ...item,
    links: links.filter((link) => link.storeId === item.id)
  }));
}

export async function registerStoreRoutes(app: FastifyInstance, deps: StoreRouteDeps) {
  app.get('/api/stores', async (request, reply) => {
    const user = await requireUser(request, deps);
    if (!user) return reply.status(401).send({ message: 'Authentication required' });
    return { stores: await listStoreViews(deps.store, user.id) };
  });

  app.post('/api/stores', async (request, reply) => {
    const user = await requireUser(request, deps);
    if (!user) return reply.status(401).send({ message: 'Authentication required' });
    const parsed = StoreCreateSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ message: 'Invalid store request', issues: parsed.error.flatten() });
    try {
      const result = await createManualStoreForPlaces(deps.store, user.id, parsed.data);
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'PLACE_NOT_FOUND') {
        return reply.status(404).send({ message: 'Place not found' });
      }
      throw error;
    }
  });

  app.patch('/api/stores/:id', async (request, reply) => {
    const user = await requireUser(request, deps);
    if (!user) return reply.status(401).send({ message: 'Authentication required' });
    const parsed = StoreUpdateSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ message: 'Invalid store update' });
    const store = await deps.store.stores.update(user.id, (request.params as { id: string }).id, parsed.data);
    if (!store) return reply.status(404).send({ message: 'Store not found' });
    return { store };
  });

  app.delete('/api/stores/:id', async (request, reply) => {
    const user = await requireUser(request, deps);
    if (!user) return reply.status(401).send({ message: 'Authentication required' });
    const deleted = await deps.store.stores.delete(user.id, (request.params as { id: string }).id);
    if (!deleted) return reply.status(404).send({ message: 'Store not found' });
    return reply.status(204).send();
  });

  app.patch('/api/store-place-links/:id', async (request, reply) => {
    const user = await requireUser(request, deps);
    if (!user) return reply.status(401).send({ message: 'Authentication required' });
    const parsed = LinkUpdateSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ message: 'Invalid link update' });
    const link = await deps.store.storePlaceLinks.update(user.id, (request.params as { id: string }).id, parsed.data);
    if (!link) return reply.status(404).send({ message: 'Store place link not found' });
    return { link };
  });

  app.post('/api/stores/import-amap', async (request, reply) => {
    const user = await requireUser(request, deps);
    if (!user) return reply.status(401).send({ message: 'Authentication required' });
    const parsed = AmapImportSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ message: 'Invalid AMap import request' });
    try {
      const result = await importAmapStoreToPlace(deps.store, user.id, parsed.data);
      return reply.status(result.wasCreated ? 201 : 200).send({
        store: result.store,
        link: result.link
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'PLACE_NOT_FOUND') {
        return reply.status(404).send({ message: 'Place not found' });
      }
      throw error;
    }
  });
}

import type { FastifyInstance } from 'fastify';
import type { DataStore } from '../data/types.js';
import { PlaceCreateSchema, PlaceMatchSchema, PlaceUpdateSchema } from '../schemas/places.js';
import { matchPlaceByLocation } from '../services/places.js';
import { requireUser } from './auth.js';

type PlaceRouteDeps = {
  store: DataStore;
  sessionSecret: string;
};

export async function registerPlaceRoutes(app: FastifyInstance, deps: PlaceRouteDeps) {
  app.get('/api/places', async (request, reply) => {
    const user = await requireUser(request, deps);
    if (!user) return reply.status(401).send({ message: 'Authentication required' });
    return { places: await deps.store.places.listByUser(user.id) };
  });

  app.post('/api/places', async (request, reply) => {
    const user = await requireUser(request, deps);
    if (!user) return reply.status(401).send({ message: 'Authentication required' });
    const parsed = PlaceCreateSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ message: 'Invalid place request' });
    const place = await deps.store.places.create({ userId: user.id, ...parsed.data });
    return reply.status(201).send({ place });
  });

  app.patch('/api/places/:id', async (request, reply) => {
    const user = await requireUser(request, deps);
    if (!user) return reply.status(401).send({ message: 'Authentication required' });
    const parsed = PlaceUpdateSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ message: 'Invalid place update' });
    const place = await deps.store.places.update(user.id, (request.params as { id: string }).id, parsed.data);
    if (!place) return reply.status(404).send({ message: 'Place not found' });
    return { place };
  });

  app.delete('/api/places/:id', async (request, reply) => {
    const user = await requireUser(request, deps);
    if (!user) return reply.status(401).send({ message: 'Authentication required' });
    const deleted = await deps.store.places.delete(user.id, (request.params as { id: string }).id);
    if (!deleted) return reply.status(404).send({ message: 'Place not found' });
    return reply.status(204).send();
  });

  app.post('/api/places/match', async (request, reply) => {
    const user = await requireUser(request, deps);
    if (!user) return reply.status(401).send({ message: 'Authentication required' });
    const parsed = PlaceMatchSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ message: 'Invalid location' });
    const places = await deps.store.places.listByUser(user.id);
    return matchPlaceByLocation({ places, location: parsed.data });
  });
}

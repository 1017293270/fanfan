import cors from '@fastify/cors';
import Fastify from 'fastify';
import type { DataStore } from './data/types.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerAmapRoutes } from './routes/amap.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerPlaceRoutes } from './routes/places.js';
import { registerRecommendationRoutes, type RecommendationService } from './routes/recommendations.js';
import { registerStoreRoutes } from './routes/stores.js';
import type { AmapClient } from './services/amapClient.js';

export function buildApp(deps: {
  recommendationService: RecommendationService;
  store?: DataStore;
  sessionSecret?: string;
  amapClient?: AmapClient;
}) {
  const app = Fastify({
    logger: true
  });

  app.register(cors, {
    origin: true
  });

  app.get('/health', async () => ({ ok: true }));
  if (deps.store) {
    const authDeps = {
      store: deps.store,
      sessionSecret: deps.sessionSecret || 'kaifanli-local-session-secret'
    };
    app.register(registerAuthRoutes, authDeps);
    app.register(registerAdminRoutes, authDeps);
    app.register(registerPlaceRoutes, authDeps);
    app.register(registerStoreRoutes, authDeps);
    app.register(registerAmapRoutes, { ...authDeps, amapClient: deps.amapClient });
  }
  app.register(registerRecommendationRoutes, deps);

  return app;
}

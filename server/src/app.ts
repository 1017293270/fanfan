import cors from '@fastify/cors';
import Fastify from 'fastify';
import type { DataStore } from './data/types.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerRecommendationRoutes, type RecommendationService } from './routes/recommendations.js';

export function buildApp(deps: {
  recommendationService: RecommendationService;
  store?: DataStore;
  sessionSecret?: string;
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
  }
  app.register(registerRecommendationRoutes, deps);

  return app;
}

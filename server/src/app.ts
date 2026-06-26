import cors from '@fastify/cors';
import Fastify from 'fastify';
import { registerRecommendationRoutes, type RecommendationService } from './routes/recommendations.js';

export function buildApp(deps: { recommendationService: RecommendationService }) {
  const app = Fastify({
    logger: true
  });

  app.register(cors, {
    origin: true
  });

  app.get('/health', async () => ({ ok: true }));
  app.register(registerRecommendationRoutes, deps);

  return app;
}

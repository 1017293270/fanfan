import type { FastifyInstance } from 'fastify';
import type { DataStore } from '../data/types.js';
import {
  RecommendationRequestSchema,
  type RecommendationServiceRequest,
  type RecommendationResponse
} from '../schemas/recommendation.js';
import { requireUser } from './auth.js';

export type RecommendationService = {
  recommend(request: RecommendationServiceRequest): Promise<RecommendationResponse>;
};

export async function registerRecommendationRoutes(
  app: FastifyInstance,
  deps: { recommendationService: RecommendationService; store?: DataStore; sessionSecret?: string }
) {
  app.post('/api/recommendations', async (request, reply) => {
    const parsed = RecommendationRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: 'Invalid recommendation request',
        issues: parsed.error.flatten()
      });
    }

    try {
      const user =
        deps.store && deps.sessionSecret && request.headers.authorization
          ? await requireUser(request, { store: deps.store, sessionSecret: deps.sessionSecret })
          : undefined;
      const result = await deps.recommendationService.recommend({
        ...parsed.data,
        userContext: user
          ? {
              userId: user.id,
              activePlaceId: parsed.data.activePlaceId
            }
          : undefined
      });
      return reply.send(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'NO_RESTAURANTS_FOUND') {
        return reply.status(404).send({ message: 'No matching restaurants found' });
      }
      request.log.error(error);
      return reply.status(502).send({ message: 'Recommendation service failed' });
    }
  });
}

import type { FastifyInstance } from 'fastify';
import {
  RecommendationRequestSchema,
  type RecommendationRequest,
  type RecommendationResponse
} from '../schemas/recommendation.js';

export type RecommendationService = {
  recommend(request: RecommendationRequest): Promise<RecommendationResponse>;
};

export async function registerRecommendationRoutes(
  app: FastifyInstance,
  deps: { recommendationService: RecommendationService }
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
      const result = await deps.recommendationService.recommend(parsed.data);
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

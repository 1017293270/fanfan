import type { RecommendationRequest, RecommendationResponse } from '../schemas/recommendation.js';
import type { AiCompleteJson } from './aiClient.js';
import type { AmapClient } from './amapClient.js';
import { parsePreference } from './preferenceParser.js';
import { rankCandidates } from './ranker.js';
import { writeRecommendationReason } from './reasonWriter.js';

type RecommendationServiceDeps = {
  amapClient: AmapClient;
  aiCompleteJson: AiCompleteJson;
};

export function createRecommendationService(deps: RecommendationServiceDeps) {
  return {
    async recommend(request: RecommendationRequest): Promise<RecommendationResponse> {
      const parsedPreference = await parsePreference({
        textPreference: request.textPreference,
        quickFilters: request.quickFilters,
        aiCompleteJson: deps.aiCompleteJson
      });

      const candidates = await deps.amapClient.searchRestaurants({
        location: request.location,
        radiusMeters: parsedPreference.distanceMeters,
        keywords: parsedPreference.cravings
      });

      const ranked = rankCandidates({
        candidates,
        preference: parsedPreference,
        excludedPoiIds: request.localContext.excludedPoiIds,
        favoritePoiIds: request.localContext.favoritePoiIds
      });

      if (ranked.length === 0) {
        throw new Error('NO_RESTAURANTS_FOUND');
      }

      const primary = ranked[0];
      const reason = await writeRecommendationReason({
        aiCompleteJson: deps.aiCompleteJson,
        preference: parsedPreference,
        restaurant: primary
      });

      return {
        requestId: `rec_${Date.now()}`,
        parsedPreference,
        primaryRecommendation: {
          ...primary,
          reason
        },
        alternatives: ranked.slice(1, 3)
      };
    }
  };
}

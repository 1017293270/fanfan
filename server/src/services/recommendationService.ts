import type {
  ParsedPreference,
  RecommendationResponse,
  RecommendationServiceRequest,
  RestaurantCandidate
} from '../schemas/recommendation.js';
import type { DataStore } from '../data/types.js';
import type { AiCompleteJson } from './aiClient.js';
import type { AmapClient } from './amapClient.js';
import { parsePreference } from './preferenceParser.js';
import { rankCandidates } from './ranker.js';
import { writeRecommendationReason } from './reasonWriter.js';
import { buildUserRecommendationContext } from './userRecommendationContext.js';

type RecommendationServiceDeps = {
  amapClient: AmapClient;
  aiCompleteJson: AiCompleteJson;
  dataStore?: DataStore;
};

const defaultMealSearchKeywords = ['中餐', '快餐', '面馆', '米饭', '盖饭', '粥', '小吃'];
const lightMealSearchKeywords = ['咖啡', '奶茶', '饮品', '茶饮', '甜品', '蛋糕', '面包'];
const vagueCravings = ['热乎', '热的', '热汤', '清淡', '少辣', '不辣', '不太辣', '随便', '都行'];

function hasKeyword(values: string[], keywords: string[]): boolean {
  const normalized = values.join(' ').toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

function searchKeywordsFor(preference: ParsedPreference): string[] {
  const cravings = preference.cravings.map((item) => item.trim()).filter(Boolean);
  if (cravings.length === 0) return defaultMealSearchKeywords;
  if (hasKeyword(cravings, lightMealSearchKeywords)) return cravings;

  const hasConcreteCraving = cravings.some((craving) => !vagueCravings.includes(craving));
  return hasConcreteCraving ? cravings : defaultMealSearchKeywords;
}

export function createRecommendationService(deps: RecommendationServiceDeps) {
  return {
    async recommend(request: RecommendationServiceRequest): Promise<RecommendationResponse> {
      const parsedPreference = await parsePreference({
        textPreference: request.textPreference,
        quickFilters: request.quickFilters,
        aiCompleteJson: deps.aiCompleteJson
      });
      const requestLocalContext = {
        excludedPoiIds: request.localContext?.excludedPoiIds || [],
        favoritePoiIds: request.localContext?.favoritePoiIds || [],
        penalizedPoiIds: request.localContext?.penalizedPoiIds || []
      };

      let candidates: RestaurantCandidate[] = [];
      let userLocalContext = {
        excludedPoiIds: [] as string[],
        favoritePoiIds: [] as string[],
        penalizedPoiIds: [] as string[]
      };

      if (deps.dataStore && request.userContext?.activePlaceId) {
        const context = await buildUserRecommendationContext({
          dataStore: deps.dataStore,
          userId: request.userContext.userId,
          activePlaceId: request.userContext.activePlaceId,
          location: request.location
        });
        candidates = context.candidates;
        userLocalContext = context.localContext;
      }

      if (candidates.length < 3) {
        const amapCandidates = await deps.amapClient.searchRestaurants({
          location: request.location,
          radiusMeters: parsedPreference.distanceMeters,
          keywords: searchKeywordsFor(parsedPreference)
        });
        const existingPoiIds = new Set(candidates.map((candidate) => candidate.poiId));
        candidates = candidates.concat(amapCandidates.filter((candidate) => !existingPoiIds.has(candidate.poiId)));
      }

      const ranked = rankCandidates({
        candidates,
        preference: parsedPreference,
        excludedPoiIds: requestLocalContext.excludedPoiIds.concat(userLocalContext.excludedPoiIds),
        favoritePoiIds: requestLocalContext.favoritePoiIds.concat(userLocalContext.favoritePoiIds),
        penalizedPoiIds: requestLocalContext.penalizedPoiIds.concat(userLocalContext.penalizedPoiIds)
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

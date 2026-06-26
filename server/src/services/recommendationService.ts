import type { ParsedPreference, RecommendationRequest, RecommendationResponse } from '../schemas/recommendation.js';
import type { AiCompleteJson } from './aiClient.js';
import type { AmapClient } from './amapClient.js';
import { parsePreference } from './preferenceParser.js';
import { rankCandidates } from './ranker.js';
import { writeRecommendationReason } from './reasonWriter.js';

type RecommendationServiceDeps = {
  amapClient: AmapClient;
  aiCompleteJson: AiCompleteJson;
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
    async recommend(request: RecommendationRequest): Promise<RecommendationResponse> {
      const parsedPreference = await parsePreference({
        textPreference: request.textPreference,
        quickFilters: request.quickFilters,
        aiCompleteJson: deps.aiCompleteJson
      });

      const candidates = await deps.amapClient.searchRestaurants({
        location: request.location,
        radiusMeters: parsedPreference.distanceMeters,
        keywords: searchKeywordsFor(parsedPreference)
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

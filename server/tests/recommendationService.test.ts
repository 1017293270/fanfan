import { describe, expect, it } from 'vitest';
import { createRecommendationService } from '../src/services/recommendationService.js';
import { candidateA, candidateB } from '../src/test/fixtures.js';

describe('createRecommendationService', () => {
  it('returns one primary recommendation and alternates', async () => {
    const service = createRecommendationService({
      amapClient: {
        searchRestaurants: async () => [candidateA, candidateB]
      },
      aiCompleteJson: async (messages) => {
        const system = messages[0]?.content || '';
        if (system.includes('偏好解析器')) {
          return {
            distanceMeters: 1500,
            budgetPerPerson: 35,
            spicyPreference: 'mild',
            cravings: ['热乎', '面食'],
            avoid: ['太辣'],
            mustOpenNow: true
          };
        }
        return { reason: '热乎、近，而且预算也合适。' };
      }
    });

    const result = await service.recommend({
      location: { latitude: 31.2304, longitude: 121.4737 },
      textPreference: '想吃热乎的',
      quickFilters: {
        distanceMeters: 1500,
        budgetPerPerson: 35,
        spicyPreference: 'mild',
        craving: '面食',
        openNow: true
      },
      localContext: {
        excludedPoiIds: [],
        favoritePoiIds: []
      }
    });

    expect(result.primaryRecommendation.poiId).toBe('B002');
    expect(result.primaryRecommendation.reason).toBe('热乎、近，而且预算也合适。');
    expect(result.alternatives).toHaveLength(1);
  });
});

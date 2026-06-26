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

  it('searches default meal keywords when the preference has no concrete craving', async () => {
    let searchedKeywords: string[] = [];
    const service = createRecommendationService({
      amapClient: {
        searchRestaurants: async (input) => {
          searchedKeywords = input.keywords;
          return [candidateA];
        }
      },
      aiCompleteJson: async (messages) => {
        const system = messages[0]?.content || '';
        if (system.includes('偏好解析器')) {
          return {
            distanceMeters: 1500,
            budgetPerPerson: 35,
            spicyPreference: 'mild',
            cravings: [],
            avoid: [],
            mustOpenNow: true
          };
        }
        return { reason: '默认先找正餐。' };
      }
    });

    await service.recommend({
      location: { latitude: 31.2304, longitude: 121.4737 },
      textPreference: '',
      quickFilters: {
        distanceMeters: 1500,
        budgetPerPerson: 35,
        spicyPreference: 'mild',
        openNow: true
      },
      localContext: {
        excludedPoiIds: [],
        favoritePoiIds: []
      }
    });

    expect(searchedKeywords).toEqual(expect.arrayContaining(['中餐', '快餐', '面馆', '米饭', '粥']));
    expect(searchedKeywords).not.toContain('餐饮');
  });

  it('searches default meal keywords for vague cravings like hot food', async () => {
    let searchedKeywords: string[] = [];
    const service = createRecommendationService({
      amapClient: {
        searchRestaurants: async (input) => {
          searchedKeywords = input.keywords;
          return [candidateA];
        }
      },
      aiCompleteJson: async (messages) => {
        const system = messages[0]?.content || '';
        if (system.includes('偏好解析器')) {
          return {
            distanceMeters: 1500,
            budgetPerPerson: 35,
            spicyPreference: 'mild',
            cravings: ['热乎'],
            avoid: [],
            mustOpenNow: true
          };
        }
        return { reason: '热乎只是口感，候选池仍然先找正餐。' };
      }
    });

    await service.recommend({
      location: { latitude: 31.2304, longitude: 121.4737 },
      textPreference: '想吃热乎的',
      quickFilters: {
        distanceMeters: 1500,
        budgetPerPerson: 35,
        spicyPreference: 'mild',
        openNow: true
      },
      localContext: {
        excludedPoiIds: [],
        favoritePoiIds: []
      }
    });

    expect(searchedKeywords).toEqual(expect.arrayContaining(['中餐', '快餐', '面馆', '米饭', '粥']));
    expect(searchedKeywords).not.toContain('热乎');
  });

  it('keeps explicit light-meal keywords when the user asks for coffee', async () => {
    let searchedKeywords: string[] = [];
    const service = createRecommendationService({
      amapClient: {
        searchRestaurants: async (input) => {
          searchedKeywords = input.keywords;
          return [
            {
              ...candidateA,
              poiId: 'coffee',
              name: '巷口咖啡',
              category: '餐饮服务;咖啡厅;咖啡厅',
              tags: ['咖啡']
            }
          ];
        }
      },
      aiCompleteJson: async (messages) => {
        const system = messages[0]?.content || '';
        if (system.includes('偏好解析器')) {
          return {
            distanceMeters: 1500,
            budgetPerPerson: 50,
            spicyPreference: 'mild',
            cravings: ['咖啡'],
            avoid: [],
            mustOpenNow: true
          };
        }
        return { reason: '就是想喝咖啡。' };
      }
    });

    await service.recommend({
      location: { latitude: 31.2304, longitude: 121.4737 },
      textPreference: '想喝咖啡',
      quickFilters: {
        distanceMeters: 1500,
        budgetPerPerson: 50,
        spicyPreference: 'mild',
        craving: '咖啡',
        openNow: true
      },
      localContext: {
        excludedPoiIds: [],
        favoritePoiIds: []
      }
    });

    expect(searchedKeywords).toEqual(['咖啡']);
  });
});

import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { candidateA } from '../src/test/fixtures.js';

describe('POST /api/recommendations', () => {
  it('returns a recommendation response for valid input', async () => {
    const app = buildApp({
      recommendationService: {
        recommend: async () => ({
          requestId: 'rec_test',
          parsedPreference: {
            distanceMeters: 1500,
            budgetPerPerson: 30,
            spicyPreference: 'mild',
            cravings: ['米饭'],
            avoid: ['太辣'],
            mustOpenNow: true
          },
          primaryRecommendation: {
            ...candidateA,
            reason: '离你近，口味也合适。'
          },
          alternatives: []
        })
      }
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/recommendations',
      payload: {
        location: { latitude: 31.2304, longitude: 121.4737 },
        textPreference: '不太辣',
        quickFilters: {
          distanceMeters: 1500,
          budgetPerPerson: 30,
          spicyPreference: 'mild',
          craving: '米饭',
          openNow: true
        },
        localContext: {
          excludedPoiIds: [],
          favoritePoiIds: []
        }
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().primaryRecommendation.name).toBe('巷口小厨');
  });

  it('returns 400 for invalid location', async () => {
    const app = buildApp({
      recommendationService: {
        recommend: async () => {
          throw new Error('should not be called');
        }
      }
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/recommendations',
      payload: {
        location: { latitude: 200, longitude: 121.4737 },
        quickFilters: {
          distanceMeters: 1500,
          openNow: true
        }
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().message).toBe('Invalid recommendation request');
  });
});

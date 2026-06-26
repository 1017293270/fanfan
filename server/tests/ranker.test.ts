import { describe, expect, it } from 'vitest';
import { rankCandidates } from '../src/services/ranker.js';
import { candidateA, candidateB } from '../src/test/fixtures.js';

describe('rankCandidates', () => {
  it('excludes disliked POIs and prefers matching cravings, budget, and distance', () => {
    const ranked = rankCandidates({
      candidates: [
        { ...candidateA, poiId: 'excluded', name: '排除店' },
        candidateB,
        { ...candidateA, poiId: 'B003', distanceMeters: 2400, avgPrice: 80, tags: ['火锅', '辣'] }
      ],
      preference: {
        distanceMeters: 1500,
        budgetPerPerson: 35,
        spicyPreference: 'mild',
        cravings: ['热乎', '面食'],
        avoid: ['太辣'],
        mustOpenNow: true
      },
      excludedPoiIds: ['excluded'],
      favoritePoiIds: []
    });

    expect(ranked[0].poiId).toBe('B002');
    expect(ranked.some((item) => item.poiId === 'excluded')).toBe(false);
  });

  it('prefers meal restaurants over coffee shops when the user did not ask for coffee', () => {
    const ranked = rankCandidates({
      candidates: [
        {
          poiId: 'coffee',
          name: 'aaaa coffee',
          category: '餐饮服务;咖啡厅;咖啡厅',
          distanceMeters: 120,
          rating: '4.9',
          avgPrice: 36,
          address: '附近 1 号',
          tags: ['咖啡厅'],
          openNow: true
        },
        {
          ...candidateA,
          poiId: 'meal',
          distanceMeters: 900,
          rating: '4.0',
          avgPrice: 35,
          category: '餐饮服务;中餐厅;中餐厅',
          tags: ['米饭', '家常菜']
        }
      ],
      preference: {
        distanceMeters: 1500,
        budgetPerPerson: 40,
        spicyPreference: 'mild',
        cravings: [],
        avoid: [],
        mustOpenNow: true
      },
      excludedPoiIds: [],
      favoritePoiIds: []
    });

    expect(ranked[0].poiId).toBe('meal');
  });
});

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
});

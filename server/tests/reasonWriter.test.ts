import { describe, expect, it } from 'vitest';
import { writeRecommendationReason } from '../src/services/reasonWriter.js';
import { candidateA } from '../src/test/fixtures.js';

describe('writeRecommendationReason', () => {
  it('keeps AI reasons within the short mini program card limit', async () => {
    const reason = await writeRecommendationReason({
      aiCompleteJson: async () => ({
        reason:
          '餐厅距离833米，需步行约12分钟，在1500米距离范围内，人均15元，在30元预算内且性价比较高。'
      }),
      preference: {
        distanceMeters: 1500,
        budgetPerPerson: 30,
        spicyPreference: 'mild',
        cravings: ['米饭'],
        avoid: ['辛辣'],
        mealScene: '温热正餐',
        mustOpenNow: true
      },
      restaurant: candidateA
    });

    expect(Array.from(reason).length).toBeLessThanOrEqual(35);
  });
});

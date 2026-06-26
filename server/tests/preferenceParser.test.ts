import { describe, expect, it } from 'vitest';
import { parsePreference } from '../src/services/preferenceParser.js';

describe('parsePreference', () => {
  it('uses AI structured output when available', async () => {
    const result = await parsePreference({
      textPreference: '想吃热乎的，不太辣，别太远',
      quickFilters: {
        distanceMeters: 1500,
        budgetPerPerson: 30,
        spicyPreference: 'mild',
        craving: '米饭',
        openNow: true
      },
      aiCompleteJson: async () => ({
        distanceMeters: 1200,
        budgetPerPerson: 35,
        spicyPreference: 'mild',
        cravings: ['热乎', '米饭'],
        avoid: ['太辣', '太远'],
        mealScene: '工作日午餐',
        mustOpenNow: true
      })
    });

    expect(result.cravings).toEqual(['热乎', '米饭']);
    expect(result.distanceMeters).toBe(1200);
    expect(result.mustOpenNow).toBe(true);
  });

  it('falls back to quick filters and keywords when AI fails', async () => {
    const result = await parsePreference({
      textPreference: '今天不要太辣，想吃热乎的',
      quickFilters: {
        distanceMeters: 1500,
        budgetPerPerson: 30,
        spicyPreference: 'mild',
        craving: '米饭',
        openNow: true
      },
      aiCompleteJson: async () => {
        throw new Error('ai unavailable');
      }
    });

    expect(result).toEqual({
      distanceMeters: 1500,
      budgetPerPerson: 30,
      spicyPreference: 'mild',
      cravings: ['米饭', '热乎'],
      avoid: ['太辣'],
      mealScene: undefined,
      mustOpenNow: true
    });
  });

  it('normalizes flexible AI fields to the public preference contract', async () => {
    const result = await parsePreference({
      textPreference: '想吃热乎的，不太辣，别太远',
      quickFilters: {
        distanceMeters: 1500,
        budgetPerPerson: 30,
        spicyPreference: 'mild',
        craving: '米饭',
        openNow: true
      },
      aiCompleteJson: async () =>
        ({
          distanceMeters: 1500,
          budgetPerPerson: 30,
          spicyPreference: 'mild',
          cravings: ['米饭', '热乎的'],
          avoid: ['辣', '重辣'],
          mealScene: ['日常用餐'],
          mustOpenNow: true
        }) as never
    });

    expect(result.mealScene).toBe('日常用餐');
  });

  it('keeps the quick filter craving when AI omits cravings', async () => {
    const result = await parsePreference({
      textPreference: '想吃热乎的，不太辣，别太远',
      quickFilters: {
        distanceMeters: 1500,
        budgetPerPerson: 30,
        spicyPreference: 'mild',
        craving: '米饭',
        openNow: true
      },
      aiCompleteJson: async () =>
        ({
          distanceMeters: 1500,
          budgetPerPerson: 30,
          spicyPreference: 'mild',
          cravings: [],
          avoid: ['太辣', '太远'],
          mustOpenNow: true
        }) as never
    });

    expect(result.cravings).toEqual(['米饭']);
  });
});

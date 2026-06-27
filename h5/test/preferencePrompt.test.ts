import { describe, expect, it } from 'vitest';
import { buildPreferencePrompt, stripPreferenceLine } from '../src/utils/preferencePrompt';

describe('preference prompt composition', () => {
  it('adds selected tags into the textarea prompt', () => {
    const prompt = buildPreferencePrompt({
      text: '想吃热乎的，不太辣，别太远',
      selections: {
        distanceLabel: '1.5km 内',
        budgetLabel: '人均 30 元内',
        spicyLabel: '少辣',
        cravingLabel: '米饭',
        extraLabels: ['家常菜', '快一点'],
        openNow: true
      }
    });

    expect(prompt).toBe('想吃热乎的，不太辣，别太远。\n偏好：1.5km 内，人均 30 元内，少辣，想吃米饭，家常菜，快一点，营业中优先。');
  });

  it('replaces the existing preference line instead of duplicating it', () => {
    const prompt = buildPreferencePrompt({
      text: '今天想换个新鲜的。\n偏好：3km 内，人均 100 元内，能吃辣，想吃火锅。',
      selections: {
        distanceLabel: '800m 内',
        budgetLabel: '人均 50 元内',
        spicyLabel: '不辣',
        cravingLabel: '面食',
        extraLabels: ['不要排队'],
        openNow: true
      }
    });

    expect(prompt).toBe('今天想换个新鲜的。\n偏好：800m 内，人均 50 元内，不辣，想吃面食，不要排队，营业中优先。');
  });

  it('keeps user prose when removing the generated preference line', () => {
    expect(stripPreferenceLine('想吃清淡点。\n偏好：1.5km 内，人均 30 元内。')).toBe('想吃清淡点。');
  });
});

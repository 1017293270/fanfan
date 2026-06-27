import { describe, expect, it } from 'vitest';
import { feedbackForAction, recommendationLoadingMessage } from '../src/utils/recommendationFeedback';

describe('recommendation feedback helpers', () => {
  it('cycles through a short loading story while recommending', () => {
    expect(recommendationLoadingMessage(0)).toBe('饭饭狸闻闻附近。');
    expect(recommendationLoadingMessage(1)).toBe('饭饭狸看看预算。');
    expect(recommendationLoadingMessage(2)).toBe('饭饭狸准备拍板。');
    expect(recommendationLoadingMessage(3)).toBe('饭饭狸闻闻附近。');
  });

  it('returns friendly toast copy for lightweight actions', () => {
    expect(feedbackForAction('favorite')).toEqual({
      tone: 'success',
      message: '饭饭狸记住啦，下次会多看看类似的。'
    });
    expect(feedbackForAction('dislike')).toEqual({
      tone: 'warm',
      message: '已避开这口，下次少推荐类似的。'
    });
    expect(feedbackForAction('navigate')).toEqual({
      tone: 'success',
      message: '地图已打开，准备开饭。'
    });
  });
});

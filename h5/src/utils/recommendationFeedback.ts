export type RecommendationFeedbackAction = 'favorite' | 'dislike' | 'navigate';

export type RecommendationFeedback = {
  tone: 'success' | 'warm';
  message: string;
};

const loadingMessages = ['饭饭狸闻闻附近。', '饭饭狸看看预算。', '饭饭狸准备拍板。'];

const feedbackMessages: Record<RecommendationFeedbackAction, RecommendationFeedback> = {
  favorite: {
    tone: 'success',
    message: '饭饭狸记住啦，下次会多看看类似的。'
  },
  dislike: {
    tone: 'warm',
    message: '已避开这口，下次少推荐类似的。'
  },
  navigate: {
    tone: 'success',
    message: '地图已打开，准备开饭。'
  }
};

export function recommendationLoadingMessage(step: number) {
  return loadingMessages[Math.abs(step) % loadingMessages.length];
}

export function feedbackForAction(action: RecommendationFeedbackAction) {
  return feedbackMessages[action];
}

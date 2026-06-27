import type { RestaurantCandidate, Store, StorePlaceLink } from '../api/types';

export type RecommendationFeedbackAction = 'favorite' | 'dislike' | 'navigate';

export type RecommendationFeedback = {
  tone: 'success' | 'warm';
  message: string;
};

export type RecommendationStoreMatch = {
  store: Store;
  link: StorePlaceLink;
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

const missingLibraryMessages: Record<Exclude<RecommendationFeedbackAction, 'navigate'>, RecommendationFeedback> = {
  favorite: {
    tone: 'warm',
    message: '这家还没进你的店铺库，先添加或从高德导入后再收藏。'
  },
  dislike: {
    tone: 'warm',
    message: '这家还没进你的店铺库，先添加后才能稳定避开。'
  }
};

export function recommendationLoadingMessage(step: number) {
  return loadingMessages[Math.abs(step) % loadingMessages.length];
}

export function feedbackForAction(action: RecommendationFeedbackAction) {
  return feedbackMessages[action];
}

export function feedbackForLibraryAction(action: Exclude<RecommendationFeedbackAction, 'navigate'>, matched: boolean) {
  return matched ? feedbackForAction(action) : missingLibraryMessages[action];
}

export function findStoreLinkForCandidate(input: {
  candidate: RestaurantCandidate;
  stores: Store[];
  activePlaceId?: string;
}): RecommendationStoreMatch | null {
  const store = input.stores.find((item) => item.amapPoiId === input.candidate.poiId || item.id === input.candidate.poiId);
  if (!store) return null;

  const link = input.activePlaceId ? store.links.find((item) => item.placeId === input.activePlaceId) : store.links[0];
  if (!link) return null;

  return { store, link };
}

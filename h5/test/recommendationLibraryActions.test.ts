import { describe, expect, it } from 'vitest';
import type { RestaurantCandidate, Store, StorePlaceLink } from '../src/api/types';
import { feedbackForLibraryAction, findStoreLinkForCandidate } from '../src/utils/recommendationFeedback';

const baseLink: StorePlaceLink = {
  id: 'link_home',
  userId: 'user_1',
  storeId: 'store_1',
  placeId: 'place_home',
  status: 'active',
  tags: ['米饭'],
  eatenCount: 0,
  createdAt: '2026-06-27T00:00:00.000Z',
  updatedAt: '2026-06-27T00:00:00.000Z'
};

const baseStore: Store = {
  id: 'store_1',
  ownerUserId: 'user_1',
  amapPoiId: 'B001',
  name: '巷口小厨',
  category: '中餐',
  address: '示例路 88 号',
  latitude: 31.23,
  longitude: 121.47,
  source: 'amap',
  createdAt: '2026-06-27T00:00:00.000Z',
  updatedAt: '2026-06-27T00:00:00.000Z',
  links: [baseLink]
};

const baseCandidate: RestaurantCandidate = {
  poiId: 'B001',
  name: '巷口小厨',
  category: '中餐',
  distanceMeters: 560,
  address: '示例路 88 号',
  tags: ['米饭']
};

describe('recommendation library actions', () => {
  it('matches an AMap recommendation to the active place link', () => {
    const result = findStoreLinkForCandidate({
      candidate: baseCandidate,
      stores: [baseStore],
      activePlaceId: 'place_home'
    });

    expect(result).toEqual({ store: baseStore, link: baseLink });
  });

  it('matches a manual library recommendation by store id', () => {
    const manualStore: Store = {
      ...baseStore,
      id: 'store_manual',
      amapPoiId: undefined,
      source: 'manual',
      links: [{ ...baseLink, id: 'link_manual', storeId: 'store_manual' }]
    };

    const result = findStoreLinkForCandidate({
      candidate: { ...baseCandidate, poiId: 'store_manual' },
      stores: [manualStore],
      activePlaceId: 'place_home'
    });

    expect(result?.store.id).toBe('store_manual');
    expect(result?.link.id).toBe('link_manual');
  });

  it('uses explicit copy when the recommendation is not in the store library yet', () => {
    expect(
      findStoreLinkForCandidate({
        candidate: { ...baseCandidate, poiId: 'B999' },
        stores: [baseStore],
        activePlaceId: 'place_home'
      })
    ).toBeNull();

    expect(feedbackForLibraryAction('favorite', false)).toEqual({
      tone: 'warm',
      message: '这家还没进你的店铺库，先添加或从高德导入后再收藏。'
    });
    expect(feedbackForLibraryAction('dislike', false)).toEqual({
      tone: 'warm',
      message: '这家还没进你的店铺库，先添加后才能稳定避开。'
    });
  });
});

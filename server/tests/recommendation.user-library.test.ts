import { describe, expect, it } from 'vitest';
import { createMemoryStore } from '../src/data/memoryStore.js';
import { createRecommendationService } from '../src/services/recommendationService.js';
import { hashPassword } from '../src/services/password.js';
import { candidateA } from '../src/test/fixtures.js';

async function createUserLibrary() {
  const dataStore = createMemoryStore();
  const user = await dataStore.users.create({
    username: 'fan',
    displayName: '饭饭',
    passwordHash: await hashPassword('secret-pass'),
    role: 'user'
  });
  const place = await dataStore.places.create({
    userId: user.id,
    name: '公司',
    address: '人民广场',
    latitude: 31.2304,
    longitude: 121.4737
  });
  return { dataStore, user, place };
}

describe('recommendations with user store libraries', () => {
  it('prefers active-place personal favorite stores and excludes blocked stores', async () => {
    const { dataStore, user, place } = await createUserLibrary();
    const favorite = await dataStore.stores.create({
      ownerUserId: user.id,
      name: '饭饭常去面馆',
      category: '面馆',
      address: '常去路 1 号',
      latitude: 31.2305,
      longitude: 121.4738,
      avgPrice: 28,
      rating: '4.1',
      source: 'manual'
    });
    const blocked = await dataStore.stores.create({
      ownerUserId: user.id,
      name: '不想再吃咖啡',
      category: '咖啡',
      address: '常去路 2 号',
      latitude: 31.23041,
      longitude: 121.47371,
      avgPrice: 20,
      rating: '5.0',
      source: 'manual'
    });
    await dataStore.storePlaceLinks.createOrUpdate({
      userId: user.id,
      storeId: favorite.id,
      placeId: place.id,
      status: 'favorite',
      tags: ['热乎', '面食']
    });
    await dataStore.storePlaceLinks.createOrUpdate({
      userId: user.id,
      storeId: blocked.id,
      placeId: place.id,
      status: 'blocked',
      tags: ['咖啡']
    });

    let amapCalled = false;
    const service = createRecommendationService({
      dataStore,
      amapClient: {
        searchRestaurants: async () => {
          amapCalled = true;
          return [candidateA];
        }
      },
      aiCompleteJson: async (messages) => {
        const system = messages[0]?.content || '';
        if (system.includes('偏好解析器')) {
          return {
            distanceMeters: 1500,
            budgetPerPerson: 35,
            cravings: ['热乎', '面食'],
            avoid: [],
            mustOpenNow: true
          };
        }
        return { reason: '你的常去店，离公司近。' };
      }
    });

    const result = await service.recommend({
      location: { latitude: 31.2304, longitude: 121.4737 },
      textPreference: '想吃热乎面',
      activePlaceId: place.id,
      userContext: { userId: user.id, activePlaceId: place.id },
      quickFilters: {
        distanceMeters: 1500,
        budgetPerPerson: 35,
        craving: '面食',
        openNow: true
      },
      localContext: {
        excludedPoiIds: [],
        favoritePoiIds: []
      }
    });

    expect(result.primaryRecommendation.name).toBe('饭饭常去面馆');
    expect(result.alternatives.some((item) => item.name === '不想再吃咖啡')).toBe(false);
    expect(amapCalled).toBe(true);
  });

  it('uses AMap candidates when the active place library is empty', async () => {
    const { dataStore, user, place } = await createUserLibrary();
    let amapCalled = false;
    const service = createRecommendationService({
      dataStore,
      amapClient: {
        searchRestaurants: async () => {
          amapCalled = true;
          return [candidateA];
        }
      },
      aiCompleteJson: async (messages) => {
        const system = messages[0]?.content || '';
        if (system.includes('偏好解析器')) {
          return {
            distanceMeters: 1500,
            budgetPerPerson: 35,
            cravings: ['米饭'],
            avoid: [],
            mustOpenNow: true
          };
        }
        return { reason: '附近正餐，先吃上。' };
      }
    });

    const result = await service.recommend({
      location: { latitude: 31.2304, longitude: 121.4737 },
      textPreference: '想吃米饭',
      activePlaceId: place.id,
      userContext: { userId: user.id, activePlaceId: place.id },
      quickFilters: {
        distanceMeters: 1500,
        budgetPerPerson: 35,
        craving: '米饭',
        openNow: true
      },
      localContext: {
        excludedPoiIds: [],
        favoritePoiIds: []
      }
    });

    expect(amapCalled).toBe(true);
    expect(result.primaryRecommendation.poiId).toBe(candidateA.poiId);
  });
});

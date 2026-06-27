import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { createMemoryStore } from '../src/data/memoryStore.js';
import type { DataStore } from '../src/data/types.js';
import { hashPassword } from '../src/services/password.js';
import { candidateA } from '../src/test/fixtures.js';

async function createUser(store: DataStore, username: string) {
  return store.users.create({
    username,
    displayName: username,
    passwordHash: await hashPassword('secret-pass'),
    role: 'user'
  });
}

async function login(app: ReturnType<typeof buildApp>, username: string) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { username, password: 'secret-pass' }
  });
  expect(response.statusCode).toBe(200);
  return response.json().token as string;
}

describe('amap routes', () => {
  it('reverse geocodes the current location for signed-in users', async () => {
    const store = createMemoryStore();
    await createUser(store, 'fan');
    const app = buildApp({
      store,
      recommendationService: {
        recommend: async () => ({
          requestId: 'rec_test',
          parsedPreference: { distanceMeters: 1500, cravings: ['米饭'], avoid: [], mustOpenNow: true },
          primaryRecommendation: candidateA,
          alternatives: []
        })
      },
      amapClient: {
        searchRestaurants: async () => [],
        searchPlaces: async () => [],
        reverseGeocode: async () => ({
          formattedAddress: '上海市黄浦区人民广场附近',
          province: '上海市',
          city: '上海市',
          district: '黄浦区'
        })
      }
    });
    const token = await login(app, 'fan');

    const response = await app.inject({
      method: 'GET',
      url: '/api/amap/regeo?latitude=31.2304&longitude=121.4737',
      headers: { authorization: `Bearer ${token}` }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      formattedAddress: '上海市黄浦区人民广场附近',
      province: '上海市',
      city: '上海市',
      district: '黄浦区'
    });
  });

  it('searches regular place suggestions near the current location', async () => {
    const store = createMemoryStore();
    await createUser(store, 'fan');
    const app = buildApp({
      store,
      recommendationService: {
        recommend: async () => ({
          requestId: 'rec_test',
          parsedPreference: { distanceMeters: 1500, cravings: ['米饭'], avoid: [], mustOpenNow: true },
          primaryRecommendation: candidateA,
          alternatives: []
        })
      },
      amapClient: {
        searchRestaurants: async () => [],
        searchPlaces: async (input) => {
          expect(input).toEqual({
            location: { latitude: 31.2304, longitude: 121.4737 },
            radiusMeters: 5000,
            keyword: '人民广场'
          });
          return [
            {
              poiId: 'B0PLACE',
              name: '人民广场',
              category: '地名地址信息;热点地名',
              distanceMeters: 360,
              address: '上海市黄浦区人民大道',
              tags: ['地名地址信息', '热点地名'],
              location: { latitude: 31.2301, longitude: 121.4736 }
            }
          ];
        },
        reverseGeocode: async () => ({
          formattedAddress: '上海市黄浦区人民广场附近'
        })
      }
    });
    const token = await login(app, 'fan');

    const response = await app.inject({
      method: 'GET',
      url: '/api/amap/place-suggestions?keyword=人民广场&latitude=31.2304&longitude=121.4737',
      headers: { authorization: `Bearer ${token}` }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      pois: [
        {
          amapPoiId: 'B0PLACE',
          name: '人民广场',
          category: '地名地址信息;热点地名',
          address: '上海市黄浦区人民大道',
          latitude: 31.2301,
          longitude: 121.4736,
          distanceMeters: 360,
          tags: ['地名地址信息', '热点地名']
        }
      ]
    });
  });
});

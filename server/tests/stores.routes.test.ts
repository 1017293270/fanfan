import { describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { createMemoryStore } from '../src/data/memoryStore.js';
import type { DataStore } from '../src/data/types.js';
import { hashPassword } from '../src/services/password.js';
import { candidateA } from '../src/test/fixtures.js';

function createTestApp(store: DataStore) {
  return buildApp({
    store,
    recommendationService: {
      recommend: async () => ({
        requestId: 'rec_test',
        parsedPreference: { distanceMeters: 1500, cravings: ['米饭'], avoid: [], mustOpenNow: true },
        primaryRecommendation: candidateA,
        alternatives: []
      })
    }
  });
}

async function createUser(store: DataStore, username: string) {
  const user = await store.users.create({
    username,
    displayName: username,
    passwordHash: await hashPassword('secret-pass'),
    role: 'user'
  });
  const place = await store.places.create({
    userId: user.id,
    name: '公司',
    address: '人民广场',
    latitude: 31.2304,
    longitude: 121.4737
  });
  return { user, place };
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

describe('stores routes', () => {
  it('creates manual stores linked to a place and keeps them private', async () => {
    const store = createMemoryStore();
    const { place } = await createUser(store, 'fan');
    await createUser(store, 'other');
    const app = createTestApp(store);
    const token = await login(app, 'fan');
    const otherToken = await login(app, 'other');

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/stores',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: '巷口小厨',
        category: '中餐',
        address: '幸福路 1 号',
        latitude: 31.2304,
        longitude: 121.4737,
        avgPrice: 35,
        placeIds: [place.id],
        tags: ['米饭'],
        status: 'favorite'
      }
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json().store.name).toBe('巷口小厨');
    expect(createResponse.json().links[0].status).toBe('favorite');

    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/stores',
      headers: { authorization: `Bearer ${token}` }
    });
    expect(listResponse.json().stores).toHaveLength(1);

    const otherListResponse = await app.inject({
      method: 'GET',
      url: '/api/stores',
      headers: { authorization: `Bearer ${otherToken}` }
    });
    expect(otherListResponse.json().stores).toHaveLength(0);
  });

  it('updates store-place link status and imports AMap stores without duplicates', async () => {
    const store = createMemoryStore();
    const { place } = await createUser(store, 'fan');
    const app = createTestApp(store);
    const token = await login(app, 'fan');

    const firstImport = await app.inject({
      method: 'POST',
      url: '/api/stores/import-amap',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        placeId: place.id,
        poi: {
          amapPoiId: 'B001',
          name: '巷口小厨',
          category: '中餐',
          address: '幸福路 1 号',
          latitude: 31.2304,
          longitude: 121.4737,
          avgPrice: 35,
          rating: '4.7'
        },
        tags: ['米饭']
      }
    });
    const secondImport = await app.inject({
      method: 'POST',
      url: '/api/stores/import-amap',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        placeId: place.id,
        poi: {
          amapPoiId: 'B001',
          name: '巷口小厨',
          category: '中餐',
          address: '幸福路 1 号',
          latitude: 31.2304,
          longitude: 121.4737,
          avgPrice: 35,
          rating: '4.7'
        },
        tags: ['米饭', '常吃']
      }
    });

    expect(firstImport.statusCode).toBe(201);
    expect(secondImport.statusCode).toBe(200);
    expect(firstImport.json().store.id).toBe(secondImport.json().store.id);
    expect(await store.stores.listByUser((await store.users.findByUsername('fan'))!.id)).toHaveLength(1);

    const linkId = secondImport.json().link.id;
    const linkResponse = await app.inject({
      method: 'PATCH',
      url: `/api/store-place-links/${linkId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { status: 'tired', eatenCount: 2 }
    });

    expect(linkResponse.statusCode).toBe(200);
    expect(linkResponse.json().link.status).toBe('tired');
    expect(linkResponse.json().link.eatenCount).toBe(2);
  });
});

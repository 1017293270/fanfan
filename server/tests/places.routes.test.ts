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

describe('places routes', () => {
  it('creates, lists, updates, and matches only the current user places', async () => {
    const store = createMemoryStore();
    await createUser(store, 'fan');
    const other = await createUser(store, 'other');
    await store.places.create({
      userId: other.id,
      name: '别人公司',
      address: '别处',
      latitude: 30,
      longitude: 120,
      radiusMeters: 500
    });
    const app = createTestApp(store);
    const token = await login(app, 'fan');

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/places',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: '公司',
        address: '人民广场',
        latitude: 31.2304,
        longitude: 121.4737,
        radiusMeters: 500
      }
    });

    expect(createResponse.statusCode).toBe(201);
    const placeId = createResponse.json().place.id;

    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/places',
      headers: { authorization: `Bearer ${token}` }
    });
    expect(listResponse.json().places).toHaveLength(1);
    expect(listResponse.json().places[0].name).toBe('公司');

    const updateResponse = await app.inject({
      method: 'PATCH',
      url: `/api/places/${placeId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { radiusMeters: 800 }
    });
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json().place.radiusMeters).toBe(800);

    const matchResponse = await app.inject({
      method: 'POST',
      url: '/api/places/match',
      headers: { authorization: `Bearer ${token}` },
      payload: { latitude: 31.23042, longitude: 121.47372 }
    });
    expect(matchResponse.statusCode).toBe(200);
    expect(matchResponse.json().matchedPlace.id).toBe(placeId);
  });

  it('deleting a place removes links but keeps the underlying user store', async () => {
    const store = createMemoryStore();
    const user = await createUser(store, 'fan');
    const place = await store.places.create({
      userId: user.id,
      name: '公司',
      address: '人民广场',
      latitude: 31.2304,
      longitude: 121.4737
    });
    const storeRecord = await store.stores.create({
      ownerUserId: user.id,
      name: '巷口小厨',
      category: '中餐',
      address: '幸福路 1 号',
      latitude: 31.2304,
      longitude: 121.4737,
      source: 'manual'
    });
    await store.storePlaceLinks.createOrUpdate({ userId: user.id, storeId: storeRecord.id, placeId: place.id });
    const app = createTestApp(store);
    const token = await login(app, 'fan');

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/places/${place.id}`,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(response.statusCode).toBe(204);
    expect(await store.storePlaceLinks.listByUser(user.id)).toHaveLength(0);
    expect(await store.stores.listByUser(user.id)).toHaveLength(1);
  });
});

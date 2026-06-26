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
        parsedPreference: {
          distanceMeters: 1500,
          cravings: ['米饭'],
          avoid: [],
          mustOpenNow: true
        },
        primaryRecommendation: candidateA,
        alternatives: []
      })
    }
  });
}

async function login(app: ReturnType<typeof buildApp>, username: string, password = 'secret-pass') {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { username, password }
  });
  expect(response.statusCode).toBe(200);
  return response.json().token as string;
}

async function seedUsers(store: DataStore) {
  await store.users.create({
    username: 'admin',
    displayName: '管理员',
    passwordHash: await hashPassword('secret-pass'),
    role: 'super_admin'
  });
  await store.users.create({
    username: 'fan',
    displayName: '饭饭',
    passwordHash: await hashPassword('secret-pass'),
    role: 'user'
  });
}

describe('admin routes', () => {
  it('forbids normal users from listing accounts', async () => {
    const store = createMemoryStore();
    await seedUsers(store);
    const app = createTestApp(store);
    const token = await login(app, 'fan');

    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/users',
      headers: { authorization: `Bearer ${token}` }
    });

    expect(response.statusCode).toBe(403);
  });

  it('lets super admins list users without password hashes', async () => {
    const store = createMemoryStore();
    await seedUsers(store);
    const app = createTestApp(store);
    const token = await login(app, 'admin');

    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/users',
      headers: { authorization: `Bearer ${token}` }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().users).toHaveLength(2);
    expect(response.json().users[0].passwordHash).toBeUndefined();
  });

  it('lets super admins create and disable invite codes', async () => {
    const store = createMemoryStore();
    await seedUsers(store);
    const app = createTestApp(store);
    const token = await login(app, 'admin');

    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/admin/invite-codes',
      headers: { authorization: `Bearer ${token}` },
      payload: { code: 'FAN-ADMIN' }
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json().inviteCode.code).toBe('FAN-ADMIN');

    const disableResponse = await app.inject({
      method: 'PATCH',
      url: `/api/admin/invite-codes/${createResponse.json().inviteCode.id}/status`,
      headers: { authorization: `Bearer ${token}` },
      payload: { status: 'disabled' }
    });

    expect(disableResponse.statusCode).toBe(200);
    expect(disableResponse.json().inviteCode.status).toBe('disabled');
  });

  it('does not allow disabled invite codes to be used', async () => {
    const store = createMemoryStore();
    await store.inviteCodes.create({ code: 'FAN-DISABLED', status: 'disabled' });
    const app = createTestApp(store);

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        inviteCode: 'FAN-DISABLED',
        username: 'fan',
        displayName: '饭饭',
        password: 'secret-pass'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().message).toBe('Invalid or used invite code');
  });
});

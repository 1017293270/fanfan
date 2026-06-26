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

describe('auth routes', () => {
  it('rejects registration without an unused invite code', async () => {
    const app = createTestApp(createMemoryStore());

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        inviteCode: 'NOPE',
        username: 'fan',
        displayName: '饭饭',
        password: 'secret-pass'
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().message).toBe('Invalid or used invite code');
  });

  it('registers with an invite code, consumes it, logs in, and returns me', async () => {
    const store = createMemoryStore();
    await store.inviteCodes.create({ code: 'FAN-001' });
    const app = createTestApp(store);

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        inviteCode: 'FAN-001',
        username: 'fan',
        displayName: '饭饭',
        password: 'secret-pass'
      }
    });

    expect(registerResponse.statusCode).toBe(201);
    expect(registerResponse.json().user).toMatchObject({
      username: 'fan',
      displayName: '饭饭',
      role: 'user',
      status: 'active'
    });
    expect(registerResponse.json().user.passwordHash).toBeUndefined();
    const invite = await store.inviteCodes.findByCode('FAN-001');
    expect(invite?.status).toBe('used');

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        username: 'fan',
        password: 'secret-pass'
      }
    });

    expect(loginResponse.statusCode).toBe(200);
    const token = loginResponse.json().token;
    expect(typeof token).toBe('string');

    const meResponse = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        authorization: `Bearer ${token}`
      }
    });

    expect(meResponse.statusCode).toBe(200);
    expect(meResponse.json().user.username).toBe('fan');
  });

  it('does not allow disabled accounts to log in', async () => {
    const store = createMemoryStore();
    const user = await store.users.create({
      username: 'fan',
      displayName: '饭饭',
      passwordHash: await hashPassword('secret-pass'),
      role: 'user'
    });
    await store.users.update(user.id, { status: 'disabled' });
    const app = createTestApp(store);

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        username: 'fan',
        password: 'secret-pass'
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().message).toBe('Account disabled');
  });

  it('rejects duplicate usernames during registration', async () => {
    const store = createMemoryStore();
    await store.users.create({
      username: 'fan',
      displayName: '饭饭',
      passwordHash: await hashPassword('secret-pass'),
      role: 'user'
    });
    await store.inviteCodes.create({ code: 'FAN-002' });
    const app = createTestApp(store);

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        inviteCode: 'FAN-002',
        username: 'fan',
        displayName: '饭饭 2',
        password: 'secret-pass'
      }
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().message).toBe('Username already exists');
  });
});

import { describe, expect, it } from 'vitest';
import { createMemoryStore } from '../src/data/memoryStore.js';

describe('DataStore', () => {
  it('keeps places scoped to the owning user', async () => {
    const store = createMemoryStore();
    const userA = await store.users.create({
      username: 'a',
      displayName: 'A',
      passwordHash: 'hash',
      role: 'user'
    });
    const userB = await store.users.create({
      username: 'b',
      displayName: 'B',
      passwordHash: 'hash',
      role: 'user'
    });

    await store.places.create({
      userId: userA.id,
      name: '公司',
      address: '人民广场',
      latitude: 31.2304,
      longitude: 121.4737,
      radiusMeters: 500
    });

    expect(await store.places.listByUser(userA.id)).toHaveLength(1);
    expect(await store.places.listByUser(userB.id)).toHaveLength(0);
  });

  it('deduplicates imported stores by owner and AMap poi id', async () => {
    const store = createMemoryStore();
    const user = await store.users.create({
      username: 'fan',
      displayName: '饭饭',
      passwordHash: 'hash',
      role: 'user'
    });

    const first = await store.stores.upsertByAmapPoi(user.id, {
      amapPoiId: 'B001',
      name: '巷口小厨',
      category: '中餐',
      address: '幸福路 1 号',
      latitude: 31.2304,
      longitude: 121.4737,
      avgPrice: 35,
      rating: '4.7',
      source: 'amap'
    });
    const second = await store.stores.upsertByAmapPoi(user.id, {
      amapPoiId: 'B001',
      name: '巷口小厨',
      category: '中餐',
      address: '幸福路 1 号',
      latitude: 31.2304,
      longitude: 121.4737,
      avgPrice: 35,
      rating: '4.7',
      source: 'amap'
    });

    expect(second.id).toBe(first.id);
    expect(await store.stores.listByUser(user.id)).toHaveLength(1);
  });
});

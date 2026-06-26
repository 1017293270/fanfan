import type {
  CommonPlace,
  CreatePlaceInput,
  CreateStoreInput,
  CreateStorePlaceLinkInput,
  CreateUserInput,
  DataStore,
  InviteCode,
  Session,
  Store,
  StoredData,
  StorePlaceLink,
  User
} from './types.js';

type MemoryStoreOptions = {
  initialData?: Partial<StoredData>;
  onChange?: (data: StoredData) => Promise<void> | void;
};

function nowIso(): string {
  return new Date().toISOString();
}

function clone<T>(value: T): T {
  if (value === undefined) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function emptyData(): StoredData {
  return {
    users: [],
    inviteCodes: [],
    sessions: [],
    places: [],
    stores: [],
    storePlaceLinks: []
  };
}

function maxSuffix(items: Array<{ id: string }>, prefix: string): number {
  return items.reduce((max, item) => {
    const value = Number.parseInt(item.id.replace(prefix, ''), 10);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
}

export function createMemoryStore(options: MemoryStoreOptions = {}): DataStore {
  const data: StoredData = {
    ...emptyData(),
    ...clone(options.initialData || {})
  };
  const counters = {
    user: maxSuffix(data.users, 'usr_'),
    invite: maxSuffix(data.inviteCodes, 'inv_'),
    session: maxSuffix(data.sessions, 'ses_'),
    place: maxSuffix(data.places, 'plc_'),
    store: maxSuffix(data.stores, 'sto_'),
    link: maxSuffix(data.storePlaceLinks, 'lnk_')
  };

  function nextId(kind: keyof typeof counters, prefix: string): string {
    counters[kind] += 1;
    return `${prefix}${String(counters[kind]).padStart(4, '0')}`;
  }

  async function persist(): Promise<void> {
    await options.onChange?.(clone(data));
  }

  return {
    users: {
      async create(input: CreateUserInput): Promise<User> {
        const timestamp = nowIso();
        const user: User = {
          id: nextId('user', 'usr_'),
          username: input.username,
          displayName: input.displayName,
          passwordHash: input.passwordHash,
          role: input.role,
          status: 'active',
          createdAt: timestamp
        };
        data.users.push(user);
        await persist();
        return clone(user);
      },
      async findById(id: string): Promise<User | undefined> {
        return clone(data.users.find((user) => user.id === id));
      },
      async findByUsername(username: string): Promise<User | undefined> {
        const normalized = username.trim().toLowerCase();
        return clone(data.users.find((user) => user.username.toLowerCase() === normalized));
      },
      async list(): Promise<User[]> {
        return clone(data.users);
      },
      async update(id, patch) {
        const user = data.users.find((item) => item.id === id);
        if (!user) return undefined;
        Object.assign(user, patch);
        await persist();
        return clone(user);
      }
    },
    inviteCodes: {
      async create(input): Promise<InviteCode> {
        const invite: InviteCode = {
          id: nextId('invite', 'inv_'),
          code: input.code,
          status: input.status || 'unused',
          createdByUserId: input.createdByUserId,
          createdAt: nowIso()
        };
        data.inviteCodes.push(invite);
        await persist();
        return clone(invite);
      },
      async findByCode(code: string): Promise<InviteCode | undefined> {
        const normalized = code.trim().toUpperCase();
        return clone(data.inviteCodes.find((invite) => invite.code.toUpperCase() === normalized));
      },
      async list(): Promise<InviteCode[]> {
        return clone(data.inviteCodes);
      },
      async update(id, patch) {
        const invite = data.inviteCodes.find((item) => item.id === id);
        if (!invite) return undefined;
        Object.assign(invite, patch);
        await persist();
        return clone(invite);
      }
    },
    sessions: {
      async create(input): Promise<Session> {
        const session: Session = {
          id: nextId('session', 'ses_'),
          userId: input.userId,
          tokenHash: input.tokenHash,
          createdAt: nowIso(),
          expiresAt: input.expiresAt
        };
        data.sessions.push(session);
        await persist();
        return clone(session);
      },
      async findByTokenHash(tokenHash: string): Promise<Session | undefined> {
        return clone(data.sessions.find((session) => session.tokenHash === tokenHash));
      },
      async deleteByTokenHash(tokenHash: string): Promise<boolean> {
        const before = data.sessions.length;
        data.sessions = data.sessions.filter((session) => session.tokenHash !== tokenHash);
        const changed = data.sessions.length !== before;
        if (changed) await persist();
        return changed;
      },
      async deleteExpired(now: string): Promise<number> {
        const before = data.sessions.length;
        data.sessions = data.sessions.filter((session) => session.expiresAt > now);
        const deleted = before - data.sessions.length;
        if (deleted) await persist();
        return deleted;
      }
    },
    places: {
      async create(input: CreatePlaceInput): Promise<CommonPlace> {
        const timestamp = nowIso();
        const place: CommonPlace = {
          id: nextId('place', 'plc_'),
          userId: input.userId,
          name: input.name,
          address: input.address,
          latitude: input.latitude,
          longitude: input.longitude,
          radiusMeters: input.radiusMeters ?? 500,
          sortOrder: input.sortOrder ?? data.places.filter((item) => item.userId === input.userId).length,
          createdAt: timestamp,
          updatedAt: timestamp
        };
        data.places.push(place);
        await persist();
        return clone(place);
      },
      async listByUser(userId: string): Promise<CommonPlace[]> {
        return clone(data.places.filter((place) => place.userId === userId).sort((a, b) => a.sortOrder - b.sortOrder));
      },
      async findByIdForUser(userId: string, id: string): Promise<CommonPlace | undefined> {
        return clone(data.places.find((place) => place.userId === userId && place.id === id));
      },
      async update(userId, id, patch) {
        const place = data.places.find((item) => item.userId === userId && item.id === id);
        if (!place) return undefined;
        Object.assign(place, patch, { updatedAt: nowIso() });
        await persist();
        return clone(place);
      },
      async delete(userId: string, id: string): Promise<boolean> {
        const before = data.places.length;
        data.places = data.places.filter((place) => place.userId !== userId || place.id !== id);
        const changed = before !== data.places.length;
        if (changed) {
          data.storePlaceLinks = data.storePlaceLinks.filter((link) => link.userId !== userId || link.placeId !== id);
          await persist();
        }
        return changed;
      }
    },
    stores: {
      async create(input: CreateStoreInput & { ownerUserId: string }): Promise<Store> {
        const timestamp = nowIso();
        const store: Store = {
          id: nextId('store', 'sto_'),
          ownerUserId: input.ownerUserId,
          amapPoiId: input.amapPoiId,
          name: input.name,
          category: input.category,
          address: input.address,
          latitude: input.latitude,
          longitude: input.longitude,
          avgPrice: input.avgPrice,
          rating: input.rating,
          phone: input.phone,
          source: input.source,
          createdAt: timestamp,
          updatedAt: timestamp
        };
        data.stores.push(store);
        await persist();
        return clone(store);
      },
      async upsertByAmapPoi(ownerUserId, input): Promise<Store> {
        const existing = data.stores.find(
          (store) => store.ownerUserId === ownerUserId && store.amapPoiId === input.amapPoiId
        );
        if (existing) {
          Object.assign(existing, input, { ownerUserId, source: 'amap', updatedAt: nowIso() });
          await persist();
          return clone(existing);
        }
        return this.create({ ...input, ownerUserId, source: 'amap' });
      },
      async listByUser(ownerUserId: string): Promise<Store[]> {
        return clone(data.stores.filter((store) => store.ownerUserId === ownerUserId));
      },
      async findByIdForUser(ownerUserId: string, id: string): Promise<Store | undefined> {
        return clone(data.stores.find((store) => store.ownerUserId === ownerUserId && store.id === id));
      },
      async update(ownerUserId, id, patch) {
        const store = data.stores.find((item) => item.ownerUserId === ownerUserId && item.id === id);
        if (!store) return undefined;
        Object.assign(store, patch, { updatedAt: nowIso() });
        await persist();
        return clone(store);
      },
      async delete(ownerUserId: string, id: string): Promise<boolean> {
        const before = data.stores.length;
        data.stores = data.stores.filter((store) => store.ownerUserId !== ownerUserId || store.id !== id);
        const changed = before !== data.stores.length;
        if (changed) {
          data.storePlaceLinks = data.storePlaceLinks.filter((link) => link.userId !== ownerUserId || link.storeId !== id);
          await persist();
        }
        return changed;
      }
    },
    storePlaceLinks: {
      async createOrUpdate(input: CreateStorePlaceLinkInput): Promise<StorePlaceLink> {
        const existing = data.storePlaceLinks.find(
          (link) => link.userId === input.userId && link.storeId === input.storeId && link.placeId === input.placeId
        );
        const timestamp = nowIso();
        if (existing) {
          Object.assign(existing, {
            status: input.status ?? existing.status,
            tags: input.tags ?? existing.tags,
            note: input.note ?? existing.note,
            updatedAt: timestamp
          });
          await persist();
          return clone(existing);
        }
        const link: StorePlaceLink = {
          id: nextId('link', 'lnk_'),
          userId: input.userId,
          storeId: input.storeId,
          placeId: input.placeId,
          status: input.status ?? 'active',
          tags: input.tags ?? [],
          note: input.note,
          eatenCount: 0,
          createdAt: timestamp,
          updatedAt: timestamp
        };
        data.storePlaceLinks.push(link);
        await persist();
        return clone(link);
      },
      async listByUser(userId: string): Promise<StorePlaceLink[]> {
        return clone(data.storePlaceLinks.filter((link) => link.userId === userId));
      },
      async listByPlace(userId: string, placeId: string): Promise<StorePlaceLink[]> {
        return clone(data.storePlaceLinks.filter((link) => link.userId === userId && link.placeId === placeId));
      },
      async listByStore(userId: string, storeId: string): Promise<StorePlaceLink[]> {
        return clone(data.storePlaceLinks.filter((link) => link.userId === userId && link.storeId === storeId));
      },
      async update(userId, id, patch) {
        const link = data.storePlaceLinks.find((item) => item.userId === userId && item.id === id);
        if (!link) return undefined;
        Object.assign(link, patch, { updatedAt: nowIso() });
        await persist();
        return clone(link);
      },
      async deleteById(userId: string, id: string): Promise<boolean> {
        const before = data.storePlaceLinks.length;
        data.storePlaceLinks = data.storePlaceLinks.filter((link) => link.userId !== userId || link.id !== id);
        const changed = before !== data.storePlaceLinks.length;
        if (changed) await persist();
        return changed;
      },
      async deleteByPlace(userId: string, placeId: string): Promise<number> {
        const before = data.storePlaceLinks.length;
        data.storePlaceLinks = data.storePlaceLinks.filter((link) => link.userId !== userId || link.placeId !== placeId);
        const deleted = before - data.storePlaceLinks.length;
        if (deleted) await persist();
        return deleted;
      },
      async deleteByStore(userId: string, storeId: string): Promise<number> {
        const before = data.storePlaceLinks.length;
        data.storePlaceLinks = data.storePlaceLinks.filter((link) => link.userId !== userId || link.storeId !== storeId);
        const deleted = before - data.storePlaceLinks.length;
        if (deleted) await persist();
        return deleted;
      }
    },
    snapshot(): StoredData {
      return clone(data);
    }
  };
}

export type UserRole = 'user' | 'super_admin';
export type AccountStatus = 'active' | 'disabled';
export type InviteCodeStatus = 'unused' | 'used' | 'disabled';
export type StoreSource = 'manual' | 'amap';
export type StorePlaceStatus = 'active' | 'favorite' | 'blocked' | 'tired';

export type User = {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: string;
  lastLoginAt?: string;
};

export type InviteCode = {
  id: string;
  code: string;
  status: InviteCodeStatus;
  createdByUserId?: string;
  createdAt: string;
  usedByUserId?: string;
  usedAt?: string;
};

export type Session = {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
};

export type CommonPlace = {
  id: string;
  userId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type Store = {
  id: string;
  ownerUserId: string;
  amapPoiId?: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  avgPrice?: number;
  rating?: string;
  phone?: string;
  source: StoreSource;
  createdAt: string;
  updatedAt: string;
};

export type StorePlaceLink = {
  id: string;
  userId: string;
  storeId: string;
  placeId: string;
  status: StorePlaceStatus;
  tags: string[];
  note?: string;
  lastEatenAt?: string;
  eatenCount: number;
  createdAt: string;
  updatedAt: string;
};

export type StoredData = {
  users: User[];
  inviteCodes: InviteCode[];
  sessions: Session[];
  places: CommonPlace[];
  stores: Store[];
  storePlaceLinks: StorePlaceLink[];
};

export type CreateUserInput = {
  username: string;
  displayName: string;
  passwordHash: string;
  role: UserRole;
};

export type CreatePlaceInput = {
  userId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  sortOrder?: number;
};

export type CreateStoreInput = {
  ownerUserId?: string;
  amapPoiId?: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  avgPrice?: number;
  rating?: string;
  phone?: string;
  source: StoreSource;
};

export type CreateStorePlaceLinkInput = {
  userId: string;
  storeId: string;
  placeId: string;
  status?: StorePlaceStatus;
  tags?: string[];
  note?: string;
};

export type DataStore = {
  users: {
    create(input: CreateUserInput): Promise<User>;
    findById(id: string): Promise<User | undefined>;
    findByUsername(username: string): Promise<User | undefined>;
    list(): Promise<User[]>;
    update(id: string, patch: Partial<Pick<User, 'displayName' | 'passwordHash' | 'role' | 'status' | 'lastLoginAt'>>): Promise<User | undefined>;
  };
  inviteCodes: {
    create(input: { code: string; createdByUserId?: string; status?: InviteCodeStatus }): Promise<InviteCode>;
    findByCode(code: string): Promise<InviteCode | undefined>;
    list(): Promise<InviteCode[]>;
    update(id: string, patch: Partial<Pick<InviteCode, 'status' | 'usedByUserId' | 'usedAt'>>): Promise<InviteCode | undefined>;
  };
  sessions: {
    create(input: { userId: string; tokenHash: string; expiresAt: string }): Promise<Session>;
    findByTokenHash(tokenHash: string): Promise<Session | undefined>;
    deleteByTokenHash(tokenHash: string): Promise<boolean>;
    deleteExpired(nowIso: string): Promise<number>;
  };
  places: {
    create(input: CreatePlaceInput): Promise<CommonPlace>;
    listByUser(userId: string): Promise<CommonPlace[]>;
    findByIdForUser(userId: string, id: string): Promise<CommonPlace | undefined>;
    update(userId: string, id: string, patch: Partial<Omit<CreatePlaceInput, 'userId'>>): Promise<CommonPlace | undefined>;
    delete(userId: string, id: string): Promise<boolean>;
  };
  stores: {
    create(input: CreateStoreInput & { ownerUserId: string }): Promise<Store>;
    upsertByAmapPoi(ownerUserId: string, input: Omit<CreateStoreInput, 'ownerUserId'> & { amapPoiId: string }): Promise<Store>;
    listByUser(ownerUserId: string): Promise<Store[]>;
    findByIdForUser(ownerUserId: string, id: string): Promise<Store | undefined>;
    update(ownerUserId: string, id: string, patch: Partial<Omit<CreateStoreInput, 'ownerUserId' | 'source'>>): Promise<Store | undefined>;
    delete(ownerUserId: string, id: string): Promise<boolean>;
  };
  storePlaceLinks: {
    createOrUpdate(input: CreateStorePlaceLinkInput): Promise<StorePlaceLink>;
    listByUser(userId: string): Promise<StorePlaceLink[]>;
    listByPlace(userId: string, placeId: string): Promise<StorePlaceLink[]>;
    listByStore(userId: string, storeId: string): Promise<StorePlaceLink[]>;
    update(userId: string, id: string, patch: Partial<Pick<StorePlaceLink, 'status' | 'tags' | 'note' | 'lastEatenAt' | 'eatenCount'>>): Promise<StorePlaceLink | undefined>;
    deleteById(userId: string, id: string): Promise<boolean>;
    deleteByPlace(userId: string, placeId: string): Promise<number>;
    deleteByStore(userId: string, storeId: string): Promise<number>;
  };
  snapshot(): StoredData;
};

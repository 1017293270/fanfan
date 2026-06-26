export type UserRole = 'user' | 'super_admin';
export type AccountStatus = 'active' | 'disabled';
export type InviteCodeStatus = 'unused' | 'used' | 'disabled';
export type StorePlaceStatus = 'active' | 'favorite' | 'blocked' | 'tired';

export type PublicUser = {
  id: string;
  username: string;
  displayName: string;
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

export type Place = {
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
  source: 'manual' | 'amap';
  createdAt: string;
  updatedAt: string;
  links: StorePlaceLink[];
};

export type AmapPoi = {
  amapPoiId: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  avgPrice?: number;
  rating?: string;
  distanceMeters?: number;
  tags?: string[];
};

export type RestaurantCandidate = {
  poiId: string;
  name: string;
  category: string;
  distanceMeters: number;
  rating?: string;
  avgPrice?: number;
  address: string;
  tags: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
  openNow?: boolean;
  reason?: string;
};

export type RecommendationResponse = {
  requestId: string;
  primaryRecommendation: RestaurantCandidate;
  alternatives: RestaurantCandidate[];
};

export type LocationPoint = {
  latitude: number;
  longitude: number;
};

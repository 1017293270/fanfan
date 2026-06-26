import type {
  AmapPoi,
  AccountStatus,
  InviteCode,
  InviteCodeStatus,
  LocationPoint,
  Place,
  PublicUser,
  RecommendationResponse,
  Store,
  StorePlaceLink,
  StorePlaceStatus
} from './types';

const tokenKey = 'kaifanli_h5_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(tokenKey);
}

export function setStoredToken(token: string | null) {
  if (token) localStorage.setItem(tokenKey, token);
  else localStorage.removeItem(tokenKey);
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json'
  };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  const token = options.token ?? getStoredToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(path, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `请求失败：${response.status}`);
  }
  return data as T;
}

export const api = {
  async login(input: { username: string; password: string }) {
    return requestJson<{ user: PublicUser; token: string }>('/api/auth/login', {
      method: 'POST',
      body: input
    });
  },
  async register(input: { inviteCode: string; username: string; displayName: string; password: string }) {
    return requestJson<{ user: PublicUser; token: string }>('/api/auth/register', {
      method: 'POST',
      body: input
    });
  },
  async me() {
    return requestJson<{ user: PublicUser }>('/api/auth/me');
  },
  async logout() {
    return requestJson<{ ok: true }>('/api/auth/logout', { method: 'POST' });
  },
  async listUsers() {
    return requestJson<{ users: PublicUser[] }>('/api/admin/users');
  },
  async updateUserStatus(id: string, status: AccountStatus) {
    return requestJson<{ user: PublicUser }>(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      body: { status }
    });
  },
  async listInviteCodes() {
    return requestJson<{ inviteCodes: InviteCode[] }>('/api/admin/invite-codes');
  },
  async createInviteCode(code?: string) {
    return requestJson<{ inviteCode: InviteCode }>('/api/admin/invite-codes', {
      method: 'POST',
      body: { code }
    });
  },
  async updateInviteCodeStatus(id: string, status: InviteCodeStatus) {
    return requestJson<{ inviteCode: InviteCode }>(`/api/admin/invite-codes/${id}/status`, {
      method: 'PATCH',
      body: { status }
    });
  },
  async listPlaces() {
    return requestJson<{ places: Place[] }>('/api/places');
  },
  async createPlace(input: Omit<Place, 'id' | 'userId' | 'sortOrder' | 'createdAt' | 'updatedAt'>) {
    return requestJson<{ place: Place }>('/api/places', {
      method: 'POST',
      body: input
    });
  },
  async updatePlace(id: string, input: Partial<Pick<Place, 'name' | 'address' | 'latitude' | 'longitude' | 'radiusMeters'>>) {
    return requestJson<{ place: Place }>(`/api/places/${id}`, {
      method: 'PATCH',
      body: input
    });
  },
  async deletePlace(id: string) {
    return requestJson<void>(`/api/places/${id}`, { method: 'DELETE' });
  },
  async matchPlace(location: LocationPoint) {
    return requestJson<{ matchedPlace: Place | null; distanceMeters: number | null; unmatchedLocation: boolean }>(
      '/api/places/match',
      {
        method: 'POST',
        body: location
      }
    );
  },
  async listStores() {
    return requestJson<{ stores: Store[] }>('/api/stores');
  },
  async createStore(input: {
    name: string;
    category: string;
    address: string;
    latitude: number;
    longitude: number;
    avgPrice?: number;
    placeIds: string[];
    tags: string[];
    status: StorePlaceStatus;
    note?: string;
  }) {
    return requestJson<{ store: Store; links: StorePlaceLink[] }>('/api/stores', {
      method: 'POST',
      body: input
    });
  },
  async updateStore(id: string, input: Partial<Pick<Store, 'name' | 'category' | 'address' | 'latitude' | 'longitude' | 'avgPrice'>>) {
    return requestJson<{ store: Store }>(`/api/stores/${id}`, {
      method: 'PATCH',
      body: input
    });
  },
  async deleteStore(id: string) {
    return requestJson<void>(`/api/stores/${id}`, { method: 'DELETE' });
  },
  async updateLink(id: string, input: Partial<Pick<StorePlaceLink, 'status' | 'tags' | 'note' | 'lastEatenAt' | 'eatenCount'>>) {
    return requestJson<{ link: StorePlaceLink }>(`/api/store-place-links/${id}`, {
      method: 'PATCH',
      body: input
    });
  },
  async searchAmap(input: { keyword: string; location: LocationPoint; radiusMeters: number }) {
    const params = new URLSearchParams({
      keyword: input.keyword,
      latitude: String(input.location.latitude),
      longitude: String(input.location.longitude),
      radiusMeters: String(input.radiusMeters)
    });
    return requestJson<{ pois: AmapPoi[] }>(`/api/amap/search?${params.toString()}`);
  },
  async importAmap(input: { placeId: string; poi: AmapPoi; tags: string[]; status: StorePlaceStatus }) {
    return requestJson<{ store: Store; link: StorePlaceLink }>('/api/stores/import-amap', {
      method: 'POST',
      body: input
    });
  },
  async recommend(input: {
    location: LocationPoint;
    activePlaceId?: string;
    textPreference: string;
    quickFilters: {
      distanceMeters: number;
      budgetPerPerson?: number;
      spicyPreference?: 'none' | 'mild' | 'medium' | 'spicy';
      craving?: string;
      openNow: boolean;
    };
  }) {
    return requestJson<RecommendationResponse>('/api/recommendations', {
      method: 'POST',
      body: {
        ...input,
        localContext: {
          excludedPoiIds: [],
          favoritePoiIds: [],
          penalizedPoiIds: []
        }
      }
    });
  }
};

import type {
  AmapPoi,
  AccountStatus,
  InviteCode,
  InviteCodeStatus,
  LocationPoint,
  Place,
  PublicUser,
  RecommendationResponse,
  ReverseGeocodeResponse,
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

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return value;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return value;
  }
}

function contextMessage(path: string, status: number): string {
  if (path.startsWith('/api/auth/login')) {
    if (status === 401) return '账号或密码不对。';
    return '登录失败，检查账号密码后再试。';
  }
  if (path.startsWith('/api/auth/register')) {
    if (status === 409) return '这个账号名已经被注册。';
    return '注册失败，检查邀请码和账号信息后再试。';
  }
  if (path.startsWith('/api/amap/')) {
    if (path.startsWith('/api/amap/regeo')) {
      if (status === 400) return '定位坐标有点异常，重新定位后再试。';
      if (status === 503) return '高德服务还没配置好，检查一下高德 Key。';
      return '地址解析暂时不可用，稍后再试。';
    }
    if (status === 400) return '高德搜索请求异常，换个关键词或稍后再试。';
    if (status === 503) return '高德服务还没配置好，检查一下高德 Key。';
    return '高德搜索暂时不可用，稍后再试。';
  }
  if (path.startsWith('/api/recommendations')) {
    if (status === 404) return '这次没找到合适的餐厅，放宽距离或换个口味试试。';
    return '推荐服务暂时开小差了，稍后再拍板。';
  }
  if (status === 401) return '登录状态过期了，请重新登录。';
  if (status === 403) return '当前账号没有权限执行这个操作。';
  if (status === 404) return '没找到对应内容，刷新后再试。';
  if (status >= 500) return '服务暂时不可用，稍后再试。';
  if (status === 400) return '提交内容有点不对，检查后再试。';
  return `请求失败：${status}`;
}

const knownServerMessages: Record<string, string> = {
  'Authentication required': '登录状态过期了，请重新登录。',
  'Admin access required': '当前账号没有管理员权限。',
  'Invalid username or password': '账号或密码不对。',
  'Account disabled': '账号已被停用，请联系管理员。',
  'Invalid or used invite code': '邀请码无效或已被使用。',
  'Username already exists': '这个账号名已经被注册。',
  'No matching restaurants found': '这次没找到合适的餐厅，放宽距离或换个口味试试。',
  'Place not found': '没有找到这个常用地点。',
  'Store not found': '没有找到这个店铺。',
  'Invite code not found': '没有找到这个邀请码。',
  'AMap client unavailable': '高德服务还没配置好，检查一下高德 Key。'
};

function normalizeServerMessage(message: string, status: number, path: string): string | undefined {
  if (knownServerMessages[message]) return knownServerMessages[message];
  if (message.includes('Bad Request')) return undefined;
  if (/^(AMap|AI|Recommendation|Invalid)\b/i.test(message)) return undefined;
  if (/failed|error|unavailable|required/i.test(message) && !/[^\x00-\x7F]/.test(message)) return undefined;
  return message || contextMessage(path, status);
}

function extractApiErrorMessage(data: unknown, status: number, path: string): string {
  const parsed = parseMaybeJson(data);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const record = parsed as Record<string, unknown>;
    const message = parseMaybeJson(record.message);
    const detail = parseMaybeJson(record.detail);
    if (typeof message === 'string' && message) {
      const normalized = normalizeServerMessage(message, status, path);
      if (normalized) return normalized;
    }
    if (detail && detail !== parsed) return extractApiErrorMessage(detail, status, path);
  }
  if (typeof parsed === 'string' && parsed) {
    const normalized = normalizeServerMessage(parsed, status, path);
    if (normalized) return normalized;
  }
  return contextMessage(path, status);
}

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
    throw new Error(extractApiErrorMessage(data, response.status, path));
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
  async searchPlaceSuggestions(input: { keyword: string; location: LocationPoint; radiusMeters?: number }) {
    const params = new URLSearchParams({
      keyword: input.keyword,
      latitude: String(input.location.latitude),
      longitude: String(input.location.longitude),
      radiusMeters: String(input.radiusMeters || 5000)
    });
    return requestJson<{ pois: AmapPoi[] }>(`/api/amap/place-suggestions?${params.toString()}`);
  },
  async reverseGeocode(location: LocationPoint) {
    const params = new URLSearchParams({
      latitude: String(location.latitude),
      longitude: String(location.longitude)
    });
    return requestJson<ReverseGeocodeResponse>(`/api/amap/regeo?${params.toString()}`);
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

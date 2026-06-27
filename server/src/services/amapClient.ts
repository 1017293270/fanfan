import type { RuntimeConfig } from '../config.js';
import type { RestaurantCandidate } from '../schemas/recommendation.js';

type Location = {
  latitude: number;
  longitude: number;
};

export type ReverseGeocodeResult = {
  formattedAddress: string;
  province?: string;
  city?: string;
  district?: string;
};

export type AmapPlaceCandidate = {
  poiId: string;
  name: string;
  category: string;
  distanceMeters: number;
  address: string;
  tags: string[];
  location?: Location;
};

type AmapPoi = {
  id?: string;
  name?: string;
  type?: string;
  distance?: string;
  biz_ext?: {
    rating?: string;
    cost?: string;
  };
  address?: string | string[];
  location?: string;
};

type AmapRegeoBody = {
  status?: string;
  info?: string;
  regeocode?: {
    formatted_address?: string;
    addressComponent?: {
      province?: string;
      city?: string | string[];
      district?: string;
    };
  };
};

function parseLocation(location?: string): RestaurantCandidate['location'] {
  if (!location) return undefined;
  const [longitudeText, latitudeText] = location.split(',');
  const longitude = Number(longitudeText);
  const latitude = Number(latitudeText);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  return { latitude, longitude };
}

function parsePrice(cost?: string): number | undefined {
  if (!cost) return undefined;
  const value = Number.parseInt(cost, 10);
  return Number.isFinite(value) ? value : undefined;
}

function mapPoi(poi: AmapPoi): RestaurantCandidate | undefined {
  if (!poi.id || !poi.name) return undefined;
  return {
    poiId: poi.id,
    name: poi.name,
    category: poi.type || '餐饮',
    distanceMeters: Number.parseInt(poi.distance || '999999', 10),
    rating: poi.biz_ext?.rating,
    avgPrice: parsePrice(poi.biz_ext?.cost),
    address: Array.isArray(poi.address) ? poi.address.join('') : poi.address || '',
    tags: (poi.type || '餐饮').split(';').filter(Boolean),
    location: parseLocation(poi.location),
    openNow: undefined
  };
}

function mapPlacePoi(poi: AmapPoi): AmapPlaceCandidate | undefined {
  if (!poi.id || !poi.name) return undefined;
  const category = poi.type || '地点';
  return {
    poiId: poi.id,
    name: poi.name,
    category,
    distanceMeters: Number.parseInt(poi.distance || '999999', 10),
    address: Array.isArray(poi.address) ? poi.address.join('') : poi.address || '',
    tags: category.split(';').filter(Boolean),
    location: parseLocation(poi.location)
  };
}

export type AmapClient = {
  searchRestaurants(input: {
    location: Location;
    radiusMeters: number;
    keywords: string[];
  }): Promise<RestaurantCandidate[]>;
  searchPlaces?(input: {
    location: Location;
    radiusMeters: number;
    keyword: string;
  }): Promise<AmapPlaceCandidate[]>;
  reverseGeocode(input: { location: Location }): Promise<ReverseGeocodeResult>;
};

export function createAmapClient(config: RuntimeConfig): AmapClient {
  return {
    async searchRestaurants(input) {
      const keywords = input.keywords.length ? input.keywords.join('|') : '餐饮';
      const url = new URL('https://restapi.amap.com/v3/place/around');
      url.searchParams.set('key', config.amapApiKey);
      url.searchParams.set('location', `${input.location.longitude},${input.location.latitude}`);
      url.searchParams.set('radius', String(input.radiusMeters));
      url.searchParams.set('keywords', keywords);
      url.searchParams.set('types', '050000');
      url.searchParams.set('extensions', 'all');
      url.searchParams.set('offset', '25');
      url.searchParams.set('page', '1');

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`AMap request failed with status ${response.status}`);
      }

      const body = (await response.json()) as { status?: string; info?: string; pois?: AmapPoi[] };
      if (body.status !== '1') {
        throw new Error(`AMap request failed: ${body.info || 'unknown error'}`);
      }

      return (body.pois || []).map(mapPoi).filter((item): item is RestaurantCandidate => Boolean(item));
    },

    async searchPlaces(input) {
      const url = new URL('https://restapi.amap.com/v3/place/around');
      url.searchParams.set('key', config.amapApiKey);
      url.searchParams.set('location', `${input.location.longitude},${input.location.latitude}`);
      url.searchParams.set('radius', String(input.radiusMeters));
      url.searchParams.set('keywords', input.keyword);
      url.searchParams.set('extensions', 'base');
      url.searchParams.set('offset', '10');
      url.searchParams.set('page', '1');

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`AMap place suggestion request failed with status ${response.status}`);
      }

      const body = (await response.json()) as { status?: string; info?: string; pois?: AmapPoi[] };
      if (body.status !== '1') {
        throw new Error(`AMap place suggestion request failed: ${body.info || 'unknown error'}`);
      }

      return (body.pois || []).map(mapPlacePoi).filter((item): item is AmapPlaceCandidate => Boolean(item));
    },

    async reverseGeocode(input) {
      const url = new URL('https://restapi.amap.com/v3/geocode/regeo');
      url.searchParams.set('key', config.amapApiKey);
      url.searchParams.set('location', `${input.location.longitude},${input.location.latitude}`);
      url.searchParams.set('radius', '1000');
      url.searchParams.set('extensions', 'base');

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`AMap reverse geocode request failed with status ${response.status}`);
      }

      const body = (await response.json()) as AmapRegeoBody;
      if (body.status !== '1') {
        throw new Error(`AMap reverse geocode request failed: ${body.info || 'unknown error'}`);
      }

      const component = body.regeocode?.addressComponent;
      const city = Array.isArray(component?.city) ? component?.city[0] : component?.city;
      return {
        formattedAddress: body.regeocode?.formatted_address || '',
        province: component?.province,
        city,
        district: component?.district
      };
    }
  };
}

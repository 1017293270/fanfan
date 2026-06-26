import type { DataStore, Store, StorePlaceLink } from '../data/types.js';
import type { Location, RestaurantCandidate } from '../schemas/recommendation.js';
import { distanceMeters } from './places.js';

export type UserRecommendationContext = {
  candidates: RestaurantCandidate[];
  localContext: {
    excludedPoiIds: string[];
    favoritePoiIds: string[];
    penalizedPoiIds: string[];
  };
};

function candidatePoiId(store: Store): string {
  return store.amapPoiId || store.id;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function isRecentlyEaten(link: StorePlaceLink): boolean {
  if (!link.lastEatenAt) return false;
  const eatenAt = new Date(link.lastEatenAt).getTime();
  if (!Number.isFinite(eatenAt)) return false;
  return Date.now() - eatenAt < 3 * 24 * 60 * 60 * 1000;
}

function toCandidate(store: Store, link: StorePlaceLink, location: Location): RestaurantCandidate {
  return {
    poiId: candidatePoiId(store),
    name: store.name,
    category: store.category,
    distanceMeters: distanceMeters(location, {
      latitude: store.latitude,
      longitude: store.longitude
    }),
    rating: store.rating,
    avgPrice: store.avgPrice,
    address: store.address,
    tags: unique([...link.tags, store.category]),
    location: {
      latitude: store.latitude,
      longitude: store.longitude
    },
    openNow: undefined
  };
}

export async function buildUserRecommendationContext(input: {
  dataStore: DataStore;
  userId: string;
  activePlaceId: string;
  location: Location;
}): Promise<UserRecommendationContext> {
  const [links, stores] = await Promise.all([
    input.dataStore.storePlaceLinks.listByPlace(input.userId, input.activePlaceId),
    input.dataStore.stores.listByUser(input.userId)
  ]);
  const storesById = new Map(stores.map((store) => [store.id, store]));
  const excludedPoiIds: string[] = [];
  const favoritePoiIds: string[] = [];
  const penalizedPoiIds: string[] = [];
  const candidates: RestaurantCandidate[] = [];

  for (const link of links) {
    const store = storesById.get(link.storeId);
    if (!store) continue;
    const poiId = candidatePoiId(store);
    if (link.status === 'blocked') {
      excludedPoiIds.push(poiId);
      continue;
    }
    if (link.status === 'favorite') favoritePoiIds.push(poiId);
    if (link.status === 'tired' || isRecentlyEaten(link)) penalizedPoiIds.push(poiId);
    candidates.push(toCandidate(store, link, input.location));
  }

  return {
    candidates,
    localContext: {
      excludedPoiIds: unique(excludedPoiIds),
      favoritePoiIds: unique(favoritePoiIds),
      penalizedPoiIds: unique(penalizedPoiIds)
    }
  };
}

import type { DataStore, StorePlaceStatus } from '../data/types.js';

export type ManualStoreInput = {
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  avgPrice?: number;
  rating?: string;
  phone?: string;
  placeIds: string[];
  tags: string[];
  status: StorePlaceStatus;
  note?: string;
};

export type AmapImportInput = {
  placeId: string;
  poi: {
    amapPoiId: string;
    name: string;
    category: string;
    address: string;
    latitude: number;
    longitude: number;
    avgPrice?: number;
    rating?: string;
    phone?: string;
  };
  tags: string[];
  status: StorePlaceStatus;
};

export async function createManualStoreForPlaces(store: DataStore, userId: string, input: ManualStoreInput) {
  const places = await Promise.all(input.placeIds.map((placeId) => store.places.findByIdForUser(userId, placeId)));
  if (places.some((place) => !place)) {
    throw new Error('PLACE_NOT_FOUND');
  }

  const created = await store.stores.create({
    ownerUserId: userId,
    name: input.name,
    category: input.category,
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    avgPrice: input.avgPrice,
    rating: input.rating,
    phone: input.phone,
    source: 'manual'
  });

  const links = await Promise.all(
    input.placeIds.map((placeId) =>
      store.storePlaceLinks.createOrUpdate({
        userId,
        storeId: created.id,
        placeId,
        status: input.status,
        tags: input.tags,
        note: input.note
      })
    )
  );

  return { store: created, links };
}

export async function importAmapStoreToPlace(store: DataStore, userId: string, input: AmapImportInput) {
  const place = await store.places.findByIdForUser(userId, input.placeId);
  if (!place) throw new Error('PLACE_NOT_FOUND');

  const before = await store.stores.listByUser(userId);
  const created = await store.stores.upsertByAmapPoi(userId, {
    amapPoiId: input.poi.amapPoiId,
    name: input.poi.name,
    category: input.poi.category,
    address: input.poi.address,
    latitude: input.poi.latitude,
    longitude: input.poi.longitude,
    avgPrice: input.poi.avgPrice,
    rating: input.poi.rating,
    phone: input.poi.phone,
    source: 'amap'
  });
  const wasCreated = !before.some((item) => item.id === created.id);
  const link = await store.storePlaceLinks.createOrUpdate({
    userId,
    storeId: created.id,
    placeId: input.placeId,
    status: input.status,
    tags: input.tags
  });

  return { store: created, link, wasCreated };
}

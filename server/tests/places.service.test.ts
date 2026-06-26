import { describe, expect, it } from 'vitest';
import { matchPlaceByLocation } from '../src/services/places.js';

const office = {
  id: 'plc_office',
  userId: 'usr_1',
  name: '公司',
  address: '人民广场',
  latitude: 31.2304,
  longitude: 121.4737,
  radiusMeters: 500,
  sortOrder: 0,
  createdAt: '2026-06-26T00:00:00.000Z',
  updatedAt: '2026-06-26T00:00:00.000Z'
};

const home = {
  ...office,
  id: 'plc_home',
  name: '家',
  latitude: 31.232,
  longitude: 121.475,
  radiusMeters: 500
};

describe('matchPlaceByLocation', () => {
  it('returns the nearest place inside its radius', () => {
    const result = matchPlaceByLocation({
      places: [home, office],
      location: { latitude: 31.23042, longitude: 121.47372 }
    });

    expect(result.matchedPlace?.id).toBe('plc_office');
    expect(result.distanceMeters).toBeLessThan(10);
    expect(result.unmatchedLocation).toBe(false);
  });

  it('returns an unmatched result when all places are outside radius', () => {
    const result = matchPlaceByLocation({
      places: [office],
      location: { latitude: 31.2504, longitude: 121.4937 }
    });

    expect(result.matchedPlace).toBeNull();
    expect(result.unmatchedLocation).toBe(true);
  });
});

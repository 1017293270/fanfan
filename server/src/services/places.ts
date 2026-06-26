import type { CommonPlace } from '../data/types.js';
import type { Location } from '../schemas/recommendation.js';

export type PlaceMatchResult = {
  matchedPlace: CommonPlace | null;
  distanceMeters: number | null;
  unmatchedLocation: boolean;
};

export function distanceMeters(a: Location, b: Location): number {
  const earthRadiusMeters = 6371000;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const deltaLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const deltaLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const value =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  return Math.round(earthRadiusMeters * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)));
}

export function matchPlaceByLocation(input: { places: CommonPlace[]; location: Location }): PlaceMatchResult {
  const ranked = input.places
    .map((place) => ({
      place,
      distance: distanceMeters(input.location, {
        latitude: place.latitude,
        longitude: place.longitude
      })
    }))
    .filter((item) => item.distance <= item.place.radiusMeters)
    .sort((a, b) => a.distance - b.distance);

  if (ranked.length === 0) {
    return {
      matchedPlace: null,
      distanceMeters: null,
      unmatchedLocation: true
    };
  }

  return {
    matchedPlace: ranked[0].place,
    distanceMeters: ranked[0].distance,
    unmatchedLocation: false
  };
}

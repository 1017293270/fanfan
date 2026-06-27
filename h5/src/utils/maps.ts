import type { LocationPoint } from '../api/types';

export type MapTarget = {
  name: string;
  address?: string;
  location?: LocationPoint;
};

function hasUsableLocation(location: LocationPoint | undefined): location is LocationPoint {
  return Boolean(location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude));
}

export function createAmapNavigationUrl(target: MapTarget) {
  if (hasUsableLocation(target.location)) {
    const url = new URL('https://uri.amap.com/navigation');
    url.searchParams.set('to', `${target.location.longitude},${target.location.latitude},${target.name}`);
    url.searchParams.set('mode', 'walk');
    url.searchParams.set('policy', '1');
    url.searchParams.set('coordinate', 'gaode');
    url.searchParams.set('src', 'kaifanli');
    url.searchParams.set('callnative', '1');
    return url.toString();
  }

  const url = new URL('https://uri.amap.com/search');
  url.searchParams.set('keyword', [target.name, target.address].filter(Boolean).join(' '));
  url.searchParams.set('src', 'kaifanli');
  url.searchParams.set('callnative', '1');
  return url.toString();
}

export function openAmapNavigation(target: MapTarget) {
  window.location.assign(createAmapNavigationUrl(target));
}

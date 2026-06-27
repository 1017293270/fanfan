type NamedPlace = {
  name: string;
};

export function formatReadableLocationName(address?: string | null) {
  const clean = address?.trim();
  return clean || '当前位置附近';
}

export function fallbackPlaceName(place?: NamedPlace | null) {
  return place ? `「${place.name}」附近` : '上海市中心附近';
}

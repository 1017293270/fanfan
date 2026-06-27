import { describe, expect, it } from 'vitest';
import { fallbackPlaceName, formatReadableLocationName } from '../src/utils/locationDisplay';

describe('location display helpers', () => {
  it('shows a resolved address instead of coordinate text', () => {
    const label = formatReadableLocationName('上海市黄浦区人民大道100号');

    expect(label).toBe('上海市黄浦区人民大道100号');
    expect(label).not.toMatch(/经纬度|\d+\.\d{3,}/);
  });

  it('falls back to plain readable place names', () => {
    expect(fallbackPlaceName({ name: '公司' })).toBe('「公司」附近');
    expect(fallbackPlaceName(null)).toBe('上海市中心附近');
    expect(formatReadableLocationName('')).toBe('当前位置附近');
  });
});

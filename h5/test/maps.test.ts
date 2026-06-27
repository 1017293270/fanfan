import { describe, expect, it } from 'vitest';
import { createAmapNavigationUrl } from '../src/utils/maps';

describe('createAmapNavigationUrl', () => {
  it('builds an AMap walking navigation URL when coordinates exist', () => {
    const url = createAmapNavigationUrl({
      name: '巷口小厨',
      location: { latitude: 31.2304, longitude: 121.4737 }
    });

    expect(url).toContain('https://uri.amap.com/navigation?');
    expect(url).toContain('to=121.4737%2C31.2304%2C%E5%B7%B7%E5%8F%A3%E5%B0%8F%E5%8E%A8');
    expect(url).toContain('mode=walk');
    expect(url).toContain('callnative=1');
  });

  it('falls back to AMap search when coordinates are missing', () => {
    const url = createAmapNavigationUrl({
      name: '阳春三记',
      address: '公司附近'
    });

    expect(url).toContain('https://uri.amap.com/search?');
    expect(url).toContain('%E9%98%B3%E6%98%A5%E4%B8%89%E8%AE%B0');
    expect(url).toContain('%E5%85%AC%E5%8F%B8%E9%99%84%E8%BF%91');
    expect(url).toContain('callnative=1');
  });
});

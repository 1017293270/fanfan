import type { RestaurantCandidate } from '../schemas/recommendation.js';

export const candidateA: RestaurantCandidate = {
  poiId: 'B001',
  name: '巷口小厨',
  category: '中餐',
  distanceMeters: 680,
  rating: '4.6',
  avgPrice: 32,
  address: '示例路 88 号',
  tags: ['米饭', '家常菜', '少辣'],
  location: { latitude: 31.2304, longitude: 121.4737 },
  openNow: true
};

export const candidateB: RestaurantCandidate = {
  poiId: 'B002',
  name: '热汤面馆',
  category: '面馆',
  distanceMeters: 920,
  rating: '4.4',
  avgPrice: 28,
  address: '示例街 12 号',
  tags: ['热乎', '面食'],
  location: { latitude: 31.231, longitude: 121.474 },
  openNow: true
};

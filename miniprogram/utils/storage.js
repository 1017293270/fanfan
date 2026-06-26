const KEYS = {
  recentPreference: 'kaifanli:recentPreference',
  favorites: 'kaifanli:favorites',
  excluded: 'kaifanli:excluded'
};

function getArray(key) {
  return wx.getStorageSync(key) || [];
}

function setArray(key, value) {
  wx.setStorageSync(key, value);
}

function upsertByPoiId(key, restaurant) {
  const items = getArray(key).filter((item) => item.poiId !== restaurant.poiId);
  items.unshift(restaurant);
  setArray(key, items.slice(0, 50));
}

module.exports = {
  getRecentPreference() {
    return wx.getStorageSync(KEYS.recentPreference) || '';
  },
  setRecentPreference(value) {
    wx.setStorageSync(KEYS.recentPreference, value || '');
  },
  getFavorites() {
    return getArray(KEYS.favorites);
  },
  addFavorite(restaurant) {
    upsertByPoiId(KEYS.favorites, restaurant);
  },
  getExcludedPoiIds() {
    return getArray(KEYS.excluded).map((item) => item.poiId);
  },
  addExcluded(restaurant) {
    upsertByPoiId(KEYS.excluded, restaurant);
  }
};

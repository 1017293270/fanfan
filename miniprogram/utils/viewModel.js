function buildRecommendationPayload({ location, textPreference, filters, excludedPoiIds, favoritePoiIds }) {
  return {
    location,
    textPreference,
    quickFilters: {
      distanceMeters: filters.distanceMeters,
      budgetPerPerson: filters.budgetPerPerson,
      spicyPreference: filters.spicyPreference,
      craving: filters.craving,
      openNow: filters.openNow
    },
    localContext: {
      excludedPoiIds,
      favoritePoiIds
    }
  };
}

function formatDistance(distanceMeters) {
  if (typeof distanceMeters !== 'number') return '-';
  if (distanceMeters < 1000) return `${distanceMeters}m`;
  return `${(distanceMeters / 1000).toFixed(1)}km`;
}

function formatCategory(category) {
  if (!category) return '餐厅';
  const text = String(category);
  const compactRules = [
    [/火锅/, '火锅'],
    [/烧烤|烤肉/, '烧烤'],
    [/咖啡/, '咖啡'],
    [/奶茶|饮品|茶饮|茶艺馆/, '茶饮'],
    [/面馆|面食|拉面|粉面|热干面|汤面/, '面馆'],
    [/快餐|便当|盖饭|简餐/, '快餐'],
    [/川菜/, '川菜'],
    [/湘菜/, '湘菜'],
    [/粤菜/, '粤菜'],
    [/中餐|家常菜|江浙菜|东北菜|湖北菜|本帮菜/, '中餐'],
    [/西餐/, '西餐'],
    [/甜品|蛋糕|面包/, '甜品']
  ];
  const matchedRule = compactRules.find(([pattern]) => pattern.test(text));
  if (matchedRule) return matchedRule[1];

  const genericWords = ['餐饮服务', '餐饮相关场所', '餐饮相关', '餐馆', '餐厅'];
  const parts = text.split(/[;|/、,，]/).map((part) => part.trim()).filter(Boolean);
  const specific = parts.find((part) => !genericWords.includes(part));
  return specific || '餐厅';
}

function getVisibleTags(tags, category) {
  const genericTags = new Set(['餐饮服务', '餐饮相关', '餐饮相关场所', '餐厅', '中餐厅']);
  const sourceTags = Array.isArray(tags) ? tags : [];
  const normalized = sourceTags
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .flatMap((tag) => tag.split(/[;|/、,，]/).map((part) => part.trim()).filter(Boolean))
    .filter((tag) => !genericTags.has(tag));
  const visible = Array.from(new Set(normalized)).slice(0, 3);
  if (visible.length) return visible;

  const categoryText = formatCategory(category);
  return categoryText === '餐厅' ? ['距离近', '预算内'] : [categoryText, '距离近', '预算内'];
}

module.exports = {
  buildRecommendationPayload,
  formatDistance,
  formatCategory,
  getVisibleTags
};

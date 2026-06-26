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
  if (distanceMeters < 1000) return `${distanceMeters}m`;
  return `${(distanceMeters / 1000).toFixed(1)}km`;
}

module.exports = {
  buildRecommendationPayload,
  formatDistance
};

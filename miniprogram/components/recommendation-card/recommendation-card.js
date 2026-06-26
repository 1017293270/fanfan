const { formatCategory, formatDistance, getVisibleTags } = require('../../utils/viewModel');

Component({
  properties: {
    restaurant: Object
  },
  data: {
    categoryText: '',
    distanceText: '',
    visibleTags: []
  },
  observers: {
    restaurant(value) {
      this.setData({
        categoryText: value ? formatCategory(value.category) : '',
        distanceText: value ? formatDistance(value.distanceMeters) : '',
        visibleTags: value ? getVisibleTags(value.tags, value.category) : []
      });
    }
  }
});

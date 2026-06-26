const { formatCategory, formatDistance } = require('../../utils/viewModel');

Component({
  properties: {
    restaurant: Object
  },
  data: {
    categoryText: '',
    distanceText: ''
  },
  observers: {
    restaurant(value) {
      this.setData({
        categoryText: value ? formatCategory(value.category) : '',
        distanceText: value ? formatDistance(value.distanceMeters) : ''
      });
    }
  },
  methods: {
    handleChoose() {
      this.triggerEvent('choose', {
        restaurant: this.properties.restaurant
      });
    }
  }
});

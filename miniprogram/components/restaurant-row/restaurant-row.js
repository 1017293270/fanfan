const { formatDistance } = require('../../utils/viewModel');

Component({
  properties: {
    restaurant: Object
  },
  data: {
    distanceText: ''
  },
  observers: {
    restaurant(value) {
      this.setData({
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

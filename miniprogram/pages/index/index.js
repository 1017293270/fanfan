const storage = require('../../utils/storage');
const { requestRecommendation } = require('../../utils/api');
const { buildRecommendationPayload } = require('../../utils/viewModel');

Page({
  data: {
    status: 'idle',
    loading: false,
    errorMessage: '',
    location: null,
    textPreference: '',
    filters: {
      distanceMeters: 1500,
      budgetPerPerson: 30,
      spicyPreference: 'mild',
      craving: '',
      openNow: true
    },
    distanceOptions: [
      { label: '1.5km 内', value: 1500 },
      { label: '3km 内', value: 3000 }
    ],
    budgetOptions: [
      { label: '人均 30', value: 30 },
      { label: '人均 50', value: 50 }
    ],
    spicyOptions: [
      { label: '少辣', value: 'mild' }
    ],
    cravingOptions: [
      { label: '米饭', value: '米饭' },
      { label: '热汤面', value: '热汤面' }
    ],
    primaryRecommendation: null,
    alternatives: []
  },

  onLoad() {
    this.setData({
      textPreference: storage.getRecentPreference()
    });
  },

  handleTextInput(event) {
    this.setData({
      textPreference: event.detail.value
    });
  },

  handleDistanceSelect(event) {
    this.setData({ 'filters.distanceMeters': event.detail.value });
  },

  handleBudgetSelect(event) {
    this.setData({ 'filters.budgetPerPerson': event.detail.value });
  },

  handleSpicySelect(event) {
    this.setData({ 'filters.spicyPreference': event.detail.value });
  },

  handleCravingSelect(event) {
    this.setData({ 'filters.craving': event.detail.value });
  },

  getLocation() {
    this.setData({ status: 'locating' });
    return new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'gcj02',
        success: (res) => {
          const location = {
            latitude: res.latitude,
            longitude: res.longitude
          };
          this.setData({ location });
          resolve(location);
        },
        fail: () => reject(new Error('饭饭狸需要定位，才能找到你附近能吃的地方。'))
      });
    });
  },

  async handleRecommend() {
    if (this.data.loading) return;
    this.setData({ loading: true, status: 'loading', errorMessage: '' });

    try {
      const location = this.data.location || (await this.getLocation());
      storage.setRecentPreference(this.data.textPreference);
      const favorites = storage.getFavorites();
      const payload = buildRecommendationPayload({
        location,
        textPreference: this.data.textPreference,
        filters: this.data.filters,
        excludedPoiIds: storage.getExcludedPoiIds(),
        favoritePoiIds: favorites.map((item) => item.poiId)
      });
      const result = await requestRecommendation(payload);
      this.setData({
        status: 'success',
        primaryRecommendation: result.primaryRecommendation,
        alternatives: result.alternatives || []
      });
    } catch (error) {
      this.setData({
        status: 'error',
        errorMessage: error.message || '推荐服务暂时不可用，稍后再试试。'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  handleRefresh() {
    this.handleRecommend();
  },

  handleFavorite() {
    if (!this.data.primaryRecommendation) return;
    storage.addFavorite(this.data.primaryRecommendation);
    wx.showToast({ title: '饭饭狸记住啦', icon: 'none' });
  },

  handleDislike() {
    if (!this.data.primaryRecommendation) return;
    storage.addExcluded(this.data.primaryRecommendation);
    wx.showToast({ title: '这家先不看', icon: 'none' });
    this.handleRecommend();
  },

  handleChooseAlternate(event) {
    const selected = event.detail.restaurant;
    const alternatives = [this.data.primaryRecommendation].concat(
      this.data.alternatives.filter((item) => item.poiId !== selected.poiId)
    );
    this.setData({
      primaryRecommendation: selected,
      alternatives
    });
  },

  handleNavigate() {
    const restaurant = this.data.primaryRecommendation;
    if (!restaurant || !restaurant.location) {
      wx.showToast({ title: '这家暂时没有坐标', icon: 'none' });
      return;
    }
    wx.openLocation({
      latitude: restaurant.location.latitude,
      longitude: restaurant.location.longitude,
      name: restaurant.name,
      address: restaurant.address
    });
  }
});

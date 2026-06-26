Component({
  properties: {
    label: String,
    value: null,
    selected: Boolean
  },
  methods: {
    handleTap() {
      this.triggerEvent('select', {
        value: this.properties.value
      });
    }
  }
});

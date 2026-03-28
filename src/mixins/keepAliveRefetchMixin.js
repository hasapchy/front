export default {
  activated() {
    if (!this.fetchItems || this.data == null) return;
    this.fetchItems(this.data.currentPage ?? 1, true);
  },
};

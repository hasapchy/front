export default {
  activated() {
    if (!this.fetchItems || this.data == null) return;
    this.fetchItems(this.data?.currentPage ?? this.data?.current_page ?? 1, true);
  },
};

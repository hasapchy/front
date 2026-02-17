export default {
  activated() {
    if (typeof this.fetchItems !== 'function' || this.data == null) return;
    const page = this.data.currentPage ?? this.data.current_page ?? 1;
    this.fetchItems(page, true);
  },
};

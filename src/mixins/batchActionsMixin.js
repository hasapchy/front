export default {
  data() {
    return {
      loadingBatch: false,
      deleteDialog: false,
      idsToDelete: [],
    };
  },
  methods: {
    async deleteItems(ids) {
      if (!ids || !ids.length) return;

      this.idsToDelete = ids;
      this.deleteDialog = true;
    },

    async confirmDeleteItems() {
      this.deleteDialog = false;
      if (!this.idsToDelete.length) return;

      this.loadingBatch = true;
      try {
        await Promise.all(
          this.idsToDelete.map((id) => this.controller.deleteItem(id))
        );
        this.selectedIds = [];
        await this.fetchItems?.();
        this.showNotification?.("Выбранные удалены");
      } catch (e) {
        this.showNotification?.("Ошибка удаления", e.message, true);
      } finally {
        this.loadingBatch = false;
        this.idsToDelete = [];
      }
    },

    getBatchActions() {
      return [
        {
          label: "Удалить",
          icon: "fas fa-trash",
          type: "danger",
          action: this.deleteItems,
          disabled: this.loadingBatch,
        },
      ];
    },
  },
};

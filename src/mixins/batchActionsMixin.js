export default {
  data() {
    return {
      selectedIds: [],
      loadingBatch: false,
      deleteDialog: false,
      idsToDelete: [],
      showStatusSelect: true,
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
      const errors = [];
      let deletedCount = 0;

      for (const id of this.idsToDelete) {
        try {
          await this.controller.deleteItem(id);
          deletedCount++;
        } catch (e) {
          const messages = this.getApiErrorMessage?.(e) || [
            e.message || "Ошибка",
          ];
          errors.push(`ID ${id}: ${messages[0]}`);
        }
      }

      if (deletedCount > 0) {
        this.showNotification?.(`Удалено ${deletedCount} элементов`);
        if (this.invalidateCache) {
          this.invalidateCache('onDelete');
        }
      }

      if (errors.length > 0) {
        this.showNotification?.("Ошибки при удалении", errors.join("\n"), true);
      }

      this.selectedIds = [];
      await this.fetchItems?.();
      this.loadingBatch = false;
      this.idsToDelete = [];
    },
    getBatchActions() {
      const actions = [];
      
      const hasDeletePermission = this.$store?.getters?.hasPermission?.('orders_delete') || 
                                 this.$store?.getters?.hasPermission?.('projects_delete') ||
                                 this.$store?.getters?.hasPermission?.('clients_delete');
      
      if (hasDeletePermission) {
        actions.push({
          label: "",
          icon: "fas fa-trash",
          type: "danger",
          action: this.deleteItems,
          disabled: this.loadingBatch,
        });
      }
      
      if (this.showStatusSelect !== false) {
        actions.push({
          label: 'Сменить статус', 
          icon: "fas fa-edit",
          type: "info",
          action: null, 
          render: true, 
        });
      }
      
      return actions;
    },
  },
};

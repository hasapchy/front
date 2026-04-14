import BaseController from "@/api/BaseController";

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
      if (!Array.isArray(ids) || !ids.length) return;

      this.idsToDelete = ids;
      this.deleteDialog = true;
    },
    async confirmDeleteItems() {
      this.deleteDialog = false;
      if (!this.idsToDelete.length) return;

      this.loadingBatch = true;
      const errors = [];
      let deletedCount = 0;

      const t = this.$t?.bind(this);
      const deletedMsg = (n) =>
        t ? t("batchDeletedCount", { count: n }) : `Deleted ${n} items`;
      const errorsTitle = t ? t("batchDeleteErrorsTitle") : "Delete errors";

      try {
        if (typeof this.controller?.batchDelete === "function") {
          const max = BaseController.BATCH_IDS_MAX;
          const allIds = this.idsToDelete;
          for (let i = 0; i < allIds.length; i += max) {
            const chunk = allIds.slice(i, i + max);
            const res = await this.controller.batchDelete(chunk);
            const payload = BaseController.unwrapUnifiedBatchPayload(res);
            const { deletedDelta, errorLines } =
              BaseController.collectUnifiedBatchDiffs(payload);
            deletedCount += deletedDelta;
            errors.push(...errorLines);
          }
          if (errors.length > 0) {
            const body =
              (deletedCount > 0 ? `${deletedMsg(deletedCount)}\n\n` : "") +
              errors.join("\n");
            this.showNotification(errorsTitle, body, true);
          } else if (deletedCount > 0) {
            this.showNotification(deletedMsg(deletedCount));
          }
          if (deletedCount > 0) {
            this.invalidateCache?.("onDelete");
            if (typeof this.afterBatchDelete === "function") {
              await this.afterBatchDelete({ deletedCount });
            }
          }
        } else {
          for (const id of this.idsToDelete) {
            try {
              await this.controller.deleteItem(id);
              deletedCount++;
            } catch (e) {
              const messages = this.getApiErrorMessage(e) || [
                e.message || "Error",
              ];
              errors.push(`ID ${id}: ${messages[0]}`);
            }
          }

          if (deletedCount > 0) {
            this.showNotification(deletedMsg(deletedCount));
            this.invalidateCache?.("onDelete");
            if (typeof this.afterBatchDelete === "function") {
              await this.afterBatchDelete({ deletedCount });
            }
          }

          if (errors.length > 0) {
            this.showNotification(errorsTitle, errors.join("\n"), true);
          }
        }
      } catch (e) {
        const messages = this.getApiErrorMessage?.(e) || [e.message || "Error"];
        this.showNotification(
          errorsTitle,
          Array.isArray(messages) ? messages.join("\n") : messages,
          true,
        );
      }

      this.selectedIds = [];
      await this.fetchItems?.();
      this.loadingBatch = false;
      this.idsToDelete = [];
    },
    getBatchActions() {
      const actions = [];

      const deletePermissions = Array.isArray(this.deletePermission)
        ? this.deletePermission
        : this.deletePermission
          ? [this.deletePermission]
          : [
              "orders_delete",
              "projects_delete",
              "clients_delete",
              "sales_delete",
              "transactions_delete",
            ];

      const hasDeletePermission = deletePermissions.some((perm) =>
        this.$store.getters.hasPermission(perm),
      );

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
          label: "Change status",
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

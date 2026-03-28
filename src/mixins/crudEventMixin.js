import { CacheInvalidator } from "@/cache";

export default {
  data() {
    let perPage = 20;
    try {
      const savedPerPage = localStorage.getItem("perPage");
      if (savedPerPage) {
        const parsed = parseInt(savedPerPage, 10);
        if (!isNaN(parsed) && parsed >= 20 && parsed <= 50) {
          perPage = parsed;
        } else {
          localStorage.removeItem("perPage");
        }
      }
    } catch (e) {
      console.warn("localStorage is unavailable:", e);
    }

    return {
      data: null,
      loading: false,
      perPage: perPage,
      perPageOptions: [20, 50],
    };
  },
  watch: {
    perPage(newValue) {
      if (newValue < 20 || newValue > 50) {
        return;
      }
      try {
        localStorage.setItem("perPage", newValue.toString());
      } catch (e) {
        console.warn("Failed to persist perPage:", e);
      }
    },
  },
  methods: {
    handlePerPageChange(newPerPage) {
      this.perPage = newPerPage;
      this.fetchItems(1, false);
    },
    invalidateCache(action) {
      if (this.cacheInvalidationType && CacheInvalidator[action]) {
        CacheInvalidator[action]?.(this.cacheInvalidationType, this.$store.state.currentCompany?.id);
      }
    },
    refreshDataAfterOperation() {
      if (this.fetchItems) {
        this.fetchItems(this.data?.currentPage || 1, true)
          .then(() => this.restoreScrollPosition?.())
          .catch((error) => console.error("Failed to refresh data:", error));
      }
      if (this.closeModal) {
        this.shouldRestoreScrollOnClose = false;
        this.closeModal(true);
      }
    },
    handleSaved() {
      this.showNotification(
        this.savedSuccessText || "Saved successfully",
        "",
        false
      );

      this.invalidateCache("onUpdate");
      this.refreshDataAfterOperation();

      if (this.onAfterSaved) {
        this.onAfterSaved();
      }
    },
    handleSavedError(m) {
      const readOnlyMessageSource = m || null;
      const readOnlyMessages = [
        this.$t?.("transactionReadonlyDueToSource"),
        this.$t?.("transactionDeletedReadonly"),
      ].filter(Boolean);

      if (readOnlyMessageSource && readOnlyMessages.includes(readOnlyMessageSource)) {
        this.showNotification(
          this.$t?.("warning") || this.savedErrorText || "Error",
          readOnlyMessageSource,
          { isDanger: false, isInfo: true }
        );
        return;
      }

      let messages = this.getApiErrorMessage(m);
      if (Array.isArray(messages) && messages.length === 0) {
        messages = null;
      }
      if (!messages) {
        messages = ["Save failed"];
      } else if (!Array.isArray(messages)) {
        messages = [messages];
      }
      this.showNotification(
        this.savedErrorText || "Save failed",
        messages,
        true
      );
    },
    handleDeleted() {
      this.showNotification(
        this.deletedSuccessText || "Deleted successfully",
        "",
        false
      );

      this.invalidateCache("onDelete");
      this.refreshDataAfterOperation();

      if (this.onAfterDeleted) {
        this.onAfterDeleted();
      }
    },
    handleDeletedError(m) {
      let messages = this.getApiErrorMessage(m);
      if (Array.isArray(messages) && messages.length === 0) {
        messages = null;
      }
      if (!messages) {
        messages = ["Delete failed"];
      } else if (!Array.isArray(messages)) {
        messages = [messages];
      }
      this.showNotification(
        this.deletedErrorText || "Delete failed",
        messages,
        true
      );
    },
  },
};

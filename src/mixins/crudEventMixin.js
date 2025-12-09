import { CacheInvalidator } from "@/cache";

export default {
  data() {
    let perPage = 20;
    try {
      const savedPerPage = localStorage.getItem("perPage");
      if (savedPerPage) {
        const parsed = parseInt(savedPerPage, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
          perPage = parsed;
        } else if (parsed > 100) {
          localStorage.removeItem("perPage");
        }
      }
    } catch (e) {
      console.warn("localStorage недоступен:", e);
    }

    return {
      data: null,
      loading: false,
      perPage: perPage,
      perPageOptions: [10, 20, 50, 100],
    };
  },
  watch: {
    perPage(newValue) {
      if (newValue > 100) {
        return;
      }
      try {
        localStorage.setItem("perPage", newValue.toString());
      } catch (e) {
        console.warn("Не удалось сохранить perPage:", e);
      }
    },
  },
  methods: {
    invalidateCache(action) {
      if (
        this.cacheInvalidationType &&
        CacheInvalidator[action] &&
        typeof CacheInvalidator[action] === "function"
      ) {
        const companyId = this.$store.state.currentCompany?.id;
        CacheInvalidator[action](this.cacheInvalidationType, companyId);
      }
    },
    refreshDataAfterOperation() {
      if (this.fetchItems) {
        this.fetchItems(this.data?.currentPage || 1, true)
          .then(() => this.restoreScrollPosition?.())
          .catch((error) => console.error("Ошибка обновления данных:", error));
      }
      if (this.closeModal) {
        this.shouldRestoreScrollOnClose = false;
        this.closeModal(true);
      }
    },
    handleSaved() {
      this.showNotification(
        this.savedSuccessText || "Успешно сохранено",
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
      let messages = this.getApiErrorMessage(m);
      if (Array.isArray(messages) && messages.length === 0) {
        messages = null;
      }
      if (!messages) {
        messages = ["Ошибка сохранения"];
      } else if (!Array.isArray(messages)) {
        messages = [messages];
      }
      this.showNotification(
        this.savedErrorText || "Ошибка сохранения",
        messages,
        true
      );
    },
    handleDeleted() {
      this.showNotification(
        this.deletedSuccessText || "Успешно удалено",
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
        messages = ["Ошибка удаления"];
      } else if (!Array.isArray(messages)) {
        messages = [messages];
      }
      this.showNotification(
        this.deletedErrorText || "Ошибка удаления",
        messages,
        true
      );
    },
  },
};

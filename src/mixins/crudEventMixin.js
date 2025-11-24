export default {
  data() {
    return {
      data: null,
      loading: false,
      perPageOptions: [10, 25, 50, 100],
    };
  },
  computed: {
    perPage() {
      return this.$store.getters.perPage || 10;
    },
  },
  watch: {
    perPage(newValue) {
      if (newValue > 100) {
        return;
      }
      this.$store.dispatch('setPerPage', newValue);
    },
  },
  methods: {
    invalidateCache(action) {
      if (this.cacheInvalidationType) {
        const companyId = this.$store.state.currentCompany?.id;
        const actionMap = {
          onCreate: 'onDataCreate',
          onUpdate: 'onDataUpdate',
          onDelete: 'onDataDelete'
        };
        const storeAction = actionMap[action];
        if (storeAction) {
          this.$store.dispatch(storeAction, {
            type: this.cacheInvalidationType,
            companyId
          });
        }
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
    normalizeErrorMessages(error, defaultMessage) {
      let messages = this.getApiErrorMessage(error);
      if (Array.isArray(messages) && messages.length === 0) {
        messages = null;
      }
      if (!messages) {
        messages = [defaultMessage];
      } else if (!Array.isArray(messages)) {
        messages = [messages];
      }
      return messages;
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
    handleSavedError(error) {
      const messages = this.normalizeErrorMessages(error, "Ошибка сохранения");
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
    handleDeletedError(error) {
      const messages = this.normalizeErrorMessages(error, "Ошибка удаления");
      this.showNotification(
        this.deletedErrorText || "Ошибка удаления",
        messages,
        true
      );
    },
  },
};

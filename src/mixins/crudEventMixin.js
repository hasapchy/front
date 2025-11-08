import CacheInvalidator from '@/utils/cacheInvalidator';

export default {
  data() {
    const savedPerPage = localStorage.getItem('perPage');
    let perPage = 10;
    if (savedPerPage) {
      const parsed = parseInt(savedPerPage, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
        perPage = parsed;
      } else if (parsed > 100) {
        localStorage.removeItem('perPage');
      }
    }
    
    return {
      data: null,
      loading: false,
      perPage: perPage,
      perPageOptions: [10, 25, 50, 100],
    };
  },
  watch: {
    perPage(newValue) {
      if (newValue > 100) {
        return;
      }
      localStorage.setItem('perPage', newValue.toString());
    }
  },
  methods: {
    invalidateCache(action) {
      if (this.cacheInvalidationType) {
        const companyId = this.$store.state.currentCompany?.id;
        CacheInvalidator[action](this.cacheInvalidationType, companyId);
      }
    },
    refreshDataAfterOperation() {
      if (this.fetchItems) {
        this.fetchItems(this.data?.currentPage || 1, true).then(() => {
          if (this.restoreScrollPosition) {
            this.restoreScrollPosition();
          }
        });
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
      
      this.invalidateCache('onUpdate');
      this.refreshDataAfterOperation();
    },
    handleSavedError(m) {
      this.showNotification(
        this.savedErrorText || "Ошибка сохранения",
        m,
        true
      );
    },
    handleDeleted() {
      this.showNotification(
        this.deletedSuccessText || "Успешно удалено",
        "",
        false
      );
      
      this.invalidateCache('onDelete');
      this.refreshDataAfterOperation();
    },
    handleDeletedError(m) {
      this.showNotification(
        this.deletedErrorText || "Ошибка удаления",
        m,
        true
      );
    },
  },
};

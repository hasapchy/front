import CacheInvalidator from '@/utils/cacheInvalidator';

export default {
  data() {
    // ✅ Синхронно загружаем perPage из localStorage ДО первого рендера
    const savedPerPage = localStorage.getItem('perPage');
    const perPage = savedPerPage ? parseInt(savedPerPage, 10) : 10;
    
    return {
      data: null,
      loading: false,
      perPage: perPage,
      perPageOptions: [10, 25, 50, 100],
      // controller, cacheInvalidationType, savedSuccessText и т.д. - переопределяются в компонентах
    };
  },
  watch: {
    // ✅ Сохраняем perPage в localStorage при изменении
    perPage(newValue) {
      localStorage.setItem('perPage', newValue.toString());
    }
  },
  methods: {
    handleSaved() {
      this.showNotification(
        this.savedSuccessText || "Успешно сохранено",
        "",
        false
      );
      
      // Инвалидируем кэш при сохранении
      if (this.cacheInvalidationType) {
        const companyId = this.$store.state.currentCompany?.id;
        CacheInvalidator.onUpdate(this.cacheInvalidationType, companyId);
      }
      
      this.fetchItems(this.data?.currentPage || 1, true); // true = silent режим, без перезагрузки UI
      this.closeModal();
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
      
      // Инвалидируем кэш при удалении
      if (this.cacheInvalidationType) {
        const companyId = this.$store.state.currentCompany?.id;
        CacheInvalidator.onDelete(this.cacheInvalidationType, companyId);
      }
      
      this.fetchItems(this.data?.currentPage || 1, true); // true = silent режим
      this.closeModal();
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

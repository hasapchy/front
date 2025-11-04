import CacheInvalidator from '@/utils/cacheInvalidator';

export default {
  data() {
    // ✅ Синхронно загружаем perPage из localStorage ДО первого рендера
    const savedPerPage = localStorage.getItem('perPage');
    let perPage = 10; // Значение по умолчанию
    if (savedPerPage) {
      const parsed = parseInt(savedPerPage, 10);
      // ✅ Проверяем, что распарсенное значение является валидным числом
      if (!isNaN(parsed) && parsed > 0) {
        perPage = parsed;
      }
    }
    
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
      
      // Обновляем данные на текущей странице в silent режиме
      this.fetchItems(this.data?.currentPage || 1, true).then(() => {
        // Восстанавливаем позицию скролла после обновления данных
        if (this.restoreScrollPosition) {
          this.restoreScrollPosition();
        }
      });
      
      // Закрываем модальное окно, пропуская восстановление скролла (мы уже это сделали выше)
      this.shouldRestoreScrollOnClose = false;
      this.closeModal(true); // true = пропустить восстановление скролла
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
      
      // Обновляем данные на текущей странице в silent режиме
      this.fetchItems(this.data?.currentPage || 1, true).then(() => {
        // Восстанавливаем позицию скролла после обновления данных
        if (this.restoreScrollPosition) {
          this.restoreScrollPosition();
        }
      });
      
      // Закрываем модальное окно, пропуская восстановление скролла (мы уже это сделали выше)
      this.shouldRestoreScrollOnClose = false;
      this.closeModal(true); // true = пропустить восстановление скролла
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

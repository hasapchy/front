export default {
  data() {
    return {
      modalDialog: false,
      editingItem: null,
      showTimeline: false,
      savedScrollPosition: 0, // Сохраненная позиция скролла
      shouldRestoreScrollOnClose: true, // Флаг для контроля восстановления скролла
    };
  },
  methods: {
    showModal(item = null) {
      // Сохраняем текущую позицию скролла перед открытием модального окна
      this.savedScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      this.shouldRestoreScrollOnClose = true; // Сбрасываем флаг
      
      this.modalDialog = true;
      this.showTimeline = true;
      this.editingItem = item;
    },
    closeModal(skipScrollRestore = false) {
      this.modalDialog = false;
      
      // Восстанавливаем позицию скролла при закрытии модального окна
      // (если закрываем без сохранения или если не указано иное)
      if (!skipScrollRestore && this.shouldRestoreScrollOnClose) {
        this.$nextTick(() => {
          requestAnimationFrame(() => {
            window.scrollTo({
              top: this.savedScrollPosition,
              behavior: 'instant'
            });
          });
        });
      }
    },
    // Универсальный обработчик закрытия модального окна
    // Проверяет, есть ли у формы метод handleCloseRequest (для несохраненных изменений)
    handleModalClose() {
      // Ищем первый ref, который содержит метод handleCloseRequest
      const formRef = Object.values(this.$refs).find(ref => ref && typeof ref.handleCloseRequest === 'function');
      
      if (formRef && formRef.handleCloseRequest) {
        formRef.handleCloseRequest();
      } else {
        this.closeModal();
      }
    },
    // Восстановление позиции скролла
    restoreScrollPosition() {
      this.$nextTick(() => {
        // Используем requestAnimationFrame для более плавного восстановления
        requestAnimationFrame(() => {
          window.scrollTo({
            top: this.savedScrollPosition,
            behavior: 'instant' // Мгновенный переход без анимации
          });
        });
      });
    },
  },
};

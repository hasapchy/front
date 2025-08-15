export default {
  data() {
    return {
      // Состояние для отслеживания изменений
      initialFormState: null,
      closeConfirmDialog: false,
    };
  },
  mounted() {
    // Сохраняем начальное состояние формы
    this.saveInitialState();
    
    // Добавляем обработчик для предотвращения закрытия браузера с несохраненными изменениями
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  },
  beforeUnmount() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  },
  methods: {
    // Сохранение начального состояния формы
    saveInitialState() {
      this.initialFormState = this.getFormState();
    },
    
    // Метод для получения текущего состояния формы (должен быть переопределен в компоненте)
    getFormState() {
      // Этот метод должен быть переопределен в компоненте
      console.warn('getFormState method should be overridden in component');
      return {};
    },
    
    // Проверка наличия изменений
    checkForChanges() {
      if (!this.initialFormState) return false;
      
      const currentState = this.getFormState();
      return JSON.stringify(currentState) !== JSON.stringify(this.initialFormState);
    },
    
    // Обработка попытки закрытия формы
    handleCloseRequest() {
      // Проверяем, идет ли загрузка файлов
      if (this.uploading) {
        return; // Блокируем закрытие во время загрузки
      }
      
      if (this.checkForChanges()) {
        this.closeConfirmDialog = true;
      } else {
        this.closeForm();
      }
    },
    
    // Подтверждение закрытия
    confirmClose() {
      this.closeConfirmDialog = false;
      this.closeForm();
    },
    
    // Отмена закрытия
    cancelClose() {
      this.closeConfirmDialog = false;
    },
    
    // Закрытие формы (должно быть переопределено в компоненте)
    closeForm() {
      this.$emit('close-request');
    },
    
    // Обработчик события beforeunload
    handleBeforeUnload(event) {
      // Проверяем, идет ли загрузка файлов
      if (this.uploading) {
        event.preventDefault();
        event.returnValue = '';
        return;
      }
      
      if (this.checkForChanges()) {
        event.preventDefault();
        event.returnValue = '';
      }
    },
    
    // Сброс состояния изменений (вызывается после успешного сохранения)
    resetFormChanges() {
      this.saveInitialState();
    },
  },
}; 
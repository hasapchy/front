export default {
  data() {
    return {
      // Состояние для отслеживания изменений
      initialFormState: null,
      closeConfirmDialog: false,
      isFormInitialized: false, // Флаг инициализации формы
    };
  },
  mounted() {
    // Убрали обработчик beforeunload - не показываем браузерное предупреждение
    // window.addEventListener('beforeunload', this.handleBeforeUnload);
    
    // Сохраняем начальное состояние формы после полной инициализации компонента
    this.$nextTick(() => {
      this.saveInitialState();
    });
  },
  beforeUnmount() {
    // window.removeEventListener('beforeunload', this.handleBeforeUnload);
  },
  methods: {
    // Сохранение начального состояния формы
    saveInitialState() {
      const state = this.getFormState();
      this.initialFormState = state;
      // Устанавливаем флаг инициализации только если состояние валидно
      this.isFormInitialized = state !== null && typeof state === 'object';
    },
    
    // Метод для получения текущего состояния формы (должен быть переопределен в компоненте)
    getFormState() {
      // Этот метод должен быть переопределен в компоненте
      // Возвращаем null, чтобы отличить от переопределенного метода
      return null;
    },
    
    // Проверка наличия изменений
    checkForChanges() {
      if (!this.isFormInitialized) return false;
      
      try {
        const currentState = this.getFormState();
        
        // Если getFormState() не переопределен (возвращает null) - не проверяем изменения
        if (currentState === null || this.initialFormState === null) return false;
        
        // Если состояние пустое - нет смысла проверять
        if (!currentState || Object.keys(currentState).length === 0) return false;
        if (!this.initialFormState || Object.keys(this.initialFormState).length === 0) return false;
        
        return JSON.stringify(currentState) !== JSON.stringify(this.initialFormState);
      } catch (error) {
        console.error('Error checking form changes:', error);
        return false;
      }
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
      
      // Проверяем только если форма была инициализирована
      if (this.isFormInitialized && this.checkForChanges()) {
        event.preventDefault();
        event.returnValue = '';
      }
    },
    
    // Сброс состояния изменений (вызывается после успешного сохранения)
    resetFormChanges() {
      this.saveInitialState();
    },
    
    // Сброс флага инициализации (для случаев когда нужно переинициализировать форму)
    resetFormInitialization() {
      this.isFormInitialized = false;
    },
  },
}; 
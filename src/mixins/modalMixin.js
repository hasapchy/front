export default {
  data() {
    return {
      modalDialog: false,
      editingItem: null,
      showTimeline: false,
    };
  },
  methods: {
    showModal(item = null) {
      this.modalDialog = true;
      this.showTimeline = true;
      this.editingItem = item;
    },
    closeModal() {
      this.modalDialog = false;
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
  },
};

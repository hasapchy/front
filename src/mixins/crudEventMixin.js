export default {
  methods: {
    handleSaved() {
      this.showNotification(
        this.savedSuccessText || "Успешно сохранено",
        "",
        false
      );
      this.fetchItems(this.data?.currentPage || 1, false); // false = не silent, загружаем с сервера
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
      this.fetchItems(this.data?.currentPage || 1, true);
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

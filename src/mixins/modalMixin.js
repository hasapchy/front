export default {
  data() {
    return {
      modalDialog: false,
      editingItem: null,
      showTimeline: false,
      savedScrollPosition: 0,
      shouldRestoreScrollOnClose: true,
    };
  },
  methods: {
    showModal(item = null) {
      this.savedScrollPosition = window.pageYOffset ?? document.documentElement.scrollTop;
      this.shouldRestoreScrollOnClose = true;
      this.modalDialog = true;
      this.showTimeline = true;
      this.editingItem = item;
    },
    closeModal(skipScrollRestore = false) {
      this.modalDialog = false;
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
    handleModalClose() {
      const formRef = Object.values(this.$refs || {}).find(ref => ref?.handleCloseRequest);
      if (formRef?.handleCloseRequest) {
        formRef.handleCloseRequest();
      } else {
        this.closeModal();
      }
    },
    restoreScrollPosition() {
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          window.scrollTo({
            top: this.savedScrollPosition,
            behavior: 'instant'
          });
        });
      });
    },
  },
};

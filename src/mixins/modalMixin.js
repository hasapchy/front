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
      this.savedScrollPosition =
        window.pageYOffset ?? document.documentElement.scrollTop;
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
              behavior: "instant",
            });
          });
        });
      }
    },
    handleModalClose() {
      const formRef = Object.values(this.$refs || {}).find(
        (ref) => ref?.handleCloseRequest
      );
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
            behavior: "instant",
          });
        });
      });
    },
    onItemClick(item) {
      if (!item?.id) {
        return;
      }
      const routeName = this.itemViewRouteName;
      if (!routeName) {
        console.warn("itemViewRouteName не определен в компоненте");
        return;
      }
      
      if (this.$route.name === routeName && this.$route.params.id == item.id) {
        this.showModal(item);
        return;
      }
      
      const baseRouteName = this.baseRouteName || (routeName ? routeName.replace("View", "") : null);
      if (this.$route.name === baseRouteName || this.$route.name === routeName) {
        this.showModal(item);
        this.$router.push({ name: routeName, params: { id: item.id } }).catch(() => {});
        return;
      }
      
      this.$router.push({ name: routeName, params: { id: item.id } });
    },
    async handleRouteItem(id) {
      if (!id) {
        if (this.modalDialog) {
          this.closeModal();
        }
        this.editingItem = null;
        return;
      }
      const itemId = Number(id);
      if (!itemId) {
        const baseRouteName =
          this.baseRouteName ||
          (this.itemViewRouteName
            ? this.itemViewRouteName.replace("View", "")
            : null);
        if (baseRouteName) {
          this.$router.replace({ name: baseRouteName });
        }
        return;
      }
      if (this.editingItem?.id === itemId && this.modalDialog) {
        return;
      }
      if (!this.controller) {
        console.warn("controller не определен в компоненте");
        return;
      }
      try {
        const item = await this.controller.getItem(itemId);
        if (!item) {
          const errorText =
            this.errorGettingItemText ||
            this.$t("errorGettingItem") ||
            "Элемент не найден";
          const notFoundText = this.$t("notFound") || "Не найдено";
          if (this.showNotification) {
            this.showNotification(errorText, notFoundText, true);
          }
          const baseRouteName =
            this.baseRouteName ||
            (this.itemViewRouteName
              ? this.itemViewRouteName.replace("View", "")
              : null);
          if (baseRouteName) {
            this.$router.replace({ name: baseRouteName });
          }
          return;
        }
        if (this.beforeShowModal && typeof this.beforeShowModal === 'function') {
          this.beforeShowModal(item);
        }
        this.showModal(item);
      } catch (error) {
        const errorText =
          this.errorGettingItemText ||
          this.$t("errorGettingItem") ||
          "Ошибка при получении элемента";
        if (this.showNotification) {
          this.showNotification(errorText, error.message, true);
        }
        const baseRouteName =
          this.baseRouteName ||
          (this.itemViewRouteName
            ? this.itemViewRouteName.replace("View", "")
            : null);
        if (baseRouteName) {
          this.$router.replace({ name: baseRouteName });
        }
      }
    },
  },
};

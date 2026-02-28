export default {
  data() {
    return {
      exportLoading: false,
    };
  },
  methods: {
    async handleExport() {
      const controller = this.controller;
      const getExportParams = this.getExportParams;
      if (!controller || typeof getExportParams !== 'function') return;
      this.exportLoading = true;
      try {
        const ids = this.selectedIds?.length ? this.selectedIds : null;
        await controller.export(getExportParams.call(this), ids);
        if (typeof this.showNotification === 'function') {
          this.showNotification(this.$t('exportDone') || 'Экспорт выполнен', '', false);
        }
      } catch (e) {
        if (typeof this.showNotification === 'function') {
          const msg = typeof this.getApiErrorMessage === 'function' ? this.getApiErrorMessage(e) : e?.message;
          this.showNotification(this.$t('exportError') || 'Ошибка экспорта', msg, true);
        }
      } finally {
        this.exportLoading = false;
      }
    },
  },
};

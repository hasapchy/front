export default {
  data() {
    return {
      exportLoading: false,
    };
  },
  methods: {
    async handleExport() {
      if (!this.controller || !this.getExportParams) return;
      this.exportLoading = true;
      try {
        const ids = this.selectedIds?.length ? this.selectedIds : null;
        await this.controller.export(this.getExportParams(), ids);
        this.showNotification?.(this.$t('exportDone'), '', false);
      } catch (e) {
        const msg = this.getApiErrorMessage?.(e) ?? e?.message;
        this.showNotification?.(this.$t('exportError'), msg, true);
      } finally {
        this.exportLoading = false;
      }
    },
  },
};

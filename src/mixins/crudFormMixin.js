export default {
  data() {
    return {
      saveLoading: false,
      deleteDialog: false,
      deleteLoading: false,
      editingItemId: null,
    };
  },
  methods: {
    showDeleteDialog() {
      this.deleteDialog = true;
    },
    closeDeleteDialog() {
      this.deleteDialog = false;
    },
    async save() {
      this.saveLoading = true;
      try {
        const data = this.prepareSave();
        const response = await this.performSave(data);
        this.$emit('saved', response);
        this.onSaveSuccess(response);
      } catch (error) {
        this.$emit('saved-error', this.getApiErrorMessage ? this.getApiErrorMessage(error) : error);
        this.onSaveError(error);
      }
      this.saveLoading = false;
    },
    async deleteItem() {
      this.closeDeleteDialog();
      if (!this.editingItemId) return;

      this.deleteLoading = true;
      try {
        await this.performDelete();
        this.$emit('deleted');
        this.onDeleteSuccess();
      } catch (error) {
        this.$emit('deleted-error', this.getApiErrorMessage ? this.getApiErrorMessage(error) : error);
        this.onDeleteError(error);
      }
      this.deleteLoading = false;
    },
    prepareSave() {
      throw new Error('prepareSave must be implemented in component');
    },
    async performSave(data) {
      throw new Error('performSave(data) must be implemented in component');
    },
    async performDelete() {
      throw new Error('performDelete must be implemented in component');
    },
    onSaveSuccess(response) {
      if (this.clearForm) {
        this.clearForm();
      }
    },
    onSaveError(error) {
    },
    onDeleteSuccess() {
      if (this.clearForm) {
        this.clearForm();
      }
    },
    onDeleteError(error) {
    },
    onEditingItemChanged(newEditingItem) {
    },
  },
  watch: {
    editingItem: {
      handler(newEditingItem, oldEditingItem) {
        if (newEditingItem) {
          this.editingItemId = newEditingItem.id || null;
          this.onEditingItemChanged(newEditingItem);
        } else {
          if (oldEditingItem !== undefined) {
            if (this.clearForm) {
              this.clearForm();
            }
          }
        }
        this.$nextTick(() => {
          if (this.saveInitialState) {
            this.saveInitialState();
          }
        });
      },
      deep: true,
      immediate: true
    }
  },
};

import keyboardShortcutsMixin from './keyboardShortcutsMixin';

export default {
  mixins: [keyboardShortcutsMixin],
  data() {
    return {
      saveLoading: false,
      deleteDialog: false,
      deleteLoading: false,
      editingItemId: null,
      initialFormState: null,
      closeConfirmDialog: false,
      isFormInitialized: false,
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.saveInitialState();
    });
  },
  methods: {
    normalizeApiErrors(error) {
      if (this.getApiErrorMessage) {
        return this.getApiErrorMessage(error);
      }
      return error;
    },
    emitSavedError(error) {
      this.$emit('saved-error', this.normalizeApiErrors(error));
    },
    emitDeletedError(error) {
      this.$emit('deleted-error', this.normalizeApiErrors(error));
    },
    isEmptyRequiredValue(value) {
      if (value === null || value === undefined) {
        return true;
      }
      if (typeof value === 'string') {
        return value.trim() === '';
      }
      return false;
    },
    validateRequiredFields(fields) {
      if (!Array.isArray(fields)) {
        return true;
      }
      for (const field of fields) {
        if (!field || !Object.prototype.hasOwnProperty.call(field, 'value')) {
          continue;
        }
        if (this.isEmptyRequiredValue(field.value)) {
          this.emitSavedError(field.message || 'Required field is empty');
          return false;
        }
      }
      return true;
    },
    showDeleteDialog() {
      this.deleteDialog = true;
    },
    closeDeleteDialog() {
      this.deleteDialog = false;
    },
    async save() {
      this.saveLoading = true;
      try {
        const response = await this.performSave(this.prepareSave());
        this.$emit('saved', response);
        this.onSaveSuccess(response);
      } catch (error) {
        this.emitSavedError(error);
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
        this.emitDeletedError(error);
        this.onDeleteError(error);
      }
      this.deleteLoading = false;
    },
    prepareSave() {
      throw new Error('prepareSave must be implemented in component');
    },
    async performSave() {
      throw new Error('performSave(data) must be implemented in component');
    },
    async performDelete() {
      throw new Error('performDelete must be implemented in component');
    },
    onSaveSuccess() {
      if (this.clearForm) {
        this.clearForm();
      }
    },
    onSaveError() {
    },
    onDeleteSuccess() {
      if (this.clearForm) {
        this.clearForm();
      }
    },
    onDeleteError() {
    },
    onEditingItemChanged() {
    },
    saveInitialState() {
      const state = this.getFormState();
      this.initialFormState = state;
      this.isFormInitialized = state !== null && state === Object(state);
    },
    getFormState() {
      return null;
    },
    checkForChanges() {
      if (!this.isFormInitialized || !this.initialFormState) return false;
      try {
        const currentState = this.getFormState();
        if (!currentState || !this.initialFormState) return false;
        return JSON.stringify(currentState) !== JSON.stringify(this.initialFormState);
      } catch (error) {
        console.error('Error checking form changes:', error);
        return false;
      }
    },
    handleCloseRequest() {
      if (this.uploading) {
        return;
      }
      if (this.checkForChanges()) {
        this.closeConfirmDialog = true;
      } else {
        this.closeForm();
      }
    },
    confirmClose() {
      this.closeConfirmDialog = false;
      this.closeForm();
    },
    cancelClose() {
      this.closeConfirmDialog = false;
    },
    handleEscapeKey() {
      this.handleCloseRequest();
    },
    closeForm() {
      this.$emit('close-request');
    },
    resetFormChanges() {
      this.saveInitialState();
    },
    resetFormInitialization() {
      this.isFormInitialized = false;
    },
    handleSaveShortcut() {
      if (!this.saveLoading) {
        this.save();
      }
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

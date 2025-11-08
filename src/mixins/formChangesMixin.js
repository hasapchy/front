export default {
  data() {
    return {
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
    saveInitialState() {
      const state = this.getFormState();
      this.initialFormState = state;
      this.isFormInitialized = state !== null && typeof state === 'object';
    },
    getFormState() {
      return null;
    },
    checkForChanges() {
      if (!this.isFormInitialized) return false;
      
      try {
        const currentState = this.getFormState();
        if (currentState === null || this.initialFormState === null) return false;
        if (!currentState || Object.keys(currentState).length === 0) return false;
        if (!this.initialFormState || Object.keys(this.initialFormState).length === 0) return false;
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
    closeForm() {
      this.$emit('close-request');
    },
    handleBeforeUnload(event) {
      if (this.uploading) {
        event.preventDefault();
        event.returnValue = '';
        return;
      }
      
      if (this.isFormInitialized && this.checkForChanges()) {
        event.preventDefault();
        event.returnValue = '';
      }
    },
    resetFormChanges() {
      this.saveInitialState();
    },
    resetFormInitialization() {
      this.isFormInitialized = false;
    },
  },
}; 
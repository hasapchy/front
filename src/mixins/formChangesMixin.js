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
    closeForm() {
      this.$emit('close-request');
    },
    resetFormChanges() {
      this.saveInitialState();
    },
    resetFormInitialization() {
      this.isFormInitialized = false;
    },
  },
}; 
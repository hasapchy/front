export default {
  data() {
    return {
      modalDialog: false,
      editingItem: null,
    };
  },
  methods: {
    showModal(item = null) {
      this.modalDialog = true;
      this.editingItem = item;
    },
    closeModal() {
      this.modalDialog = false;
    },
  },
};

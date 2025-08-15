export default {
  data() {
    return {
      modalDialog: false,
      editingItem: null,
      showTimeline: false,
    };
  },
  methods: {
    showModal(item = null) {
      this.modalDialog = true;
      this.showTimeline = true;
      this.editingItem = item;
    },
    closeModal() {
      this.modalDialog = false;
    },
  },
};

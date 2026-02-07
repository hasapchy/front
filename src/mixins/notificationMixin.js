export default {
  methods: {
    showNotification(title, subtitle = "", isDanger = false, duration = 10000) {
      this.$store.dispatch('showNotification', { title, subtitle, isDanger, duration });
    },
    closeNotification() {
      this.$store.dispatch('closeNotification');
    }
  },
};

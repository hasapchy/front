export default {
  computed: {
    notification() {
      return this.$store.getters.notification;
    },
    notificationTitle() {
      return this.$store.getters.notificationTitle;
    },
    notificationSubtitle() {
      return this.$store.getters.notificationSubtitle;
    },
    notificationIsDanger() {
      return this.$store.getters.notificationIsDanger;
    },
  },
  methods: {
    showNotification(title, subtitle = "", isDanger = false, duration = 10000) {
      this.$store.dispatch('showNotification', { title, subtitle, isDanger, duration });
    },
    closeNotification() {
      this.$store.dispatch('closeNotification');
    },
    pauseNotificationTimer() {
      this.$store.dispatch('pauseNotificationTimer');
    },
    resumeNotificationTimer() {
      this.$store.dispatch('resumeNotificationTimer');
    }
  },
};

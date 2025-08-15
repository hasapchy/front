import soundManager from '@/utils/soundUtils.js';

export default {
  data() {
    return {
      notification: false,
      notificationTitle: "",
      notificationSubtitle: "",
      notificationIsDanger: false,
      notificationTimeoutId: null, 
    };
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

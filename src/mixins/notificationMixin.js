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
    showNotification(title, subtitle = "", isDanger = false) {
      this.$store.dispatch('showNotification', { title, subtitle, isDanger });
    },
    closeNotification() {
      this.$store.dispatch('closeNotification');
    }
  },
};

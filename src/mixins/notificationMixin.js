export default {
  data() {
    return {
      notification: false,
      notificationTitle: "",
      notificationSubtitle: "",
      notificationIsDanger: false,
    };
  },
  methods: {
    showNotification(title, subtitle = "", isDanger = false) {
      this.notificationTitle = title;
      this.notificationSubtitle = subtitle;
      this.notificationIsDanger = isDanger;
      this.notification = true;
      setTimeout(() => {
        this.notification = false;
      }, 10000);
    },
  },
};

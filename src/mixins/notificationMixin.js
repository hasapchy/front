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
      clearTimeout(this.notificationTimeoutId);

      this.notificationTitle = title;
      this.notificationSubtitle = Array.isArray(subtitle)
        ? subtitle
        : subtitle?.toString().split("\n");
      this.notificationIsDanger = isDanger;
      this.notification = true;

      this.notificationTimeoutId = setTimeout(() => {
        this.notification = false;
      }, 10000);
    },
    closeNotification() {
      clearTimeout(this.notificationTimeoutId);
      this.notification = false;
    },
  },
};

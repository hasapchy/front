export default {
  methods: {
    showNotification(title, subtitle = "", optionsOrIsDanger = false, duration = 10000) {
      if (optionsOrIsDanger && optionsOrIsDanger === Object(optionsOrIsDanger)) {
        const { isDanger = false, isInfo = false, duration: customDuration = duration } = optionsOrIsDanger;
        this.$store.dispatch("showNotification", {
          title,
          subtitle,
          isDanger,
          isInfo,
          duration: customDuration,
        });
        return;
      }

      const isDanger = Boolean(optionsOrIsDanger);
      this.$store.dispatch("showNotification", { title, subtitle, isDanger, duration });
    },
    closeNotification() {
      this.$store.dispatch('closeNotification');
    }
  },
};

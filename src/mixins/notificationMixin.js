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
      clearTimeout(this.notificationTimeoutId);

      this.notificationTitle = title;
      // Если subtitle уже массив (например, от getApiErrorMessage), используем его как есть
      // Если это строка, используем её напрямую без разделения
      this.notificationSubtitle = Array.isArray(subtitle) ? subtitle : subtitle;
      this.notificationIsDanger = isDanger;
      this.notification = true;

      // Воспроизводим звук
      if (isDanger) {
        soundManager.playError();
      } else {
        soundManager.playSuccess();
      }

      this.notificationTimeoutId = setTimeout(() => {
        this.notification = false;
      }, 10000);
    },
    closeNotification() {
      clearTimeout(this.notificationTimeoutId);
      this.notification = false;
    }
  },
};

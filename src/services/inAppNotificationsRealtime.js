import echo from "@/services/echo";
import { eventBus } from "@/eventBus";
import soundManager from "@/utils/soundUtils";

class InAppNotificationsRealtime {
  constructor() {
    this.store = null;
    this.channel = null;
    this.boundCompanyId = null;
    this.boundUserId = null;
    this.initialized = false;
  }

  unsubscribe() {
    if (this.channel && this.boundCompanyId != null && this.boundUserId != null) {
      try {
        this.channel.stopListening(".app.notification.created");
        echo.leave(`company.${this.boundCompanyId}.user.${this.boundUserId}`);
      } catch {
        void 0;
      }
    }
    this.channel = null;
    this.boundCompanyId = null;
    this.boundUserId = null;
  }

  resubscribe() {
    this.unsubscribe();
    const user = this.store?.state?.user;
    const companyId = this.store?.getters?.currentCompanyId;
    if (!user?.id || !companyId) {
      return;
    }

    const cid = Number(companyId);
    const uid = Number(user.id);
    this.boundCompanyId = cid;
    this.boundUserId = uid;

    const channelName = `company.${cid}.user.${uid}`;
    this.channel = echo
      .private(channelName)
      .listen(".app.notification.created", (payload) => {
        const n = payload?.notification;
        if (!n) {
          return;
        }
        this.store.commit("IN_APP_NOTIFICATION_RECEIVED", n);
        if (!n.read_at) {
          soundManager.playMessage();
        }
        eventBus.emit("inapp-notification", n);
      });
  }

  initialize(store) {
    this.store = store;
    this.initialized = true;
    this.resubscribe();
  }

  reinitialize() {
    this.resubscribe();
  }

  cleanup() {
    this.unsubscribe();
    this.store = null;
    this.initialized = false;
  }
}

const inAppNotificationsRealtime = new InAppNotificationsRealtime();

export default inAppNotificationsRealtime;

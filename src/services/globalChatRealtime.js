import echo from "@/services/echo";
import { createChatRealtime } from "@/services/chatRealtime";
import { eventBus } from "@/eventBus";

const RECONNECT_COOLDOWN_MS = 120_000;

class GlobalChatRealtime {
  constructor() {
    this.realtime = null;
    this.store = null;
    this.activeChatId = null;
    this.onlineUserIds = [];
    this.initialized = false;
    this.connectionCheckInterval = null;
    this.lastReconnectAt = 0;
  }

  /**
   * @param {any} store Vuex store
   */
  async initialize(store) {
    if (this.initialized) {
      return;
    }

    this.store = store;
    if (!store?.state?.user) {
      return;
    }

    this.realtime = createChatRealtime(echo, {
      onMessage: (event) => eventBus.emit("chat:message", event),
      onMessageUpdated: (event) => eventBus.emit("chat:message:updated", event),
      onMessageDeleted: (event) => eventBus.emit("chat:message:deleted", event),
      onReaction: (event) => eventBus.emit("chat:message:reaction", event),
      onPinnedUpdated: (event) => eventBus.emit("chat:pinned:updated", event),
      onRead: (event) => eventBus.emit("chat:read", event),
      onTyping: (event) => eventBus.emit("chat:typing", event),
      onChatError: (error) => {
        console.error("[GlobalChatRealtime] Ошибка канала:", error);
        eventBus.emit("chat:error", error);
      },
      onPresenceHere: (users) => {
        this.onlineUserIds = (users || [])
          .map((u) => Number(u.id))
          .filter((id) => !Number.isNaN(id));
        eventBus.emit("presence:here", users);
      },
      onPresenceJoining: (user) => {
        const id = Number(user?.id);
        if (!Number.isNaN(id) && !this.onlineUserIds.includes(id)) {
          this.onlineUserIds.push(id);
        }
        eventBus.emit("presence:joining", user);
      },
      onPresenceLeaving: (user) => {
        const id = Number(user?.id);
        if (!Number.isNaN(id)) {
          this.onlineUserIds = this.onlineUserIds.filter((uid) => uid !== id);
        }
        eventBus.emit("presence:leaving", user);
      },
      onPresenceError: (err) => {
        console.error("[GlobalChatRealtime] Ошибка presence:", err);
        eventBus.emit("presence:error", err);
      },
    });

    this.initialized = true;
    this.bindChannels();
    this.connectionCheckInterval = setInterval(() => this.checkConnection(), 30000);
  }

  bindChannels() {
    const companyId = this.store?.getters?.currentCompanyId;
    const userId = this.store?.state?.user?.id;
    if (!this.realtime || !companyId || !userId) {
      return;
    }

    this.realtime.subscribeInbox(companyId, userId);
    this.realtime.subscribePresence(companyId);
    if (this.activeChatId) {
      this.realtime.subscribeActiveChatTyping(companyId, this.activeChatId);
    }
  }

  async resubscribe() {
    if (!this.realtime) {
      return;
    }
    this.realtime.cleanup();
    this.bindChannels();
  }

  checkConnection() {
    if (!this.realtime) {
      return;
    }

    const { echoConnected, inboxSubscribed } = this.realtime.checkAllSubscriptions();
    if (echoConnected && inboxSubscribed) {
      return;
    }

    const now = Date.now();
    if (now - this.lastReconnectAt < RECONNECT_COOLDOWN_MS) {
      return;
    }

    this.lastReconnectAt = now;
    this.resubscribe();
  }

  setActiveChatId(chatId) {
    const companyId = this.store?.getters?.currentCompanyId;
    const id = chatId == null ? null : Number(chatId);
    this.activeChatId = Number.isNaN(id) ? null : id;

    if (!this.realtime) {
      return;
    }

    this.realtime.unsubscribeActiveChatTyping();
    if (companyId && this.activeChatId) {
      this.realtime.subscribeActiveChatTyping(companyId, this.activeChatId);
    }
  }

  getOnlineUserIds() {
    return [...this.onlineUserIds];
  }

  isUserOnline(userId) {
    return this.onlineUserIds.includes(Number(userId));
  }

  getStatus() {
    return this.realtime?.checkAllSubscriptions() ?? null;
  }

  cleanup() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
    this.realtime?.cleanup();
    this.realtime = null;
    this.store = null;
    this.activeChatId = null;
    this.onlineUserIds = [];
    this.initialized = false;
    this.lastReconnectAt = 0;
  }
}

export default new GlobalChatRealtime();

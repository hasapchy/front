// src/services/globalChatRealtime.js
// Глобальный менеджер WebSocket подписок для чатов
// Работает независимо от текущей страницы после авторизации

import echo from "@/services/echo";
import { createChatRealtime } from "@/services/chatRealtime";
import ChatController from "@/api/ChatController";
import { eventBus } from "@/eventBus";

/**
 * Глобальный менеджер WebSocket подписок для чатов
 */
class GlobalChatRealtime {
  constructor() {
    this.realtime = null;
    this.store = null;
    this.onlineUserIds = [];
    this.initialized = false;
    this.connectionCheckInterval = null;
  }

  /**
   * Инициализация глобального сервиса
   * @param {any} store Vuex store
   */
  async initialize(store) {
    if (this.initialized) {
      return;
    }

    this.store = store;
    
    // Проверяем авторизацию
    const user = store?.state?.user;
    if (!user) {
      return;
    }

    // Проверяем подключение Echo
    if (echo.isConnected && !echo.isConnected()) {
      // Ждем подключения с таймаутом
      const maxAttempts = 10;
      let attempts = 0;
      while (attempts < maxAttempts && echo.isConnected && !echo.isConnected()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      if (echo.isConnected && !echo.isConnected()) {
        console.error("[GlobalChatRealtime] Не удалось подключиться к Echo");
        return;
      }
    }

    // Создаем экземпляр chatRealtime
    this.realtime = createChatRealtime(echo, {
      log: (msg, ...args) => console.log(msg, ...args),
      onMessage: (event) => {
        console.log("[GlobalChatRealtime] 📨 Получено сообщение:", {
          chat_id: event?.chat_id,
          user: event?.user?.name,
          body: event?.body?.substring(0, 50),
        });
        eventBus.emit("chat:message", event);
      },
      onMessageUpdated: (event) => {
        eventBus.emit("chat:message:updated", event);
      },
      onMessageDeleted: (event) => {
        eventBus.emit("chat:message:deleted", event);
      },
      onRead: (event) => {
        eventBus.emit("chat:read", event);
      },
      onChatError: (error) => {
        console.error("[GlobalChatRealtime] Ошибка канала:", error);
        eventBus.emit("chat:error", error);
      },
      onChannelSubscribed: (chatId, channelName) => {
        console.log(`[GlobalChatRealtime] ✅ Подписан на канал чата #${chatId}: ${channelName}`);
        eventBus.emit("chat:subscribed", { chatId, channelName });
      },
      onPresenceHere: (users) => {
        const ids = (users || []).map((u) => Number(u.id)).filter((id) => !Number.isNaN(id));
        this.onlineUserIds = [...ids];
        console.log(`[GlobalChatRealtime] 👥 Presence: ${users?.length || 0} пользователей онлайн`);
        eventBus.emit("presence:here", users);
      },
      onPresenceJoining: (user) => {
        const id = Number(user?.id);
        if (!Number.isNaN(id) && !this.onlineUserIds.includes(id)) {
          this.onlineUserIds = [...this.onlineUserIds, id];
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

    // Загружаем чаты и подписываемся
    await this.loadAndSubscribe();

    // Периодическая проверка подключения
    this.connectionCheckInterval = setInterval(() => {
      this.checkConnection();
    }, 30000);
  }

  /**
   * Загрузка чатов и подписка на каналы
   * Важно: чтобы работали уведомления по всем чатам (unread counters),
   * подписываемся на все чаты пользователя.
   */
  async loadAndSubscribe() {
    if (!this.realtime || !this.store) return;

    const companyId = this.store.getters?.currentCompanyId;
    if (!companyId) {
      return;
    }

    try {
      console.log("[GlobalChatRealtime] 📡 Загрузка и подписка на чаты...");
      
      // Загружаем список чатов
      const chats = await ChatController.getChats();
      const chatsArray = Array.isArray(chats) ? chats : [];

      // Находим общий чат
      const generalChat = chatsArray.find((c) => c && c.type === "general") || null;

      // Подписываемся на все чаты
      const allChats = [...chatsArray];
      if (generalChat) {
        allChats.push(generalChat);
      }

      console.log(`[GlobalChatRealtime] Подписка на ${allChats.length} чат(ов)...`);
      this.realtime.syncChats(companyId, allChats);

      // Подписываемся на presence (онлайн статус)
      console.log(`[GlobalChatRealtime] Подписка на presence канал для компании ${companyId}...`);
      this.realtime.subscribePresence(companyId);
    } catch (error) {
      console.error("[GlobalChatRealtime] Ошибка инициализации каналов:", error);
    }
  }

  /**
   * Проверка подключения и переподключение при необходимости
   */
  checkConnection() {
    if (!this.realtime) return;

    const status = this.realtime.checkAllSubscriptions();
    if (!status.echoConnected) {
      // Переподключаемся
      this.reinitialize();
    }
  }

  /**
   * Переинициализация (при смене компании или переподключении)
   */
  async reinitialize() {
    if (!this.store) return;
    await this.loadAndSubscribe();
  }

  /**
   * Синхронизация чатов (вызывается при изменении списка чатов)
   */
  syncChats(chats) {
    if (!this.realtime || !this.store) return;

    const companyId = this.store.getters?.currentCompanyId;
    if (!companyId) return;

    this.realtime.syncChats(companyId, chats);
  }

  /**
   * Подписка на один активный чат (отписывается от всех остальных)
   */
  subscribeToActiveChat(chatId) {
    if (!this.realtime || !this.store) return;
    
    const companyId = this.store.getters?.currentCompanyId;
    if (!companyId || !chatId) return;

    this.realtime.subscribeToSingleChat(companyId, chatId);
  }

  /**
   * Отписка от чата
   */
  unsubscribeChat(chatId) {
    if (!this.realtime) return;
    this.realtime.unsubscribeChat(chatId);
  }

  /**
   * Получить список онлайн пользователей
   */
  getOnlineUserIds() {
    return [...this.onlineUserIds];
  }

  /**
   * Проверить, онлайн ли пользователь
   */
  isUserOnline(userId) {
    return this.onlineUserIds.includes(Number(userId));
  }

  /**
   * Получить статус всех подписок
   */
  getStatus() {
    if (!this.realtime) return null;
    return this.realtime.checkAllSubscriptions();
  }

  /**
   * Очистка и отключение
   */
  cleanup() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }

    if (this.realtime) {
      this.realtime.cleanup();
      this.realtime = null;
    }

    this.onlineUserIds = [];
    this.initialized = false;
    this.store = null;
  }
}

// Создаем единственный экземпляр
const globalChatRealtime = new GlobalChatRealtime();

export default globalChatRealtime;

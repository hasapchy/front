// src/services/chatRealtime.js
// Encapsulates Laravel Echo subscriptions for chats and presence.

/**
 * @typedef {Object} ChatRealtimeOptions
 * @property {(event:any)=>void} onMessage
 * @property {(event:any)=>void} [onMessageUpdated]
 * @property {(event:any)=>void} [onMessageDeleted]
 * @property {(event:any)=>void} [onRead]
 * @property {(error:any)=>void} [onChatError]
 * @property {(users:Array)=>void} [onPresenceHere]
 * @property {(user:Object)=>void} [onPresenceJoining]
 * @property {(user:Object)=>void} [onPresenceLeaving]
 * @property {(error:any)=>void} [onPresenceError]
 * @property {(chatId:number, channelName:string)=>void} [onChannelSubscribed]
 * @property {(msg:string)=>void} [log]
 */

/**
 * @param {any} echo Laravel Echo instance
 * @param {ChatRealtimeOptions} options
 */
export function createChatRealtime(echo, options) {
  const log = options?.log || (() => {});

  /** @type {Map<number, { channel:any, channelName:string, subscribed:boolean }>} */
  const chatChannels = new Map();

  /** @type {string|null} */
  let presenceChannelName = null;
  let presenceChannel = null;
  let presenceSubscribed = false;

  const safeLeave = (name) => {
    if (!name) return;
    try {
      echo.leave(name);
    } catch (_) {
      // ignore
    }
  };

  const subscribeChat = (companyId, chatId) => {
    if (!companyId || !chatId) return;
    const chatIdNum = Number(chatId);
    if (Number.isNaN(chatIdNum)) return;
    if (chatChannels.has(chatIdNum)) {
      // Проверяем, что канал действительно подписан
      const entry = chatChannels.get(chatIdNum);
      if (entry.subscribed) {
        log(`[WebSocket] Канал ${chatIdNum} уже подписан`);
        return;
      }
    }

    const channelName = `company.${companyId}.chat.${chatIdNum}`;
    log(`[WebSocket] Подписка на канал: ${channelName}`);

    const channel = echo
      .private(channelName)
      .listen(".chat.message.sent", (event) => {
        options?.onMessage?.(event);
      })
      .listen(".chat.message.updated", (event) => {
        log(`[WebSocket] Сообщение обновлено:`, event);
        options?.onMessageUpdated?.(event);
      })
      .listen(".chat.message.deleted", (event) => {
        log(`[WebSocket] Сообщение удалено:`, event);
        options?.onMessageDeleted?.(event);
      })
      .listen(".chat.read.updated", (event) => {
        options?.onRead?.(event);
      })
      .error((error) => {
        log(`[WebSocket] ❌ Ошибка канала ${chatIdNum}:`, error);
        options?.onChatError?.(error);
        // Помечаем как неподписанный при ошибке
        const entry = chatChannels.get(chatIdNum);
        if (entry) {
          entry.subscribed = false;
        }
      });

    // Проверка успешной подписки
    channel.subscribed(() => {
      log(`[WebSocket] ✅ Успешно подписан на канал: ${channelName}`);
      chatChannels.set(chatIdNum, { channel, channelName, subscribed: true });
      if (options?.onChannelSubscribed) {
        options.onChannelSubscribed(chatIdNum, channelName);
      }
    });

    // Обработка ошибки подписки
    channel.error((error) => {
      log(`[WebSocket] ❌ Ошибка подписки на канал ${chatIdNum}:`, error);
      chatChannels.set(chatIdNum, { channel, channelName, subscribed: false });
      options?.onChatError?.(error);
    });

    // Сохраняем канал даже если еще не подписан
    chatChannels.set(chatIdNum, { channel, channelName, subscribed: false });
  };

  const unsubscribeChat = (chatId) => {
    const chatIdNum = Number(chatId);
    if (Number.isNaN(chatIdNum)) return;

    const entry = chatChannels.get(chatIdNum);
    if (!entry) return;

    log(`[WebSocket] Отписка от канала чата ${chatIdNum}`);
    try {
      entry.channel?.stopListening?.(".chat.message.sent");
      entry.channel?.stopListening?.(".chat.message.updated");
      entry.channel?.stopListening?.(".chat.message.deleted");
      entry.channel?.stopListening?.(".chat.read.updated");
    } catch (_) {
      // ignore
    }

    // Echo internal channel names are often prefixed (private-/presence-), so we try a few variants.
    safeLeave(entry.channel?.name);
    safeLeave(entry.channelName);
    safeLeave(`private-${entry.channelName}`);

    chatChannels.delete(chatIdNum);
  };

  const syncChats = (companyId, chats) => {
    if (!companyId) return;
    const ids = new Set(
      (chats || [])
        .filter((c) => c && c.id)
        .map((c) => Number(c.id))
        .filter((id) => !Number.isNaN(id))
    );

    // Unsubscribe removed
    for (const [chatId] of chatChannels.entries()) {
      if (!ids.has(Number(chatId))) {
        unsubscribeChat(chatId);
      }
    }

    // Subscribe new
    ids.forEach((id) => subscribeChat(companyId, id));
  };

  const subscribePresence = (companyId) => {
    if (!companyId) return;
    const channelName = `company.${companyId}.presence`;

    // Re-subscribe if company changed
    if (presenceChannelName && presenceChannelName !== channelName) {
      unsubscribePresence();
    }
    presenceChannelName = channelName;
    presenceSubscribed = false;

    log(`[Presence] Подписка на канал: ${channelName}`);

    try {
      presenceChannel = echo
        .join(channelName)
        .here((users) => {
          log(`[Presence] ✅ Подписан на presence канал, пользователей онлайн: ${users?.length || 0}`);
          presenceSubscribed = true;
          options?.onPresenceHere?.(users || []);
        })
        .joining((user) => {
          log(`[Presence] Пользователь зашел:`, user);
          options?.onPresenceJoining?.(user);
        })
        .leaving((user) => {
          log(`[Presence] Пользователь вышел:`, user);
          options?.onPresenceLeaving?.(user);
        })
        .error((err) => {
          log(`[Presence] ❌ Ошибка presence канала:`, err);
          presenceSubscribed = false;
          options?.onPresenceError?.(err);
        });
    } catch (error) {
      presenceSubscribed = false;
      options?.onPresenceError?.(error);
    }
  };

  const unsubscribePresence = () => {
    if (!presenceChannelName) return;
    log(`[Presence] Отписка от канала: ${presenceChannelName}`);

    safeLeave(presenceChannelName);
    safeLeave(`presence-${presenceChannelName}`);

    presenceChannelName = null;
    presenceChannel = null;
    presenceSubscribed = false;
  };

  const cleanup = () => {
    for (const [chatId] of chatChannels.entries()) {
      unsubscribeChat(chatId);
    }
    chatChannels.clear();
    unsubscribePresence();
  };

  // Методы для проверки состояния
  const isChannelSubscribed = (chatId) => {
    const entry = chatChannels.get(Number(chatId));
    return entry?.subscribed === true;
  };

  const getSubscribedChannels = () => {
    const subscribed = [];
    for (const [chatId, entry] of chatChannels.entries()) {
      if (entry.subscribed) {
        subscribed.push(chatId);
      }
    }
    return subscribed;
  };

  const isPresenceSubscribed = () => {
    return presenceSubscribed;
  };

  const checkAllSubscriptions = () => {
    const pusher = echo.connector?.pusher;
    const connectionState = pusher?.connection?.state || 'unknown';

    const result = {
      echoConnected: connectionState === 'connected',
      echoState: connectionState,
      presenceSubscribed: presenceSubscribed,
      chatChannels: {},
    };

    for (const [chatId, entry] of chatChannels.entries()) {
      result.chatChannels[chatId] = {
        subscribed: entry.subscribed,
        channelName: entry.channelName,
      };
    }

    return result;
  };

  return {
    syncChats,
    subscribePresence,
    unsubscribePresence,
    unsubscribeChat,
    cleanup,
    getSubscribedChatIds: () => Array.from(chatChannels.keys()),
    // Новые методы для проверки
    isChannelSubscribed,
    getSubscribedChannels,
    isPresenceSubscribed,
    checkAllSubscriptions,
  };
}



// src/services/chatRealtime.js
// Encapsulates Laravel Echo subscriptions for chats and presence.

/**
 * @typedef {Object} ChatRealtimeOptions
 * @property {(event:any)=>void} onMessage
 * @property {(event:any)=>void} [onRead]
 * @property {(error:any)=>void} [onChatError]
 * @property {(users:Array)=>void} [onPresenceHere]
 * @property {(user:Object)=>void} [onPresenceJoining]
 * @property {(user:Object)=>void} [onPresenceLeaving]
 * @property {(error:any)=>void} [onPresenceError]
 * @property {(msg:string)=>void} [log]
 */

/**
 * @param {any} echo Laravel Echo instance
 * @param {ChatRealtimeOptions} options
 */
export function createChatRealtime(echo, options) {
  const log = options?.log || (() => {});

  /** @type {Map<number, { channel:any, channelName:string }>} */
  const chatChannels = new Map();

  /** @type {string|null} */
  let presenceChannelName = null;

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
    if (chatChannels.has(chatIdNum)) return;

    const channelName = `company.${companyId}.chat.${chatIdNum}`;
    log(`[WebSocket] Подписка на канал: ${channelName}`);

    const channel = echo
      .private(channelName)
      .listen(".chat.message.sent", (event) => {
        options?.onMessage?.(event);
      })
      .listen(".chat.read.updated", (event) => {
        options?.onRead?.(event);
      })
      .error((error) => {
        options?.onChatError?.(error);
      });

    chatChannels.set(chatIdNum, { channel, channelName });
  };

  const unsubscribeChat = (chatId) => {
    const chatIdNum = Number(chatId);
    if (Number.isNaN(chatIdNum)) return;

    const entry = chatChannels.get(chatIdNum);
    if (!entry) return;

    log(`[WebSocket] Отписка от канала чата ${chatIdNum}`);
    try {
      entry.channel?.stopListening?.(".chat.message.sent");
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

    log(`[Presence] Подписка на канал: ${channelName}`);

    try {
      echo
        .join(channelName)
        .here((users) => options?.onPresenceHere?.(users || []))
        .joining((user) => options?.onPresenceJoining?.(user))
        .leaving((user) => options?.onPresenceLeaving?.(user))
        .error((err) => options?.onPresenceError?.(err));
    } catch (error) {
      options?.onPresenceError?.(error);
    }
  };

  const unsubscribePresence = () => {
    if (!presenceChannelName) return;
    log(`[Presence] Отписка от канала: ${presenceChannelName}`);

    safeLeave(presenceChannelName);
    safeLeave(`presence-${presenceChannelName}`);

    presenceChannelName = null;
  };

  const cleanup = () => {
    for (const [chatId] of chatChannels.entries()) {
      unsubscribeChat(chatId);
    }
    chatChannels.clear();
    unsubscribePresence();
  };

  return {
    syncChats,
    subscribePresence,
    unsubscribePresence,
    unsubscribeChat,
    cleanup,
    getSubscribedChatIds: () => Array.from(chatChannels.keys()),
  };
}



export function createChatRealtime(echo, options) {
  let inboxChannel = null;
  let inboxChannelName = null;
  let typingChannelName = null;
  let presenceChannelName = null;
  let presenceSubscribed = false;

  const leave = (name) => {
    if (!name) {
      return;
    }
    try {
      echo.leave(name);
    } catch {
      void 0;
    }
  };

  const subscribeInbox = (companyId, userId) => {
    if (!companyId || !userId) {
      return;
    }
    const channelName = `company.${companyId}.user.${userId}.chats`;
    if (inboxChannelName === channelName) {
      return;
    }
    if (inboxChannelName) {
      leave(inboxChannelName);
      inboxChannel = null;
      inboxChannelName = null;
    }
    inboxChannelName = channelName;
    inboxChannel = echo.private(channelName);
    inboxChannel
      .listen(".chat.message.sent", (e) => options.onMessage?.(e))
      .listen(".chat.message.updated", (e) => options.onMessageUpdated?.(e))
      .listen(".chat.message.deleted", (e) => options.onMessageDeleted?.(e))
      .listen(".chat.message.reaction", (e) => options.onReaction?.(e))
      .listen(".chat.pinned.updated", (e) => options.onPinnedUpdated?.(e))
      .listen(".chat.read.updated", (e) => options.onRead?.(e))
      .error((error) => options.onChatError?.(error));
  };

  const subscribeActiveChatTyping = (companyId, chatId) => {
    const chatIdNum = Number(chatId);
    if (!companyId || Number.isNaN(chatIdNum)) {
      return;
    }
    const channelName = `company.${companyId}.chat.${chatIdNum}`;
    if (typingChannelName === channelName) {
      return;
    }
    if (typingChannelName) {
      leave(typingChannelName);
      typingChannelName = null;
    }
    typingChannelName = channelName;
    echo.private(channelName).listen(".chat-typing", (e) => options.onTyping?.(e));
  };

  const unsubscribeActiveChatTyping = () => {
    if (!typingChannelName) {
      return;
    }
    leave(typingChannelName);
    typingChannelName = null;
  };

  const subscribePresence = (companyId) => {
    if (!companyId) {
      return;
    }
    const channelName = `company.${companyId}.presence`;
    if (presenceChannelName === channelName) {
      return;
    }
    if (presenceChannelName) {
      leave(presenceChannelName);
      presenceChannelName = null;
      presenceSubscribed = false;
    }
    presenceChannelName = channelName;
    echo
      .join(channelName)
      .here((users) => {
        presenceSubscribed = true;
        options.onPresenceHere?.(users);
      })
      .joining((user) => options.onPresenceJoining?.(user))
      .leaving((user) => options.onPresenceLeaving?.(user))
      .error((err) => {
        presenceSubscribed = false;
        options.onPresenceError?.(err);
      });
  };

  const cleanup = () => {
    unsubscribeActiveChatTyping();
    if (inboxChannelName) {
      leave(inboxChannelName);
      inboxChannel = null;
      inboxChannelName = null;
    }
    if (presenceChannelName) {
      leave(presenceChannelName);
      presenceChannelName = null;
      presenceSubscribed = false;
    }
  };

  const checkAllSubscriptions = () => {
    const connected = echo.connector?.pusher?.connection?.state === "connected";
    return {
      echoConnected: connected,
      inboxSubscribed: !!inboxChannel,
      presenceSubscribed,
    };
  };

  return {
    subscribeInbox,
    subscribeActiveChatTyping,
    unsubscribeActiveChatTyping,
    subscribePresence,
    cleanup,
    checkAllSubscriptions,
  };
}

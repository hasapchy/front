<template>
  <div class="h-[calc(100vh-6rem)] flex overflow-hidden rounded-2xl border border-gray-200 bg-white">
    <ChatSidebar
      :search="search"
      :chats="allChatsList"
      :selected-chat-id="selectedChatId"
      :has-chats-view="hasChatsView"
      @update:search="search = $event"
      @select-chat="selectItem"
      @create-group="showCreateGroupModal = true"
    />
    
    <div class="flex-1 min-w-0 flex flex-col">
      <ChatHeader
        :chat="selectedChat"
        :peer-user="activePeerUser"
        :presence-status-text="presenceStatusText"
        @delete-chat="confirmDeleteChat"
      />
      
      <MessagesContainer
        ref="messagesContainer"
        :chat="selectedChat"
        :messages="messageGroups"
        :loading="loadingMessages"
        :loading-older="loadingOlderMessages"
        :has-unread="hasUnreadMessages"
        @load-more="onMessagesScroll"
        @open-image="openImageModal"
        @message-context-menu="showMessageMenu"
      />
      
      <MessageComposer
        ref="composer"
        :chat="selectedChat"
        :draft="draft"
        :replying-to="replyingTo"
        :editing-message="editingMessage"
        :selected-files="selectedFiles"
        :is-recording-audio="isRecordingAudio"
        :audio-recording-time="audioRecordingTime"
        :can-write="canWrite"
        :sending="sending"
        @update:draft="draft = $event"
        @send="send"
        @cancel-edit="cancelEdit"
        @save-edit="saveEdit"
        @toggle-audio-recording="toggleAudioRecording"
        @attach-files="openFilePicker"
        @cancel-reply="replyingTo = null"
      />
    </div>
    
    <!-- Модальные окна -->
    <CreateGroupModal
      v-if="showCreateGroupModal"
      :users="usersForCompany"
      :group-title="groupTitle"
      :selected-user-ids="selectedUserIds"
      :creating-group="creatingGroup"
      @close="closeCreateGroupModal"
      @update:group-title="groupTitle = $event"
      @toggle-user-selection="toggleUserSelection"
      @create="createGroupChat"
    />
    
    <DeleteConfirmModal
      v-if="showDeleteConfirm"
      :chat="selectedChat"
      :deleting="deletingChat"
      @close="showDeleteConfirm = false"
      @confirm="deleteChat"
    />
    
    <ForwardModal
      v-if="showForwardModal"
      :chats="allChatsList"
      :selected-chat-id="selectedChatId"
      :forward-target="forwardTarget"
      :forward-text="forwardText"
      :forwarding-sending="forwardingSending"
      @close="closeForwardModal"
      @select-target="selectForwardTarget"
      @update:text="forwardText = $event"
      @send="sendForward"
    />
    
    <ImageModal
      v-if="showImageModal"
      :image="selectedImage"
      @close="closeImageModal"
    />
    
    <MessageContextMenu
      v-if="messageMenuVisible"
      :message="messageMenuTarget"
      :position="{ x: messageMenuX, y: messageMenuY }"
      :is-my-message="isMyMessage(messageMenuTarget)"
      @close="closeMessageMenu"
      @reply="replyToMessage"
      @forward="forwardMessage"
      @edit="editMessage"
      @delete="deleteMessage"
    />
  </div>
</template>

<script>
import ChatSidebar from './components/ChatSidebar.vue'
import ChatHeader from './components/ChatHeader.vue'
import MessagesContainer from './components/MessagesContainer.vue'
import MessageComposer from './components/MessageComposer.vue'
import CreateGroupModal from './components/modals/CreateGroupModal.vue'
import DeleteConfirmModal from './components/modals/DeleteConfirmModal.vue'
import ForwardModal from './components/modals/ForwardModal.vue'
import ImageModal from './components/modals/ImageModal.vue'
import MessageContextMenu from './components/MessageContextMenu.vue'

// Утилиты
import { buildStorageUrl, parseDateSafe, extractHHmm } from './components/utils/helpers'
import { isMyMessage, getMessageUser, getUserInitials, isImageFile, isAudioFile } from './components/utils/messageUtils'
import { formatDayLabel, formatChatTime, messageTime } from './components/utils/dateFormatters'

// Сервисы
import ChatController from "@/api/ChatController"
import { applySentMessage, handleChatReadEvent, handleIncomingChatEvent } from "@/services/messengerFacade"
import globalChatRealtime from "@/services/globalChatRealtime"
import { eventBus } from "@/eventBus"

export default {
  name: 'Messenger',
  components: {
    ChatSidebar,
    ChatHeader,
    MessagesContainer,
    MessageComposer,
    CreateGroupModal,
    DeleteConfirmModal,
    ForwardModal,
    ImageModal,
    MessageContextMenu
  },
  
  data() {
    return {
      search: "",
      chats: [],
      loadingChats: false,
      selectedChat: null,
      selectedChatId: null,
      generalChat: null,
      activePeerUser: null,
      messages: [],
      loadingMessages: false,
      loadingOlderMessages: false,
      hasMoreMessages: true,
      draft: "",
      selectedFiles: [],
      sending: false,
      replyingTo: null,
      editingMessage: null,
      audioBlob: null,
      isRecordingAudio: false,
      audioRecordingTime: 0,
      audioRecordingInterval: null,
      mediaRecorder: null,
      onlineUserIds: [],
      peerReadByChatId: {},
      showCreateGroupModal: false,
      groupTitle: "",
      selectedUserIds: [],
      creatingGroup: false,
      showDeleteConfirm: false,
      deletingChat: false,
      messageMenuVisible: false,
      messageMenuX: 0,
      messageMenuY: 0,
      messageMenuTarget: null,
      showForwardModal: false,
      forwardingMessage: null,
      forwardTarget: null,
      forwardText: "",
      forwardingSending: false,
      showImageModal: false,
      selectedImage: null,
    }
  },
  
  computed: {
    hasChatsView() {
      return this.$store.getters.hasPermission("chats_view_all")
    },
    canWrite() {
      return this.$store.getters.hasPermission("chats_write")
    },
    usersForCompany() {
      return this.$store.getters.usersForCurrentCompany || []
    },
    filteredUsers() {
      const q = (this.search || "").trim().toLowerCase()
      const users = this.usersForCompany.filter((u) => u && u.id !== this.$store.state.user?.id)
      
      if (!q) return users
      return users.filter((u) => {
        const s = `${u.name || ""} ${u.surname || ""} ${u.email || ""}`.toLowerCase()
        return s.includes(q)
      })
    },
    allChatsList() {
      const list = []
      const q = (this.search || "").trim().toLowerCase()
      
      // Add general chat
      if (this.generalChat) {
        if (!q || this.generalChat.title?.toLowerCase().includes(q)) {
          list.push({ ...this.generalChat, type: 'general' })
        }
      }
      
      // Add direct chats (from chats list)
      const directChats = (this.chats || []).filter(c => c.type === 'direct')
      directChats.forEach(chat => {
        const peerId = this.getPeerUserId(chat)
        if (peerId) {
          const user = this.usersForCompany.find(u => Number(u.id) === Number(peerId))
          if (user) {
            const title = `${user.name} ${user.surname || ""}`.trim()
            if (!q || title.toLowerCase().includes(q) || user.email?.toLowerCase().includes(q)) {
              list.push({
                ...chat,
                type: 'user',
                ...user,
                displayTitle: title,
                chat_id: chat.id,
              })
            }
          }
        }
      })
      
      // Add group chats
      const groupChats = (this.chats || []).filter(c => c.type === 'group')
      groupChats.forEach(chat => {
        if (!q || chat.title?.toLowerCase().includes(q)) {
          list.push({ ...chat, type: 'group' })
        }
      })
      
      // Add users without direct chats
      this.filteredUsers.forEach(user => {
        const hasDirectChat = list.some(item => item.type === 'user' && Number(item.id) === Number(user.id))
        if (!hasDirectChat) {
          list.push({
            ...user,
            type: 'user',
            id: user.id,
            displayTitle: `${user.name} ${user.surname || ""}`.trim(),
          })
        }
      })
      
      // Sort by last_message_at
      return list.sort((a, b) => {
        const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0
        const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0
        return bTime - aTime
      })
    },
    messageGroups() {
      if (!this.messages || this.messages.length === 0) return []
      
      const groups = []
      let currentGroup = null
      
      this.messages.forEach((message) => {
        const messageDate = parseDateSafe(message.created_at || message.createdAt)
        const dateObj = messageDate || new Date()
        const day = new Date(dateObj)
        day.setHours(0, 0, 0, 0)
        const dayTime = day.getTime()
        
        if (!currentGroup || currentGroup.date.getTime() !== dayTime) {
          currentGroup = {
            id: `date-${dayTime}`,
            date: day,
            dateLabel: formatDayLabel(day, this.$i18n),
            messages: []
          }
          groups.push(currentGroup)
        }
        
        currentGroup.messages.push(message)
      })
      
      return groups
    },
    presenceStatusText() {
      if (!this.selectedChat) return "Выберите сотрудника или общий чат слева"
      if (this.selectedChat.type === "direct" && this.activePeerUser) {
        return this.isUserOnline(this.activePeerUser) ? "Онлайн" : "Оффлайн"
      }
      return "Онлайн"
    },
    hasUnreadMessages() {
      if (!this.selectedChat || !this.messages.length) return false
      const myId = this.$store.state.user?.id
      if (!myId) return false
      return false
    },
    canCreateGroup() {
      return (
        !this.creatingGroup &&
        this.groupTitle.trim().length > 0 &&
        this.selectedUserIds.length > 0
      )
    },
    showDeleteButton() {
      return this.selectedChat && this.isChatCreator(this.selectedChat)
    },
  },
  
  watch: {
    '$store.getters.currentCompanyId': {
      handler(newCompanyId, oldCompanyId) {
        if (newCompanyId && newCompanyId !== oldCompanyId) {
          this.handleCompanyChange()
        }
      }
    }
  },
  
  async mounted() {
    try {
      await this.ensureUsersLoaded()
      await this.loadChats()
      
      this.onlineUserIds = globalChatRealtime.getOnlineUserIds()
      this.setupEventListeners()
      
      setTimeout(() => {
        this.checkWebSocketStatus()
      }, 2000)
    } catch (error) {
      console.error("[Messenger] Ошибка при инициализации:", error)
      this.$store.dispatch("showNotification", {
        title: "Ошибка загрузки чата",
        subtitle: error?.message || "Попробуйте обновить страницу",
        isDanger: true,
        duration: 5000,
      })
    }
  },
  
  beforeUnmount() {
    this.removeEventListeners()
    this.onlineUserIds = []
  },
  
  methods: {
    setupEventListeners() {
      console.log("[MessengerPage] 🔗 Подписка на события eventBus...");
      // Подписываемся на события чатов через eventBus
      eventBus.on("chat:message", this.handleIncomingMessage);
      eventBus.on("chat:message:updated", this.handleMessageUpdated);
      eventBus.on("chat:message:deleted", this.handleMessageDeleted);
      eventBus.on("chat:read", this.handleReadEvent);
      eventBus.on("presence:here", this.handlePresenceHere);
      eventBus.on("presence:joining", this.handlePresenceJoining);
      eventBus.on("presence:leaving", this.handlePresenceLeaving);
      console.log("[MessengerPage] ✅ Подписка на события завершена");
    },
    removeEventListeners() {
      // Отписываемся от событий
      eventBus.off("chat:message", this.handleIncomingMessage);
      eventBus.off("chat:message:updated", this.handleMessageUpdated);
      eventBus.off("chat:message:deleted", this.handleMessageDeleted);
      eventBus.off("chat:read", this.handleReadEvent);
      eventBus.off("presence:here", this.handlePresenceHere);
      eventBus.off("presence:joining", this.handlePresenceJoining);
      eventBus.off("presence:leaving", this.handlePresenceLeaving);
    },
    handleIncomingMessage(event) {
      console.log("[MessengerPage] 📬 handleIncomingMessage вызван:", {
        chat_id: event?.chat_id,
        user: event?.user?.name,
      });
      handleIncomingChatEvent(this, event);
    },
    handleMessageUpdated(event) {
      console.log("[MessengerPage] ✏️ Сообщение обновлено:", event);
      
      const messageId = Number(event?.id);
      if (!messageId) return;

      // Обновляем сообщение в текущем списке
      this.messages = (this.messages || []).map((m) => {
        if (Number(m.id) !== messageId) return m;
        return {
          ...m,
          body: event.body,
          is_edited: event.is_edited,
          edited_at: event.edited_at,
          updated_at: event.updated_at,
        };
      });

      // Обновляем last_message в списке чатов, если это последнее сообщение
      const chatId = Number(event?.chat_id);
      if (chatId) {
        this.chats = (this.chats || []).map((c) => {
          if (Number(c.id) !== chatId) return c;
          if (c.last_message && Number(c.last_message.id) === messageId) {
            return {
              ...c,
              last_message: {
                ...c.last_message,
                body: event.body,
                is_edited: event.is_edited,
              },
            };
          }
          return c;
        });

        if (this.generalChat && Number(this.generalChat.id) === chatId) {
          if (this.generalChat.last_message && Number(this.generalChat.last_message.id) === messageId) {
            this.generalChat = {
              ...this.generalChat,
              last_message: {
                ...this.generalChat.last_message,
                body: event.body,
                is_edited: event.is_edited,
              },
            };
          }
        }
      }
    },
    handleMessageDeleted(event) {
      console.log("[MessengerPage] 🗑️ Сообщение удалено:", event);
      
      const messageId = Number(event?.id);
      if (!messageId) return;

      // Удаляем сообщение из текущего списка
      this.messages = (this.messages || []).filter((m) => Number(m.id) !== messageId);
    },
    handleReadEvent(event) {
      handleChatReadEvent(this, event);
    },
    handlePresenceHere(users) {
      const ids = (users || []).map((u) => Number(u.id)).filter((id) => !Number.isNaN(id));
      this.onlineUserIds = [...ids];
    },
    handlePresenceJoining(user) {
      const id = Number(user?.id);
      if (Number.isNaN(id)) return;
      if (!this.onlineUserIds.includes(id)) {
        this.onlineUserIds = [...this.onlineUserIds, id];
      }
    },
    handlePresenceLeaving(user) {
      const id = Number(user?.id);
      if (Number.isNaN(id)) return;
      this.onlineUserIds = this.onlineUserIds.filter((uid) => uid !== id);
    },
    checkWebSocketStatus() {
      const status = globalChatRealtime.getStatus();
      return status || null;
    },
    async handleCompanyChange() {
      try {
        // Clear current data
        this.chats = [];
        this.generalChat = null;
        this.messages = [];
        this.selectedChat = null;
        this.selectedChatId = null;
        this.activePeerUser = null;

        // Reload users for new company
        await this.ensureUsersLoaded();

        // Reload chats for new company
        await this.loadChats();

        // Reinitialize WebSocket connections for new company
        await globalChatRealtime.reinitialize();
      } catch (error) {
        console.error('[Messenger] Ошибка смены компании:', error);
        this.$store.dispatch("showNotification", {
          title: "Ошибка смены компании",
          subtitle: "Не удалось загрузить данные для новой компании",
          isDanger: true,
          duration: 5000,
        });
      }
    },
    async ensureUsersLoaded() {
      // Для мессенджера всегда загружаем пользователей, чтобы получить актуальный список
      // Очищаем state перед загрузкой, чтобы гарантировать свежие данные
      try {
        // Очищаем пользователей в state, чтобы принудительно загрузить заново
        this.$store.commit("SET_USERS", []);
        
        // Загружаем пользователей
        await this.$store.dispatch("loadUsers");
        
      } catch (e) {
        console.error("[Messenger] Ошибка загрузки пользователей:", e);
      }
    },
    async loadChats() {
      if (!this.hasChatsView) return;
      this.loadingChats = true;
      const prevGeneral = this.generalChat;
      try {
        const items = await ChatController.getChats();
        this.chats = Array.isArray(items) ? items : [];
        const foundGeneral = this.chats.find((c) => c && c.type === "general") || null;
        this.generalChat = foundGeneral || prevGeneral || null;

        // Initialize peer read state for direct chats (non-breaking extra fields from backend)
        const peerMap = {};
        (this.chats || []).forEach((c) => {
          if (c && c.type === "direct" && c.id) {
            const peerId = Number(c.peer_last_read_message_id || 0);
            if (peerId) peerMap[Number(c.id)] = peerId;
          }
        });
        this.peerReadByChatId = { ...this.peerReadByChatId, ...peerMap };

        // НЕ синхронизируем здесь - глобальный сервис уже подписан на все чаты при инициализации
        // Синхронизация нужна только при создании нового чата
      } finally {
        this.loadingChats = false;
      }
    },

    // NOTE: updateChatLastMessage/incrementUnreadCount/applyLocalMessageMeta
    // logic moved to src/services/chatState.js to keep MessengerPage thin.

    chatTitle(chat) {
      // Для direct чатов используем имя пользователя из activePeerUser
      if (chat?.type === "direct" && this.activePeerUser) {
        const u = this.activePeerUser;
        return `${u.name || ""} ${u.surname || ""}`.trim() || "Личный чат";
      }
      // Для групповых чатов используем title из данных чата
      if (chat?.type === "group") {
        return chat.title || `Групповой чат #${chat.id}`;
      }
      // Для general чата
      if (chat?.type === "general") {
        return chat.title || "Общий чат";
      }
      // Fallback
      return chat.title || chat.name || `Chat #${chat.id}`;
    },
    chatIcon(chat) {
      if (chat.type === "general") return "fa-globe";
      if (chat.type === "direct") return "fa-user";
      return "fa-users";
    },
    isUserOnline(u) {
      if (!u || !u.id) return false;
      // Используем глобальный сервис для проверки онлайн статуса
      return globalChatRealtime.isUserOnline(u.id) || this.onlineUserIds.includes(Number(u.id));
    },
  
    async selectChat(chat) {
      // Убеждаемся, что у нас есть полная информация о чате из списка
      let fullChat = chat;
      if (chat && chat.id) {
        // Ищем полную информацию о чате в списке чатов
        const foundChat = this.chats.find(c => Number(c.id) === Number(chat.id));
        if (foundChat) {
          // Объединяем данные, приоритет отдаём найденному чату (более полные данные)
          fullChat = { ...foundChat, ...chat };
        }
        
      }
      
      this.selectedChat = fullChat;
      this.selectedChatId = fullChat.id;
      this.messages = [];
      this.hasMoreMessages = true;
      
      // Очищаем activePeerUser для не-direct чатов
      if (fullChat.type !== 'direct') {
        this.activePeerUser = null;
      }
      
      // Сбрасываем unread_count для открытого чата
      if (fullChat) {
        this.chats = (this.chats || []).map((c) => {
          if (c && Number(c.id) === Number(fullChat.id)) {
            return { ...c, unread_count: 0 };
          }
          return c;
        });
        
        if (this.generalChat && Number(this.generalChat.id) === Number(fullChat.id)) {
          this.generalChat = { ...this.generalChat, unread_count: 0 };
        }
        
        // Уведомляем другие компоненты об обновлении счетчика
        eventBus.emit("chat:unread-updated", { chatId: fullChat.id, unreadCount: 0 });
      }
      
      try {
        // Сразу помечаем все сообщения как прочитанные (не ждём загрузки)
        // Передаём null чтобы сервер сам нашёл последнее сообщение в чате
        await this.markAsRead(fullChat.id, null);
        
        // Загружаем сообщения
        await this.loadMessages(fullChat.id);
        
        // Финальная прокрутка после всех операций
        await this.$nextTick();
        setTimeout(() => {
          this.scrollToBottom();
        }, 200);
      } catch (e) {
        console.error("[Messenger] Ошибка при выборе чата:", e);
      }
    },

    async markAsRead(chatId, messageId = null) {
      if (!chatId) return;
      
      try {
        // Если messageId не передан, используем последнее загруженное сообщение
        // Если и его нет - передаём null (сервер найдёт последнее сообщение в чате сам)
        let finalMessageId = messageId;
        if (finalMessageId === null && this.messages.length > 0) {
          const lastMessage = this.messages[this.messages.length - 1];
          finalMessageId = lastMessage?.id || null;
        }
        
        await ChatController.markAsRead(chatId, finalMessageId);
      } catch (e) {
        console.error("[Messenger] Ошибка при отметке как прочитано:", e);
      }
    },

    messageTicks(m) {
      // Only for my messages: ✓ if peer hasn't read yet; ✓✓ if peer read id >= message id
      if (!this.isMyMessage(m)) return "";
      const chatId = Number(m?.chat_id || m?.chatId || this.selectedChatId);
      const peerReadId = Number(this.peerReadByChatId?.[chatId] || 0);
      const msgId = Number(m?.id || 0);
      if (!chatId || !msgId) return "✓";
      return peerReadId >= msgId ? "✓✓" : "✓";
    },

    chatLastTicks(item) {
      // Left list: show ✓/✓✓ only if last message is mine and chat is direct
      const msg = item?.last_message;
      if (!msg || !this.isMyMessageInChat(item)) return "";
      const chatId = Number(item?.chat_id || msg?.chat_id || item?.id);
      const peerReadId = Number(this.peerReadByChatId?.[chatId] || item?.peer_last_read_message_id || 0);
      const msgId = Number(msg?.id || 0);
      if (!chatId || !msgId) return "✓";
      return peerReadId >= msgId ? "✓✓" : "✓";
    },
    openGeneralChat() {
      this.activePeerUser = null;
      const open = async () => {
        try {
          // Явно запросим/создадим общий чат
          const chat = await ChatController.ensureGeneralChat();
          if (chat) {
            this.generalChat = chat;
            // Если в списке не было — добавим
            const exists = (this.chats || []).some((c) => Number(c.id) === Number(chat.id));
            if (!exists) {
              this.chats = [...(this.chats || []), chat];
            }
            await this.selectChat(chat);
            return;
          }
        } catch (e) {
          // fallthrough to notification
        }

        // если по какой-то причине общий чат не найден
        this.$store.dispatch("showNotification", {
          title: "Общий чат не найден",
          subtitle: "Попробуйте обновить страницу",
          isDanger: false,
          duration: 4000,
        });
        this.selectedChat = null;
        this.selectedChatId = null;
        this.messages = [];
      };
      open();
    },
    async loadMessages(chatId) {
      this.loadingMessages = true;
      this.hasMoreMessages = true;
      try {
        // Загружаем только последние 50 сообщений
        const items = await ChatController.getMessages(chatId, { limit: 50, tail: true });
        this.messages = Array.isArray(items) ? items : [];
        
        // Если получили меньше 50, значит больше сообщений нет
        this.hasMoreMessages = items.length >= 50;
        
        // Ждем завершения загрузки и обновления DOM
        await this.$nextTick();
        this.loadingMessages = false;
        
        // Прокручиваем после того, как loadingMessages стал false
        await this.$nextTick();
        this.scrollToBottom();
      } catch (e) {
        this.messages = [];
        this.loadingMessages = false;
        this.hasMoreMessages = false;
        this.$store.dispatch("showNotification", {
          title: "Не удалось загрузить сообщения",
          subtitle: e?.message || "",
          isDanger: true,
          duration: 3000,
        });
      }
    },

    async loadOlderMessages() {
      if (this.loadingOlderMessages || !this.hasMoreMessages || !this.selectedChatId || this.messages.length === 0) {
        return;
      }

      this.loadingOlderMessages = true;
      try {
        const firstMessage = this.messages[0];
        const beforeId = firstMessage?.id;
        
        if (!beforeId) {
          this.loadingOlderMessages = false;
          return;
        }

        const items = await ChatController.getMessages(this.selectedChatId, { 
          before_id: beforeId, 
          limit: 30 
        });
        
        if (Array.isArray(items) && items.length > 0) {
          // Добавляем в начало массива
          this.messages = [...items, ...this.messages];
          
          // Если получили меньше 30, значит больше сообщений нет
          this.hasMoreMessages = items.length >= 30;
        } else {
          this.hasMoreMessages = false;
        }
      } catch (e) {
        console.error("[Messenger] Ошибка загрузки старых сообщений:", e);
      } finally {
        this.loadingOlderMessages = false;
      }
    },

    onMessagesScroll(event) {
      const el = event.target;
      // Если пользователь скроллит вверх и находится близко к началу списка
      if (el.scrollTop < 200 && this.hasMoreMessages && !this.loadingOlderMessages) {
        const oldHeight = el.scrollHeight;
        this.loadOlderMessages().then(() => {
          // Сохраняем позицию скролла после загрузки
          this.$nextTick(() => {
            const newHeight = el.scrollHeight;
            el.scrollTop = newHeight - oldHeight + el.scrollTop;
          });
        });
      }
    },

    // subscribeToChat/unsubscribeFromChat moved to src/services/chatRealtime.js (we keep all-chats subscriptions synced)
    scrollToBottom() {
      const el = this.$refs.messagesWrap;
      if (!el) return;
      
      const scroll = () => {
        if (el.scrollHeight !== undefined) el.scrollTop = el.scrollHeight;
      };

      // Несколько попыток (DOM/изображения/рефлоу)
      [0, 100, 300].forEach((ms) => setTimeout(scroll, ms));
    },
    isMyMessage(m) {
      const myId = this.$store.state.user?.id;
      const userId = m.user_id || m.userId || m.user?.id;
      return myId && userId && Number(myId) === Number(userId);
    },
    messageTime(m) {
      const raw = m.created_at || m.createdAt || null;
      return extractHHmm(raw);
    },
    userPhotoUrl(path) {
      return buildStorageUrl(path);
    },
    fileUrl(path) {
      return buildStorageUrl(path);
    },
    onFilesSelected(e) {
      const files = Array.from(e.target.files || []);
      this.selectedFiles = files;
      e.target.value = ''; // Reset input
    },
    onAudioSelected(e) {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        this.selectedFiles = [...this.selectedFiles, ...files];
      }
      e.target.value = ''; // Reset input
    },
    async toggleAudioRecording() {
      if (this.isRecordingAudio) {
        this.stopAudioRecording();
      } else {
        await this.startAudioRecording();
      }
    },
    async startAudioRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        const chunks = [];

        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        this.mediaRecorder.onstop = () => {
          this.audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const audioFile = new File([this.audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
          this.selectedFiles = [...this.selectedFiles, audioFile];
          this.audioBlob = null;
          
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
        };

        this.mediaRecorder.start();
        this.isRecordingAudio = true;
        this.audioRecordingTime = 0;
        this.audioRecordingInterval = setInterval(() => {
          this.audioRecordingTime++;
        }, 1000);
      } catch (error) {
        console.error('Error starting audio recording:', error);
        this.$store.dispatch("showNotification", {
          title: "Ошибка записи аудио",
          subtitle: "Не удалось получить доступ к микрофону",
          isDanger: true,
          duration: 3000,
        });
      }
    },
    stopAudioRecording() {
      if (this.mediaRecorder && this.isRecordingAudio) {
        this.mediaRecorder.stop();
        this.isRecordingAudio = false;
        if (this.audioRecordingInterval) {
          clearInterval(this.audioRecordingInterval);
          this.audioRecordingInterval = null;
        }
      }
    },
    isImageFile(file) {
      const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
      return imageTypes.includes(file.mime_type) || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file.name || '');
    },
    isAudioFile(file) {
      const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/webm'];
      return audioTypes.includes(file.mime_type) || /\.(mp3|wav|ogg|m4a|webm)$/i.test(file.name || '');
    },
    async send() {
      if (!this.selectedChatId) return;
      if (!this.canWrite) return;
      if (!this.draft.trim() && this.selectedFiles.length === 0) return;

      this.sending = true;
      try {
        const msg = await ChatController.sendMessage(this.selectedChatId, {
          body: this.draft,
          files: this.selectedFiles,
          parent_id: this.replyingTo?.id || null,
        });

        if (msg) {
          this.draft = "";
          this.selectedFiles = [];
          this.replyingTo = null;
          this.audioBlob = null;
          // моментально обновим метаданные чата для отправителя
          applySentMessage(this, msg);
        } else {
          await this.loadMessages(this.selectedChatId);
        }
      } finally {
        this.sending = false;
      }
    },
    showMessageMenu(event, message) {
      this.messageMenuTarget = message;
      this.messageMenuX = event.clientX;
      this.messageMenuY = event.clientY;
      this.messageMenuVisible = true;
    },
    closeMessageMenu() {
      this.messageMenuVisible = false;
      this.messageMenuTarget = null;
    },
    replyToMessage(message) {
      this.replyingTo = message;
      this.closeMessageMenu();
      this.$refs.composerTextarea?.focus();
    },
    editMessage(message) {
      this.editingMessage = message;
      this.draft = message.body || '';
      this.closeMessageMenu();
    },
    cancelEdit() {
      this.editingMessage = null;
      this.draft = '';
    },
    async saveEdit() {
      if (!this.editingMessage || !this.draft.trim()) return;
      
      try {
        const updatedMessage = await ChatController.updateMessage(this.selectedChatId, this.editingMessage.id, this.draft);
        
        console.log("[MessengerPage] 📝 Ответ API после редактирования:", {
          id: updatedMessage.id,
          body: updatedMessage.body,
          is_edited: updatedMessage.is_edited,
          edited_at: updatedMessage.edited_at,
        });
        
        // Обновляем сообщение локально с принудительной установкой is_edited
        const messageId = Number(this.editingMessage.id);
        this.messages = (this.messages || []).map((m) => {
          if (Number(m.id) !== messageId) return m;
          
          console.log("[MessengerPage] 🔄 Обновляем сообщение:", {
            old_is_edited: m.is_edited,
            new_is_edited: updatedMessage.is_edited,
          });
          
          return {
            ...m,
            body: updatedMessage.body,
            is_edited: true, // Принудительно устанавливаем true
            edited_at: updatedMessage.edited_at,
            updated_at: updatedMessage.updated_at,
          };
        });

        // Обновляем last_message в списке чатов
        const chatId = Number(this.selectedChatId);
        this.chats = (this.chats || []).map((c) => {
          if (Number(c.id) !== chatId) return c;
          if (c.last_message && Number(c.last_message.id) === Number(this.editingMessage.id)) {
            return {
              ...c,
              last_message: {
                ...c.last_message,
                body: updatedMessage.body,
                is_edited: updatedMessage.is_edited,
              },
            };
          }
          return c;
        });

        if (this.generalChat && Number(this.generalChat.id) === chatId) {
          if (this.generalChat.last_message && Number(this.generalChat.last_message.id) === Number(this.editingMessage.id)) {
            this.generalChat = {
              ...this.generalChat,
              last_message: {
                ...this.generalChat.last_message,
                body: updatedMessage.body,
                is_edited: updatedMessage.is_edited,
              },
            };
          }
        }
        
        this.editingMessage = null;
        this.draft = '';
      } catch (error) {
        console.error("[MessengerPage] Ошибка редактирования:", error);
        this.$store.dispatch("showNotification", {
          title: "Ошибка",
          subtitle: error?.message || "Не удалось отредактировать сообщение",
          isDanger: true,
          duration: 3000,
        });
      }
    },
    async deleteMessage(message) {
      if (!confirm('Вы уверены, что хотите удалить это сообщение?')) return;
      
      try {
        await ChatController.deleteMessage(this.selectedChatId, message.id);
        // Remove message from local array
        this.messages = this.messages.filter(m => m.id !== message.id);
        this.closeMessageMenu();
      } catch (error) {
        this.$store.dispatch("showNotification", {
          title: "Ошибка",
          subtitle: error?.message || "Не удалось удалить сообщение",
          isDanger: true,
          duration: 3000,
        });
      }
    },
    forwardMessage(message) {
      this.forwardingMessage = message;
      this.forwardTarget = null;
      this.forwardText = "";
      this.forwardingSending = false;
      this.showForwardModal = true;
      this.closeMessageMenu();
    },
    closeForwardModal() {
      this.showForwardModal = false;
      this.forwardingMessage = null;
      this.forwardTarget = null;
      this.forwardText = "";
      this.forwardingSending = false;
    },
    selectForwardTarget(target) {
      this.forwardTarget = target;
    },
    async sendForward() {
      if (!this.forwardingMessage || !this.forwardTarget) return;
      if (!this.selectedChatId) return;

      this.forwardingSending = true;
      try {
        let targetChatId = null;
        const target = this.forwardTarget;

        // If target is a user (direct chat), we might need to create/get the chat first
        if (target.type === 'user') {
          if (target.chat_id) {
            targetChatId = target.chat_id;
          } else {
            const chat = await ChatController.startDirectChat(target.id);
            if (chat && chat.id) {
              targetChatId = chat.id;
              const exists = this.chats.find(c => Number(c.id) === Number(chat.id));
              if (!exists) {
                this.chats.push(chat);
              }
            }
          }
        } else {
          targetChatId = target.id;
        }

        if (!targetChatId) {
          throw new Error("Не удалось определить чат для пересылки");
        }

        // Telegram-like: отправляем сначала ваш текст (если есть), потом пересланное
        const extra = (this.forwardText || "").trim();
        if (extra) {
          await ChatController.sendMessage(targetChatId, { body: extra, files: [], parent_id: null });
        }

        await ChatController.forwardMessage(this.selectedChatId, this.forwardingMessage.id, targetChatId);

        this.$store.dispatch('showNotification', {
          title: 'Успешно',
          subtitle: 'Сообщение переслано',
          isDanger: false,
          duration: 2000
        });

        this.closeForwardModal();
      } catch (error) {
        console.error("Forward error:", error);
        this.$store.dispatch("showNotification", {
          title: "Ошибка",
          subtitle: error?.message || "Не удалось переслать сообщение",
          isDanger: true,
          duration: 3000,
        });
      } finally {
        this.forwardingSending = false;
      }
    },
    openImageModal(file) {
      this.selectedImage = file;
      this.showImageModal = true;
    },
    closeImageModal() {
      this.showImageModal = false;
      this.selectedImage = null;
    },

    async openDirect(user) {
      if (!this.hasChatsView) return;
      try {
        const chat = await ChatController.startDirectChat(user.id);
        if (!chat) return;
        this.activePeerUser = user;
        
        // если чата ещё нет в списке, добавим
        const exists = (this.chats || []).some((c) => Number(c.id) === Number(chat.id));
        if (!exists) {
          this.chats = [...(this.chats || []), chat];
        }
        await this.selectChat(chat);
      } catch (e) {
        // ignore
      }
    },
    parseDate(dateString) {
      return parseDateSafe(dateString);
    },
    formatDayLabel(date) {
      if (!date) return this.$t('today');
      const dateObj = date instanceof Date ? date : new Date(date);
      if (Number.isNaN(dateObj.getTime())) return this.$t('today');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const messageDay = new Date(dateObj);
      messageDay.setHours(0, 0, 0, 0);

      const diffTime = today - messageDay;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      const locale = this.$i18n.locale || 'ru';
      
      if (diffDays === 0) return this.$t('today');
      if (diffDays === 1) return this.$t('yesterday');
      if (diffDays === 2) return this.$t('dayBeforeYesterday');
      
      // For days within a week, use localized weekday
      if (diffDays < 7) {
        const localeMap = { ru: 'ru-RU', en: 'en-US', tm: 'tk-TM' };
        const dateLocale = localeMap[locale] || 'ru-RU';
        return dateObj.toLocaleDateString(dateLocale, { weekday: "long" });
      }
      
      // For older dates, use full date format
      const localeMap = { ru: 'ru-RU', en: 'en-US', tm: 'tk-TM' };
      const dateLocale = localeMap[locale] || 'ru-RU';
      return dateObj.toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" });
    },
    getItemTitle(item) {
      if (item.type === 'user') {
        return item.displayTitle || `${item.name || ""} ${item.surname || ""}`.trim() || "Пользователь";
      }
      return item.title || item.name || (item.type === 'general' ? "Общий чат" : `Чат #${item.id}`);
    },
    getItemPreview(item) {
      if (item.last_message?.body) {
        return item.last_message.body;
      }
      if (item.type === 'user') {
        return item.position || "Сотрудник";
      }
      return "";
    },
    formatChatTime(item) {
      const raw = item.last_message_at || item.last_message?.created_at;
      if (!raw) return "";
      
      const date = this.parseDate(raw);
      if (!date) return extractHHmm(raw);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const messageDay = new Date(date);
      messageDay.setHours(0, 0, 0, 0);

      const diffTime = today - messageDay;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      const locale = this.$i18n.locale || 'ru';
      const localeMap = { ru: 'ru-RU', en: 'en-US', tm: 'tk-TM' };
      const dateLocale = localeMap[locale] || 'ru-RU';

      if (diffDays === 0) return extractHHmm(raw);
      if (diffDays === 1) return this.$t('yesterday');
      if (diffDays < 7) return date.toLocaleDateString(dateLocale, { weekday: "short", day: "numeric", month: "short" });
      return date.toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" });
    },
    getUserInitials(user) {
      if (!user) return "";
      const name = (user.name || "").charAt(0).toUpperCase();
      const surname = (user.surname || "").charAt(0).toUpperCase();
      return (name + surname) || "?";
    },
    getMessageUser(message) {
      if (!message) return null;
      // Check if message has user object directly
      if (message.user && message.user.id) {
        const userId = message.user.id;
        const currentUser = this.$store.state.user;
        if (currentUser && Number(currentUser.id) === Number(userId)) {
          return currentUser;
        }
        const users = this.usersForCompany || [];
        return users.find(u => u && Number(u.id) === Number(userId)) || message.user;
      }
      
      const userId = message.user_id || message.userId || message.user?.id;
      if (!userId) return null;
      
      // Проверяем, это текущий пользователь?
      const currentUser = this.$store.state.user;
      if (currentUser && Number(currentUser.id) === Number(userId)) {
        return currentUser;
      }
      
      // Ищем пользователя в списке пользователей компании
      const users = this.usersForCompany || [];
      return users.find(u => u && Number(u.id) === Number(userId)) || null;
    },
    getMessageUserName(message) {
      const user = this.getMessageUser(message);
      if (!user) {
        // Fallback: если пользователь не найден, показываем user_id
        const userId = message.user_id || message.userId || message.user?.id;
        return userId ? `Пользователь #${userId}` : "Неизвестный";
      }
      const name = user.name || "";
      const surname = user.surname || "";
      return `${name} ${surname}`.trim() || user.displayTitle || "Пользователь";
    },
    getForwardedUserName(forwardedMessage) {
      // forwardedMessage - это объект из forwarded_from, который содержит user
      if (!forwardedMessage) return "Неизвестный";
      
      const user = forwardedMessage.user;
      if (!user) {
        return "Неизвестный";
      }
      
      const name = user.name || "";
      const surname = user.surname || "";
      return `${name} ${surname}`.trim() || "Пользователь";
    },
    getMessageUserInitials(message) {
      const user = this.getMessageUser(message);
      if (!user) {
        const userId = message.user_id || message.userId || message.user?.id;
        return userId ? String(userId).charAt(0) : "?";
      }
      return this.getUserInitials(user);
    },
    shouldShowAvatarInGroup(message, index, groupMessages) {
      // If it's the last message in the group, we show avatar (unless it's the same user as next group? No, user logic is per-message)
      // Actually we only group by date.
      
      // If index is last in this group: 
      // Theoretically the next group starts with a new date header, so visual separation is strong.
      // So we should simpler logic: always show avatar on the last message of a block of same-user messages.
      
      // Check next message in this group
      if (index === groupMessages.length - 1) {
          // Last in group.
          return true;
      }
      
      const nextMessage = groupMessages[index + 1];
      const currentUserId = message.user_id || message.userId || message.user?.id;
      const nextUserId = nextMessage.user_id || nextMessage.userId || nextMessage.user?.id;
      
      // If next message is from different user, show avatar
      if (String(currentUserId) !== String(nextUserId)) {
          return true;
      }
      
      // Same user, next is not date (since we are in group), so hide avatar
      return false;
    },
    shouldShowSenderName(message) {
      // Show sender name only in group/general chats for incoming messages
      const chat = this.selectedChat;
      if (!chat) return false;
      
      // Only show in group/general chats (not in direct chats)
      return chat.type === 'group' || chat.type === 'general';
    },
    getUserColor(message) {
      // Generate consistent color for user based on their ID
      const userId = message.user_id || message.userId || message.user?.id;
      if (!userId) return '#000000';
      
      const colors = [
        '#e17076', // red
        '#7f8c8d', // gray
        '#a695e7', // purple
        '#7bc862', // green
        '#6ec9cb', // cyan
        '#65aadd', // blue
        '#ee7aae', // pink
      ];
      
      const index = Number(userId) % colors.length;
      return colors[index];
    },
    shouldShowAvatar(item, index, messagesWithDates) {
      // Показываем аватар только для групповых чатов
      // if (!(this.selectedChat?.type === 'group' || this.selectedChat?.type === 'general')) {
      //   return false;
      // }
      
      // Если это разделитель даты, не показываем
      if (item.type === 'date') {
        return false;
      }
      
      // Получаем текущего пользователя сообщения
      const currentUserId = item.data?.user_id || item.data?.userId || item.data?.user?.id;
      if (!currentUserId) return false;
      
      // Ищем следующее сообщение (не разделитель даты)
      let nextIndex = index + 1;
      while (nextIndex < messagesWithDates.length) {
        const nextItem = messagesWithDates[nextIndex];
        
        // Если следующий элемент - разделитель даты, показываем аватар (это последнее сообщение перед датой)
        if (nextItem.type === 'date') {
          return true;
        }
        
        // Получаем пользователя следующего сообщения
        const nextUserId = nextItem.data?.user_id || nextItem.data?.userId || nextItem.data?.user?.id;
        
        // Если следующее сообщение от другого пользователя, показываем аватар (это последнее сообщение от текущего пользователя)
        if (nextUserId && Number(nextUserId) !== Number(currentUserId)) {
          return true;
        }
        
        // Если следующее сообщение от того же пользователя, НЕ показываем аватар (это не последнее сообщение в группе)
        if (nextUserId && Number(nextUserId) === Number(currentUserId)) {
          return false;
        }
        
        nextIndex++;
      }
      
      // Если это последнее сообщение в списке, показываем аватар
      return true;
    },
    selectItem(item) {
      if (item.type === 'user') {
        this.openDirect(item);
      } else if (item.type === 'general') {
        this.openGeneralChat();
      } else if (item.type === 'group') {
        this.selectChat(item);
      }
    },
    isItemActive(item) {
      if (!this.selectedChat || !item) return false;
      if (item.type === 'general') {
        return Number(this.selectedChat.id) === Number(item.id);
      }
      if (item.type === 'user') {
        return this.selectedChat.type === 'direct' && 
               Number(this.activePeerUser?.id) === Number(item.id);
      }
      if (item.type === 'group') {
        return Number(this.selectedChat.id) === Number(item.id);
      }
      return false;
    },
    getPeerUserId(chat) {
      if (!chat || chat.type !== 'direct' || !chat.direct_key) return null;
      const myId = this.$store.state.user?.id;
      if (!myId) return null;
      
      const parts = String(chat.direct_key).split(":").map(x => parseInt(x, 10)).filter(x => !isNaN(x));
      if (parts.length !== 2) return null;
      
      const [a, b] = parts;
      return Number(a) === Number(myId) ? b : a;
    },
    isMyMessageInChat(item) {
      if (!item.last_message) return false;
      const myId = this.$store.state.user?.id;
      return myId && Number(item.last_message.user_id) === Number(myId);
    },
    handleEnterKey() {
      if (this.editingMessage) {
        this.saveEdit();
        return;
      }
      if (!this.draft.trim() && this.selectedFiles.length === 0 && !this.audioBlob) return;
      this.send();
    },
    handleShiftEnter() {
      // Shift+Enter добавляет новую строку - ничего не делаем
    },
    closeCreateGroupModal() {
      this.showCreateGroupModal = false;
      this.groupTitle = "";
      this.selectedUserIds = [];
    },
    toggleUserSelection(userId) {
      const id = Number(userId);
      const index = this.selectedUserIds.indexOf(id);
      if (index > -1) {
        this.selectedUserIds.splice(index, 1);
      } else {
        this.selectedUserIds.push(id);
      }
    },
    async createGroupChat() {
      if (!this.canCreateGroup) return;
      
      this.creatingGroup = true;
      try {
        const chat = await ChatController.createGroupChat({
          title: this.groupTitle.trim(),
          user_ids: this.selectedUserIds,
        });
        
        if (chat) {
          // Добавляем чат в список если его там нет
          const exists = (this.chats || []).some((c) => Number(c.id) === Number(chat.id));
          if (!exists) {
            this.chats = [...(this.chats || []), chat];
          }
          
          // Закрываем модальное окно
          this.closeCreateGroupModal();
          
          // Открываем созданный чат
          await this.selectChat(chat);
          
          this.$store.dispatch("showNotification", {
            title: "Групповой чат создан",
            subtitle: `Чат "${chat.title}" успешно создан`,
            isDanger: false,
            duration: 3000,
          });
        }
      } catch (error) {
        console.error("[Messenger] Ошибка при создании группового чата:", error);
        this.$store.dispatch("showNotification", {
          title: "Ошибка создания чата",
          subtitle: error?.response?.data?.message || error?.message || "Не удалось создать групповой чат",
          isDanger: true,
          duration: 5000,
        });
      } finally {
        this.creatingGroup = false;
      }
    },
    isChatCreator(chat) {
      if (!chat || !chat.id) return false;
      
      const myId = this.$store.state.user?.id;
      if (!myId) return false;
      
      // Находим полную информацию о чате в списке
      const foundChat = this.chats.find(c => Number(c.id) === Number(chat.id));
      const fullChat = foundChat || chat;
      
      // Проверяем тип чата
      if (fullChat.type !== 'group') return false;
      
      // Проверяем created_by
      const createdBy = fullChat.created_by;
      if (!createdBy) {
        return false;
      }
      
      return Number(createdBy) === Number(myId);
    },
    confirmDeleteChat() {
      if (!this.selectedChat || !this.isChatCreator(this.selectedChat)) return;
      this.showDeleteConfirm = true;
    },
    async deleteChat() {
      if (!this.selectedChat || !this.isChatCreator(this.selectedChat)) return;
      
      const chatId = this.selectedChat.id;
      this.deletingChat = true;
      try {
        await ChatController.deleteChat(chatId);
        
        // Отписываемся от WebSocket перед удалением
        globalChatRealtime.unsubscribeChat(chatId);
        
        // Удаляем чат из списка
        this.chats = (this.chats || []).filter((c) => Number(c.id) !== Number(chatId));
        
        // Закрываем чат
        this.selectedChat = null;
        this.selectedChatId = null;
        this.messages = [];
        this.activePeerUser = null;
        
        this.showDeleteConfirm = false;
        
        this.$store.dispatch("showNotification", {
          title: "Чат удалён",
          subtitle: "Групповой чат успешно удалён",
          isDanger: false,
          duration: 3000,
        });
      } catch (error) {
        console.error("[Messenger] Ошибка при удалении чата:", error);
        this.$store.dispatch("showNotification", {
          title: "Ошибка удаления чата",
          subtitle: error?.response?.data?.message || error?.message || "Не удалось удалить чат",
          isDanger: true,
          duration: 5000,
        });
      } finally {
        this.deletingChat = false;
      }
    },
  },
};
</script>



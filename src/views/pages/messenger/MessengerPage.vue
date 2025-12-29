<template>
  <div class="h-[calc(100vh-6rem)] flex overflow-hidden rounded-2xl border border-gray-200 bg-white">
    <!-- LEFT: list -->
    <aside class="w-full md:w-[360px] shrink-0 border-r border-gray-200 bg-white flex flex-col min-h-0">
      <!-- Search row (Bitrix-like) -->
      <div class="px-3 py-2 border-b border-gray-200">
        <div class="flex items-center gap-2">
          <button
            class="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100"
            title="Filters"
            type="button"
          >
            <i class="fas fa-sliders-h text-sm"></i>
          </button>

          <div class="flex-1 relative">
            <i class="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              v-model="search"
              type="text"
              class="w-full h-9 rounded-full bg-gray-100 pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              placeholder="Найти сотрудника или чат"
            />
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto min-h-0">
        <div v-if="!hasChatsView" class="p-4 text-sm text-gray-500">
          Нет доступа к чатам
        </div>

        <template v-else>
          <!-- General chat (single) -->
          <div class="px-4 pt-3 pb-2 text-[11px] uppercase tracking-wide text-gray-500 flex items-center justify-between">
            <span>Общий чат</span>
            <span v-if="loadingChats" class="normal-case text-gray-400">...</span>
          </div>

          <button
            class="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-3 disabled:opacity-60"
            :class="selectedChatId === generalChat?.id ? 'bg-sky-500 text-white hover:bg-sky-500' : ''"
            type="button"
            :disabled="loadingChats"
            @click="openGeneralChat"
          >
            <div class="relative shrink-0">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
                :class="selectedChatId === generalChat?.id ? 'bg-white/20' : 'bg-gray-200 text-gray-700'"
              >
                <i class="fas fa-comments"></i>
              </div>
            </div>

            <div class="min-w-0 flex-1">
              <div class="font-semibold truncate text-sm" :class="selectedChatId === generalChat?.id ? 'text-white' : 'text-gray-900'">
                {{ generalChat?.title || "Общий чат" }}
              </div>
              <div class="text-xs truncate mt-0.5" :class="selectedChatId === generalChat?.id ? 'text-white/90' : 'text-gray-500'">
                {{ generalChatPreview }}
              </div>
            </div>
          </button>

          <!-- Users (always) -->
          <div class="px-4 pt-4 pb-2 text-[11px] uppercase tracking-wide text-gray-500 flex items-center justify-between">
            <span>Сотрудники</span>
            <span v-if="isDevelopment" class="normal-case text-gray-400 text-[10px]">
              ({{ filteredUsers.length }}/{{ usersForCompany.length }})
            </span>
          </div>

          <div v-if="filteredUsers.length === 0" class="px-4 py-3 text-sm text-gray-500">
            Нет сотрудников
            <span v-if="isDevelopment" class="block text-xs text-gray-400 mt-1">
              Всего в store: {{ $store.state.users?.length || 0 }}, 
              Для компании: {{ usersForCompany.length }}
            </span>
          </div>

          <button
            v-for="u in filteredUsers"
            :key="`user-${u.id}`"
            class="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-3"
            :class="isActiveUser(u) ? 'bg-sky-500 text-white hover:bg-sky-500' : ''"
            type="button"
            @click="openDirect(u)"
          >
            <div class="relative shrink-0">
              <img
                v-if="u.photo"
                :src="userPhotoUrl(u.photo)"
                class="w-10 h-10 rounded-full object-cover border border-gray-200"
                alt="user"
              />
              <div
                v-else
                class="w-10 h-10 rounded-full flex items-center justify-center"
                :class="isActiveUser(u) ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'"
              >
                <i class="fas fa-user"></i>
              </div>
              <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white"></span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <div class="font-semibold text-sm truncate" :class="isActiveUser(u) ? 'text-white' : 'text-gray-900'">
                  {{ u.name }} {{ u.surname || "" }}
                </div>
                <div class="text-[11px] shrink-0" :class="isActiveUser(u) ? 'text-white/80' : 'text-gray-400'">
                  {{ userLastTime(u) }}
                </div>
              </div>
              <div class="flex items-center justify-between gap-2 mt-0.5">
                <div class="text-xs truncate" :class="isActiveUser(u) ? 'text-white/90' : 'text-gray-500'">
                  {{ userPreview(u) || (u.position || "Сотрудник") }}
                </div>
                <span
                  v-if="userUnread(u) > 0"
                  class="min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] flex items-center justify-center"
                >
                  {{ userUnread(u) }}
                </span>
              </div>
            </div>
          </button>
        </template>
      </div>
    </aside>

    <!-- RIGHT: chat -->
    <section class="flex-1 min-w-0 flex flex-col">
      <!-- Top bar -->
      <div class="h-14 px-4 border-b border-gray-200 flex items-center justify-between bg-white">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
            <i class="fas fa-user text-gray-600" v-if="!selectedChat"></i>
            <i class="fas" :class="selectedChat ? chatIcon(selectedChat) : ''" v-else></i>
          </div>
          <div class="min-w-0">
            <div class="font-semibold text-gray-900 truncate">
              {{ selectedChat ? chatTitle(selectedChat) : $t("messenger") }}
            </div>
            <div class="text-xs text-gray-400 truncate">
              {{ selectedChat ? "Онлайн" : "Выберите сотрудника или общий чат слева" }}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button class="h-9 px-3 rounded-full bg-sky-500 text-white hover:bg-sky-600 text-sm flex items-center gap-2" type="button">
            <i class="fas fa-video"></i>
            <span class="hidden md:inline">Видеозвонок</span>
          </button>
          <button class="w-9 h-9 rounded-full hover:bg-gray-100 text-gray-500" type="button" title="Search">
            <i class="fas fa-search"></i>
          </button>
          <button class="w-9 h-9 rounded-full hover:bg-gray-100 text-gray-500" type="button" title="More">
            <i class="fas fa-ellipsis-v"></i>
          </button>
        </div>
      </div>

      <!-- Messages area -->
      <div class="flex-1 min-h-0 messenger-bg overflow-y-auto" ref="messagesWrap">
        <div v-if="!selectedChat" class="h-full flex items-center justify-center p-6">
          <div class="text-center text-gray-600">
            <div class="mx-auto w-14 h-14 rounded-full bg-white/70 border border-white/60 flex items-center justify-center">
              <i class="fas fa-comments text-xl text-sky-600"></i>
            </div>
            <div class="mt-3 font-semibold">Откройте чат</div>
            <div class="mt-1 text-sm text-gray-500">Слева выберите сотрудника или общий чат</div>
          </div>
        </div>

        <div v-else class="p-4 md:p-6 space-y-3">
          <div v-if="loadingMessages" class="text-sm text-gray-600">Загрузка…</div>

          <template v-else>
            <!-- Optional: date separator (static for now) -->
            <div class="flex justify-center">
              <div class="px-3 py-1 rounded-full bg-white/70 text-xs text-gray-600 border border-white/60">
                {{ dayLabel }}
              </div>
            </div>

            <div
              v-for="m in messages"
              :key="m.id"
              class="flex"
              :class="isMyMessage(m) ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[88%] md:max-w-[70%] rounded-2xl px-3 py-2 text-sm shadow-sm relative"
                :class="isMyMessage(m) ? 'bg-[#d9f6c9] text-gray-900' : 'bg-white text-gray-900'"
              >
                <div class="whitespace-pre-wrap break-words leading-snug">{{ m.body || "" }}</div>

                <div v-if="Array.isArray(m.files) && m.files.length" class="mt-2 space-y-1">
                  <a
                    v-for="f in m.files"
                    :key="f.path"
                    class="block text-xs underline text-sky-700"
                    :href="fileUrl(f.path)"
                    target="_blank"
                  >
                    {{ f.name }}
                  </a>
                </div>

                <div class="mt-1 flex items-center justify-end gap-1 text-[11px] text-gray-500">
                  <span>{{ messageTime(m) }}</span>
                  <span v-if="isMyMessage(m)" class="text-sky-700">✓✓</span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Composer -->
      <div class="p-3 bg-white border-t border-gray-200">
        <div class="flex items-end gap-2">
          <button
            class="w-10 h-10 rounded-full hover:bg-gray-100 text-gray-500 flex items-center justify-center disabled:opacity-50"
            :disabled="!selectedChat || !canWrite"
            type="button"
            @click="$refs.fileInput.click()"
            title="Attach"
          >
            <i class="fas fa-paperclip"></i>
          </button>

          <input ref="fileInput" type="file" class="hidden" multiple @change="onFilesSelected" />

          <div class="flex-1 bg-gray-100 rounded-2xl px-4 py-2 border border-gray-100 focus-within:ring-2 focus-within:ring-sky-500/30">
            <textarea
              v-model="draft"
              class="w-full bg-transparent resize-none outline-none text-sm text-gray-900 placeholder:text-gray-500 min-h-[28px] max-h-28"
              placeholder="Напишите сообщение…"
              :disabled="!selectedChat || !canWrite"
            ></textarea>
            <div v-if="selectedFiles.length" class="mt-2 text-xs text-gray-600">
              <div class="font-medium text-gray-700">Файлы:</div>
              <ul class="list-disc ml-4">
                <li v-for="f in selectedFiles" :key="f.name">{{ f.name }}</li>
              </ul>
            </div>
          </div>

          <button
            class="w-11 h-11 rounded-full bg-sky-500 text-white hover:bg-sky-600 flex items-center justify-center disabled:opacity-50"
            :disabled="!selectedChat || !canWrite || sending"
            type="button"
            @click="send"
            title="Send"
          >
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </section>

  </div>
</template>

<script>
import ChatController from "@/api/ChatController";
import echo from "@/services/echo";

export default {
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

      draft: "",
      selectedFiles: [],
      sending: false,

      currentChannel: null, // WebSocket channel subscription
    };
  },
  computed: {
    isDevelopment() {
      return import.meta.env.DEV || import.meta.env.MODE === 'development';
    },
    hasChatsView() {
      return this.$store.getters.hasPermission("chats_view");
    },
    canWrite() {
      return this.$store.getters.hasPermission("chats_write");
    },
    usersForCompany() {
      return this.$store.getters.usersForCurrentCompany || [];
    },
    filteredUsers() {
      const q = (this.search || "").trim().toLowerCase();
      const users = this.usersForCompany.filter((u) => u && u.id !== this.$store.state.user?.id);
      
      // Отладка: логируем количество пользователей
      if (import.meta.env.DEV) {
        console.log("[Messenger] Фильтрация пользователей:", {
          всегоДляКомпании: this.usersForCompany.length,
          послеИсключенияТекущего: users.length,
          поисковыйЗапрос: q || "(нет)",
        });
      }
      
      if (!q) return users;
      return users.filter((u) => {
        const s = `${u.name || ""} ${u.surname || ""} ${u.email || ""}`.toLowerCase();
        return s.includes(q);
      });
    },
    dayLabel() {
      // MVP: можно заменить на реальную группировку по дням
      return "Сегодня";
    },
    generalChatPreview() {
      if (!this.generalChat) return "Нажмите, чтобы открыть общий чат";
      if (this.selectedChatId === this.generalChat.id && Array.isArray(this.messages) && this.messages.length) {
        const last = this.messages[this.messages.length - 1];
        return last?.body || "";
      }
      return "Нажмите, чтобы открыть общий чат";
    },
  },
  async mounted() {
    await this.ensureUsersLoaded();
    await this.loadChats();
    // Подписываемся на список чатов для получения обновлений (unread_count, last_message)
    this.subscribeToChatsUpdates();
  },
  beforeUnmount() {
    this.unsubscribeFromChat();
    this.unsubscribeFromChatsUpdates();
  },
  methods: {
    async ensureUsersLoaded() {
      // Для мессенджера всегда загружаем пользователей, чтобы получить актуальный список
      // Очищаем state перед загрузкой, чтобы гарантировать свежие данные
      try {
        // Очищаем пользователей в state, чтобы принудительно загрузить заново
        this.$store.commit("SET_USERS", []);
        
        // Загружаем пользователей
        await this.$store.dispatch("loadUsers");
        
        // Отладка: проверим сколько пользователей загружено
        const allUsers = this.$store.state.users || [];
        const companyUsers = this.usersForCompany || [];
        console.log("[Messenger] Загружено пользователей:", {
          всего: allUsers.length,
          дляКомпании: companyUsers.length,
          текущаяКомпания: this.$store.state.currentCompany?.id,
          активных: allUsers.filter(u => u?.isActive).length,
        });
        
        // Дополнительная отладка: проверим структуру компаний у пользователей
        if (import.meta.env.DEV) {
          allUsers.forEach(u => {
            if (!u.companies || u.companies.length === 0) {
              console.warn(`[Messenger] Пользователь ${u.name} ${u.surname} не имеет компаний`);
            }
          });
        }
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
      } finally {
        this.loadingChats = false;
      }
    },
    subscribeToChatsUpdates() {
      // WebSocket: подписываемся на обновления списка чатов (можно добавить позже, если нужно)
      // Пока оставляем пустым, т.к. основные обновления идут через подписку на конкретный чат
    },
    unsubscribeFromChatsUpdates() {
      // WebSocket: отписываемся от обновлений списка чатов
    },
    chatTitle(chat) {
      if (chat?.type === "direct" && this.activePeerUser) {
        const u = this.activePeerUser;
        return `${u.name || ""} ${u.surname || ""}`.trim() || "Личный чат";
      }
      return chat.title || chat.name || (chat.type === "general" ? "General chat" : `Chat #${chat.id}`);
    },
    chatIcon(chat) {
      if (chat.type === "general") return "fa-globe";
      if (chat.type === "direct") return "fa-user";
      return "fa-users";
    },
    async selectChat(chat) {
      this.unsubscribeFromChat(); // Отписываемся от предыдущего чата
      this.selectedChat = chat;
      this.selectedChatId = chat.id;
      this.messages = [];
      try {
        await this.loadMessages(chat.id);
        this.subscribeToChat(chat); // Подписываемся на новый чат через WebSocket
      } catch (e) {
        console.error("[Messenger] Ошибка при выборе чата:", e);
      }
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
      try {
        const items = await ChatController.getMessages(chatId);
        this.messages = Array.isArray(items) ? items : [];
        this.$nextTick(() => this.scrollToBottom());
      } catch (e) {
        this.messages = [];
        this.$store.dispatch("showNotification", {
          title: "Не удалось загрузить сообщения",
          subtitle: e?.message || "",
          isDanger: true,
          duration: 3000,
        });
      } finally {
        this.loadingMessages = false;
      }
    },
    subscribeToChat(chat) {
      if (!chat || !chat.id) return;
      
      const companyId = this.$store.getters.currentCompanyId;
      if (!companyId) return;

      // Отписываемся от предыдущего канала, если есть
      this.unsubscribeFromChat();

      // Подписываемся на приватный канал чата
      const channelName = `company.${companyId}.chat.${chat.id}`;
      console.log(`[WebSocket] Подписка на канал: ${channelName}`);

      this.currentChannel = echo.private(channelName)
        .listen('.chat.message.sent', (event) => {
          console.log('[WebSocket] Получено новое сообщение:', event);
          
          // Проверяем, что сообщение для текущего чата
          if (Number(event.chat_id) !== Number(this.selectedChatId)) return;

          // Добавляем сообщение в список
          const newMessage = {
            id: event.id,
            chat_id: event.chat_id,
            user_id: event.user?.id,
            body: event.body,
            files: event.files,
            created_at: event.created_at,
            user: event.user,
          };

          // Проверяем, что сообщение еще не в списке (избегаем дублей)
          const exists = this.messages.some(m => Number(m.id) === Number(newMessage.id));
          if (!exists) {
            this.messages.push(newMessage);
            this.$nextTick(() => this.scrollToBottom());
            
            // Обновляем метаданные чата
            this.applyLocalMessageMeta(newMessage);
          }
        })
        .error((error) => {
          console.error('[WebSocket] Ошибка подписки на канал:', error);
        });
    },
    unsubscribeFromChat() {
      if (this.currentChannel) {
        console.log('[WebSocket] Отписка от канала');
        this.currentChannel.stopListening('.chat.message.sent');
        echo.leave(this.currentChannel.name);
        this.currentChannel = null;
      }
    },
    scrollToBottom() {
      const el = this.$refs.messagesWrap;
      if (el && el.scrollHeight !== undefined) {
        el.scrollTop = el.scrollHeight;
      }
    },
    isMyMessage(m) {
      const myId = this.$store.state.user?.id;
      const userId = m.user_id || m.userId || m.user?.id;
      return myId && userId && Number(myId) === Number(userId);
    },
    messageTime(m) {
      const raw = m.created_at || m.createdAt || null;
      if (!raw) return "";
      // ожидаем 'YYYY-MM-DD HH:mm:ss' или ISO; берём последние 5 символов времени
      const s = String(raw);
      const match = s.match(/(\d{2}:\d{2})(?::\d{2})?$/);
      return match ? match[1] : s;
    },
    userPhotoUrl(path) {
      return `${import.meta.env.VITE_APP_BASE_URL}/storage/${path}`;
    },
    fileUrl(path) {
      return `${import.meta.env.VITE_APP_BASE_URL}/storage/${path}`;
    },
    onFilesSelected(e) {
      const files = Array.from(e.target.files || []);
      this.selectedFiles = files;
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
        });

        if (msg) {
          this.messages.push(msg);
          this.draft = "";
          this.selectedFiles = [];
          // моментально обновим метаданные чата для отправителя
          this.applyLocalMessageMeta(msg);
          this.$nextTick(() => this.scrollToBottom());
        } else {
          await this.loadMessages(this.selectedChatId);
        }
      } finally {
        this.sending = false;
      }
    },
    applyLocalMessageMeta(msg) {
      if (!msg) return;
      const chatId = Number(msg.chat_id || msg.chatId || this.selectedChatId);
      if (!chatId) return;
      // обновляем в generalChat
      if (this.generalChat && Number(this.generalChat.id) === chatId) {
        this.generalChat = {
          ...this.generalChat,
          last_message: msg,
          last_message_at: msg.created_at || this.generalChat.last_message_at || null,
          unread_count: 0,
        };
      }
      // обновляем в списке chats
      this.chats = (this.chats || []).map((c) => {
        if (!c || Number(c.id) !== chatId) return c;
        return {
          ...c,
          last_message: msg,
          last_message_at: msg.created_at || c.last_message_at || null,
          unread_count: 0, // у отправителя непрочитанных нет
        };
      });
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
    isActiveUser(u) {
      if (!u || !this.activePeerUser || !this.selectedChat) return false;
      return this.selectedChat.type === "direct" && Number(this.activePeerUser.id) === Number(u.id);
    },
    directChatByUserId() {
      const myId = this.$store.state.user?.id;
      const map = new Map();
      if (!myId) return map;

      (this.chats || []).forEach((c) => {
        if (!c || c.type !== "direct" || !c.direct_key) return;
        const parts = String(c.direct_key).split(":").map((x) => parseInt(x, 10)).filter((x) => !isNaN(x));
        if (parts.length !== 2) return;
        const [a, b] = parts;
        if (Number(a) !== Number(myId) && Number(b) !== Number(myId)) return;
        const otherId = Number(a) === Number(myId) ? b : a;
        map.set(Number(otherId), c);
      });

      return map;
    },
    userPreview(u) {
      const chat = this.directChatByUserId().get(Number(u.id));
      return chat?.last_message?.body || "";
    },
    userUnread(u) {
      const chat = this.directChatByUserId().get(Number(u.id));
      return chat?.unread_count || 0;
    },
    userLastTime(u) {
      const chat = this.directChatByUserId().get(Number(u.id));
      const raw = chat?.last_message_at || chat?.last_message?.created_at || "";
      if (!raw) return "";
      const s = String(raw);
      const match = s.match(/(\d{2}:\d{2})(?::\d{2})?$/);
      return match ? match[1] : "";
    },
  },
};
</script>

<style scoped>
.messenger-bg {
  background-color: #cfe2f6;
  /* лёгкий "битрикс-паттерн" без ассетов */
  background-image:
    radial-gradient(circle at 20px 20px, rgba(255, 255, 255, 0.35) 0 2px, transparent 3px),
    radial-gradient(circle at 80px 60px, rgba(255, 255, 255, 0.25) 0 2px, transparent 3px),
    radial-gradient(circle at 120px 30px, rgba(255, 255, 255, 0.25) 0 2px, transparent 3px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  background-size: 140px 100px, 180px 120px, 200px 120px, 100% 100%;
  background-repeat: repeat, repeat, repeat, no-repeat;
}
</style>



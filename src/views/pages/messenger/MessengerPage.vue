<template>
  <div class="h-[calc(100vh-6rem)] flex overflow-hidden rounded-2xl border border-gray-200 bg-white">
    <!-- LEFT: list -->
    <aside class="w-full md:w-[360px] shrink-0 border-r border-gray-200 bg-white flex flex-col min-h-0">
      <!-- Search row -->
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

          <button
            class="w-9 h-9 rounded-lg bg-sky-500 text-white hover:bg-sky-600 flex items-center justify-center shrink-0"
            title="Создать чат"
            type="button"
          >
            <i class="fas fa-pen text-sm"></i>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto min-h-0">
        <div v-if="!hasChatsView" class="p-4 text-sm text-gray-500">
          Нет доступа к чатам
        </div>

        <template v-else>
          <!-- Combined list of chats and users -->
          <div v-if="allChatsList.length === 0" class="px-4 py-3 text-sm text-gray-500">
            Нет чатов
          </div>

          <button
            v-for="item in allChatsList"
            :key="`${item.type}-${item.id}`"
            class="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-3"
            :class="isItemActive(item) ? 'bg-sky-500 text-white hover:bg-sky-500' : ''"
            type="button"
            @click="selectItem(item)"
          >
            <div class="relative shrink-0">
              <!-- Avatar for user or chat icon -->
              <img
                v-if="item.type === 'user' && item.photo"
                :src="userPhotoUrl(item.photo)"
                class="w-10 h-10 rounded-full object-cover border border-gray-200"
                alt="user"
              />
              <div
                v-else-if="item.type === 'user'"
                class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold"
                :class="isItemActive(item) ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'"
              >
                {{ getUserInitials(item) }}
              </div>
              <div
                v-else-if="item.type === 'general'"
                class="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
                :class="isItemActive(item) ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'"
              >
                <i class="fas fa-comments"></i>
              </div>
              <div
                v-else-if="item.type === 'group'"
                class="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
                :class="isItemActive(item) ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'"
              >
                <i class="fas fa-users"></i>
              </div>
              
              <!-- Online indicator for users -->
              <span
                v-if="item.type === 'user'"
                class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                :class="isUserOnline(item) ? 'bg-green-500' : 'bg-gray-300'"
              ></span>
            </div>
            
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <div class="font-semibold text-sm truncate" :class="isItemActive(item) ? 'text-white' : 'text-gray-900'">
                  {{ getItemTitle(item) }}
                </div>
                <div class="text-[11px] shrink-0 flex items-center gap-1" :class="isItemActive(item) ? 'text-white/80' : 'text-gray-400'">
                  <span v-if="item.last_message_at || item.last_message">{{ formatChatTime(item) }}</span>
                  <span v-if="item.type === 'user' && isMyMessageInChat(item)" class="text-sky-600">✓✓</span>
                </div>
              </div>
              <div class="flex items-center justify-between gap-2 mt-0.5">
                <div class="text-xs truncate" :class="isItemActive(item) ? 'text-white/90' : 'text-gray-500'">
                  {{ getItemPreview(item) }}
                </div>
                <span
                  v-if="(item.unread_count || 0) > 0"
                  class="min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] flex items-center justify-center shrink-0"
                >
                  {{ item.unread_count }}
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
      <div v-if="selectedChat && activePeerUser" class="px-4 py-1 border-b border-gray-200 bg-white">
        <div class="flex items-start justify-between gap-4">
          <!-- Left: User info -->
          <div class="flex items-start gap-3 min-w-0 flex-1">
            <!-- Large avatar -->
            <div class="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-gray-200">
              <img
                v-if="activePeerUser.photo"
                :src="userPhotoUrl(activePeerUser.photo)"
                class="w-full h-full object-cover"
                alt="user"
              />
              <div
                v-else
                class="w-full h-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-lg"
              >
                {{ getUserInitials(activePeerUser) }}
              </div>
            </div>
            
            <!-- Name and status -->
            <div class="min-w-0 flex-1">
              <div class="font-semibold text-gray-900 text-base">
                {{ activePeerUser.name }} {{ activePeerUser.surname || "" }}
              </div>
              <div class="text-xs text-gray-500 mt-0.5">
                <span class="text-green-600">{{ presenceStatusText }}</span>
                <span v-if="activePeerUser.position" class="ml-2">{{ activePeerUser.position }}</span>
              </div>
            </div>
          </div>

          <!-- Right: Disk info and actions -->
          <div class="flex items-center gap-4 shrink-0">
            <!-- Disk info (optional, can be hidden on mobile) -->
            <div class="hidden lg:block text-right text-xs text-gray-500">
              <div>Размер диска: 9.8G</div>
              <div>Использовано: 9.0G (97%)</div>
              <div>Свободно: 322M</div>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center gap-2">
              <div class="relative">
                <button class="h-9 px-3 rounded-full bg-sky-500 text-white hover:bg-sky-600 text-sm flex items-center gap-2" type="button">
                  <i class="fas fa-video"></i>
                  <span class="inline">Видеозвонок</span>
                  <i class="fas fa-chevron-down text-xs ml-1"></i>
                </button>
              </div>
              <button class="w-9 h-9 rounded-full hover:bg-gray-100 text-gray-500 flex items-center justify-center" type="button" title="Добавить участника">
                <i class="fas fa-user-plus"></i>
              </button>
              <button class="w-9 h-9 rounded-full hover:bg-gray-100 text-gray-500 flex items-center justify-center" type="button" title="Поиск">
                <i class="fas fa-search"></i>
              </button>
              <button class="w-9 h-9 rounded-full hover:bg-gray-100 text-gray-500 flex items-center justify-center" type="button" title="Настройки">
                <i class="fas fa-bell"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Fallback header for non-direct chats -->
      <div v-else-if="selectedChat" class="h-14 px-4 border-b border-gray-200 flex items-center justify-between bg-white">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
            <i class="fas" :class="chatIcon(selectedChat)"></i>
          </div>
          <div class="min-w-0">
            <div class="font-semibold text-gray-900 truncate">
              {{ chatTitle(selectedChat) }}
            </div>
            <div class="text-xs text-gray-400 truncate">
              {{ presenceStatusText }}
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
      
      <!-- Empty state header -->
      <div v-else class="h-14 px-4 border-b border-gray-200 flex items-center justify-between bg-white">
        <div class="font-semibold text-gray-900">
          {{ $t("messenger") }}
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
            <!-- "Новые сообщения" separator (if there are unread messages) -->
            <div v-if="hasUnreadMessages" class="flex items-center gap-3 my-3">
              <div class="flex-1 h-px bg-gray-300"></div>
              <div class="text-xs text-gray-500 font-medium px-2">Новые сообщения</div>
              <div class="flex-1 h-px bg-gray-300"></div>
            </div>

            <template v-for="(item, index) in messagesWithDates" :key="`${item.type}-${item.type === 'date' ? item.date?.getTime() : item.data?.id}-${index}`">
              <!-- Date separator -->
              <div v-if="item.type === 'date'" class="flex justify-center my-3">
                <div class="px-3 py-1 rounded-full bg-white/70 text-xs text-gray-600 border border-white/60">
                  {{ item.data }}
                </div>
              </div>

              <!-- Message -->
              <div
                v-else
                class="flex mb-2"
                :class="isMyMessage(item.data) ? 'justify-end' : 'justify-start'"
              >
                <div
                  class="max-w-[88%] md:max-w-[70%] rounded-2xl px-3 py-2 text-sm shadow-sm relative"
                  :class="isMyMessage(item.data) ? 'bg-[#d9f6c9] text-gray-900' : 'bg-white text-gray-900'"
                >
                  <div class="whitespace-pre-wrap break-words leading-snug">{{ item.data.body || "" }}</div>

                  <div v-if="Array.isArray(item.data.files) && item.data.files.length" class="mt-2 space-y-1">
                    <a
                      v-for="f in item.data.files"
                      :key="f.path"
                      class="block text-xs underline text-sky-700"
                      :href="fileUrl(f.path)"
                      target="_blank"
                    >
                      {{ f.name }}
                    </a>
                  </div>

                  <div class="mt-1 flex items-center justify-end gap-1 text-[11px] text-gray-500">
                    <span>{{ messageTime(item.data) }}</span>
                    <span v-if="isMyMessage(item.data)" class="text-sky-700">✓✓</span>
                  </div>
                </div>
              </div>
            </template>
          </template>
        </div>
      </div>

      <!-- Composer -->
      <div class="p-3 bg-white border-t border-gray-200">
        <div class="flex items-end gap-2">
          <input ref="fileInput" type="file" class="hidden" multiple @change="onFilesSelected" />

          <div class="flex-1 bg-gray-50 rounded-lg px-4 py-2 border border-gray-200 focus-within:ring-2 focus-within:ring-sky-500/30 focus-within:border-sky-300">
            <textarea
              v-model="draft"
              class="w-full bg-transparent resize-none outline-none text-sm text-gray-900 placeholder:text-gray-400 min-h-[40px] max-h-32"
              placeholder="Нажмите @, чтобы упомянуть человека или чат"
              :disabled="!selectedChat || !canWrite"
              @keydown.enter.exact.prevent="handleEnterKey"
              @keydown.enter.shift.exact="handleShiftEnter"
            ></textarea>
            <div v-if="selectedFiles.length" class="mt-2 text-xs text-gray-600">
              <div class="font-medium text-gray-700">Файлы:</div>
              <ul class="list-disc ml-4">
                <li v-for="f in selectedFiles" :key="f.name">{{ f.name }}</li>
              </ul>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <button
              class="w-9 h-9 rounded-full hover:bg-gray-100 text-gray-500 flex items-center justify-center disabled:opacity-50"
              :disabled="!selectedChat || !canWrite"
              type="button"
              title="Эмодзи"
            >
              <i class="far fa-smile"></i>
            </button>
            <button
              class="w-9 h-9 rounded-full hover:bg-gray-100 text-gray-500 flex items-center justify-center disabled:opacity-50"
              :disabled="!selectedChat || !canWrite"
              type="button"
              title="Голосовое сообщение"
            >
              <i class="fas fa-microphone"></i>
            </button>
            <button
              class="w-9 h-9 rounded-full bg-sky-500 text-white hover:bg-sky-600 flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300"
              :disabled="!selectedChat || !canWrite || sending || (!draft.trim() && selectedFiles.length === 0)"
              type="button"
              @click="send"
              title="Отправить"
            >
              <i class="fas fa-paper-plane text-sm"></i>
            </button>
          </div>
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
      presenceChannel: null,
      presenceChannelName: null,
      onlineUserIds: [], // Массив для реактивности Vue
      subscribedChannels: new Map(),
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
      
      if (!q) return users;
      return users.filter((u) => {
        const s = `${u.name || ""} ${u.surname || ""} ${u.email || ""}`.toLowerCase();
        return s.includes(q);
      });
    },
    allChatsList() {
      const list = [];
      const q = (this.search || "").trim().toLowerCase();
      
      // Add general chat
      if (this.generalChat) {
        if (!q || this.generalChat.title?.toLowerCase().includes(q)) {
          list.push({ ...this.generalChat, type: 'general' });
        }
      }
      
      // Add direct chats (from chats list)
      const directChats = (this.chats || []).filter(c => c.type === 'direct');
      directChats.forEach(chat => {
        const peerId = this.getPeerUserId(chat);
        if (peerId) {
          const user = this.usersForCompany.find(u => Number(u.id) === Number(peerId));
          if (user) {
            const title = `${user.name} ${user.surname || ""}`.trim();
            if (!q || title.toLowerCase().includes(q) || user.email?.toLowerCase().includes(q)) {
              list.push({
                ...chat,
                type: 'user',
                ...user,
                displayTitle: title,
              });
            }
          }
        }
      });
      
      // Add group chats
      const groupChats = (this.chats || []).filter(c => c.type === 'group');
      groupChats.forEach(chat => {
        if (!q || chat.title?.toLowerCase().includes(q)) {
          list.push({ ...chat, type: 'group' });
        }
      });
      
      // Add users without direct chats
      this.filteredUsers.forEach(user => {
        const hasDirectChat = list.some(item => item.type === 'user' && Number(item.id) === Number(user.id));
        if (!hasDirectChat) {
          list.push({
            ...user,
            type: 'user',
            id: user.id,
            displayTitle: `${user.name} ${user.surname || ""}`.trim(),
          });
        }
      });
      
      // Sort by last_message_at
      return list.sort((a, b) => {
        const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return bTime - aTime;
      });
    },
    messagesWithDates() {
      if (!this.messages || this.messages.length === 0) return [];
      
      const grouped = [];
      let currentDate = null;
      
      this.messages.forEach((message) => {
        const messageDate = this.parseDate(message.created_at || message.createdAt);
        if (!messageDate) {
          // Если дату не удалось распарсить, просто добавляем сообщение
          grouped.push({ type: 'message', data: message });
          return;
        }
        
        const messageDay = new Date(messageDate);
        messageDay.setHours(0, 0, 0, 0);
        
        // Если дата изменилась, добавляем разделитель
        if (!currentDate || currentDate.getTime() !== messageDay.getTime()) {
          currentDate = messageDay;
          grouped.push({ 
            type: 'date', 
            data: this.formatDayLabel(messageDay),
            date: messageDay
          });
        }
        
        grouped.push({ type: 'message', data: message });
      });
      
      return grouped;
    },
    generalChatPreview() {
      if (!this.generalChat) return "Нажмите, чтобы открыть общий чат";
      if (this.selectedChatId === this.generalChat.id && Array.isArray(this.messages) && this.messages.length) {
        const last = this.messages[this.messages.length - 1];
        return last?.body || "";
      }
      return "Нажмите, чтобы открыть общий чат";
    },
    presenceStatusText() {
      if (!this.selectedChat) return "Выберите сотрудника или общий чат слева";
      if (this.selectedChat.type === "direct" && this.activePeerUser) {
        return this.isUserOnline(this.activePeerUser) ? "Онлайн" : "Оффлайн";
      }
      return "Онлайн";
    },
    hasUnreadMessages() {
      // Определяем, есть ли непрочитанные сообщения выше текущей позиции прокрутки
      // Можно использовать last_read_message_id для более точного определения
      if (!this.selectedChat || !this.messages.length) return false;
      
      const myId = this.$store.state.user?.id;
      if (!myId) return false;
      
      // Проверяем, есть ли сообщения от других пользователей после последнего прочитанного
      // Это упрощенная версия - можно улучшить
      return false;
    },
  },
  async mounted() {
    try {
      await this.ensureUsersLoaded();
      await this.loadChats();
      this.subscribeToPresence();
      // Подписываемся на список чатов для получения обновлений (unread_count, last_message)
      this.subscribeToChatsUpdates();
    } catch (error) {
      console.error("[Messenger] Ошибка при инициализации:", error);
      this.$store.dispatch("showNotification", {
        title: "Ошибка загрузки мессенджера",
        subtitle: error?.message || "Попробуйте обновить страницу",
        isDanger: true,
        duration: 5000,
      });
    }
  },
  beforeUnmount() {
     // Отписываемся от всех каналов
    for (const [chatId, channel] of this.subscribedChannels.entries()) {
      this.unsubscribeFromChatById(Number(chatId));
    }
    this.subscribedChannels.clear();
    this.unsubscribeFromPresence();
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
        // Подписываемся на ВСЕ чаты для получения обновлений unread_count
        this.subscribeToAllChats();
      } finally {
        this.loadingChats = false;
      }
    },
    subscribeToAllChats() {
      const companyId = this.$store.getters.currentCompanyId;
      if (!companyId) return;
      
      // Отписываемся от старых каналов, которых больше нет в списке
      const currentChatIds = new Set(
        [...this.chats, this.generalChat]
          .filter(c => c && c.id)
          .map(c => Number(c.id))
      );
      
      // Удаляем подписки на чаты, которых больше нет
      for (const [chatId, channel] of this.subscribedChannels.entries()) {
        if (!currentChatIds.has(Number(chatId))) {
          this.unsubscribeFromChatById(Number(chatId));
        }
      }
      
      // Подписываемся на все чаты
      [...this.chats, this.generalChat].forEach(chat => {
        if (chat && chat.id && !this.subscribedChannels.has(Number(chat.id))) {
          this.subscribeToChatById(chat.id, companyId);
        }
      });
    },
    subscribeToChatsUpdates() {
      // Метод для подписки на обновления списка чатов
      // WebSocket обновления уже обрабатываются через subscribeToAllChats()
      // Можно оставить пустым или добавить дополнительную логику
    },
    subscribeToChatById(chatId, companyId) {
      if (!chatId || !companyId) return;
      
      const channelName = `company.${companyId}.chat.${chatId}`;
      console.log(`[WebSocket] Подписка на канал: ${channelName}`);
      
      const channel = echo.private(channelName)
        .listen('.chat.message.sent', (event) => {
          this.handleIncomingMessage(event);
        })
        .error((error) => {
          console.error(`[WebSocket] Ошибка подписки на канал ${channelName}:`, error);
        });
      
      this.subscribedChannels.set(Number(chatId), channel);
    },

    handleIncomingMessage(event) {
      console.log('[WebSocket] Получено новое сообщение:', event);
      
      const newMessage = {
        id: event.id,
        chat_id: event.chat_id,
        user_id: event.user?.id,
        body: event.body,
        files: event.files,
        created_at: event.created_at,
        user: event.user,
      };

      const myUserId = this.$store.state.user?.id;
      const isMyMessage = myUserId && Number(event.user?.id) === Number(myUserId);
      const isCurrentChat = Number(event.chat_id) === Number(this.selectedChatId);

      // Если это текущий открытый чат
      if (isCurrentChat) {
        // Проверяем, что сообщение еще не в списке (избегаем дублей)
        const exists = this.messages.some(m => Number(m.id) === Number(newMessage.id));
        if (!exists) {
          this.messages.push(newMessage);
          this.$nextTick(() => this.scrollToBottom());
        }
        
        // Обновляем метаданные чата (last_message, но unread_count = 0 для открытого чата)
        this.applyLocalMessageMeta(newMessage);
      } else {
        // Если это НЕ текущий чат - обновляем unread_count
        if (!isMyMessage) {
          // Увеличиваем счетчик непрочитанных
          this.incrementUnreadCount(event.chat_id, newMessage);
        } else {
          // Если это наше сообщение в другом чате - просто обновляем last_message
          this.updateChatLastMessage(event.chat_id, newMessage);
        }
      }
    },

    updateChatLastMessage(chatId, message) {
      const chatIdNum = Number(chatId);
      
      // Обновляем в списке chats
      this.chats = (this.chats || []).map((c) => {
        if (!c || Number(c.id) !== chatIdNum) return c;
        return {
          ...c,
          last_message: message,
          last_message_at: message.created_at || c.last_message_at || null,
          // unread_count не меняем
        };
      });
      
      // Обновляем generalChat если это он
      if (this.generalChat && Number(this.generalChat.id) === chatIdNum) {
        this.generalChat = {
          ...this.generalChat,
          last_message: message,
          last_message_at: message.created_at || this.generalChat.last_message_at || null,
        };
      }
    },

    unsubscribeFromChatById(chatId) {
      const channel = this.subscribedChannels.get(Number(chatId));
      if (channel) {
        console.log(`[WebSocket] Отписка от канала чата ${chatId}`);
        channel.stopListening('.chat.message.sent');
        echo.leave(channel.name);
        this.subscribedChannels.delete(Number(chatId));
      }
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
    isUserOnline(u) {
      if (!u || !u.id) return false;
      return this.onlineUserIds.includes(Number(u.id));
    },
    subscribeToPresence() {
      const companyId = this.$store.getters.currentCompanyId;
      if (!companyId) {
        console.warn("[Presence] Нет companyId для подписки");
        return;
      }

      const channelName = `company.${companyId}.presence`;
      this.unsubscribeFromPresence();
      this.presenceChannelName = channelName;

      console.log(`[Presence] Подписка на канал: ${channelName}`);

      try {
        this.presenceChannel = echo.join(channelName)
          .here((users) => {
            console.log("[Presence] Пользователи онлайн:", users);
            const ids = (users || []).map((u) => Number(u.id)).filter((id) => !Number.isNaN(id));
            // Используем массив вместо Set для реактивности Vue
            this.onlineUserIds = [...ids];
            console.log("[Presence] Online IDs:", this.onlineUserIds);
          })
          .joining((user) => {
            console.log("[Presence] Пользователь зашел:", user);
            const id = Number(user?.id);
            if (Number.isNaN(id)) return;
            if (!this.onlineUserIds.includes(id)) {
              this.onlineUserIds = [...this.onlineUserIds, id];
            }
          })
          .leaving((user) => {
            console.log("[Presence] Пользователь вышел:", user);
            const id = Number(user?.id);
            if (Number.isNaN(id)) return;
            this.onlineUserIds = this.onlineUserIds.filter(uid => uid !== id);
          })
          .error((err) => {
            console.error("[WebSocket] Ошибка presence-канала:", err);
          });
      } catch (error) {
        console.error("[Presence] Ошибка при подписке:", error);
      }
    },
    unsubscribeFromPresence() {
      if (this.presenceChannelName) {
        console.log(`[Presence] Отписка от канала: ${this.presenceChannelName}`);
        echo.leave(this.presenceChannelName);
      }
      this.presenceChannel = null;
      this.presenceChannelName = null;
      this.onlineUserIds = []; // Используем массив
    },
  
    async selectChat(chat) {
      this.unsubscribeFromChat();
      this.selectedChat = chat;
      this.selectedChatId = chat.id;
      this.messages = [];
      
      // Сбрасываем unread_count для открытого чата
      if (chat) {
        this.chats = (this.chats || []).map((c) => {
          if (c && Number(c.id) === Number(chat.id)) {
            return { ...c, unread_count: 0 };
          }
          return c;
        });
        
        if (this.generalChat && Number(this.generalChat.id) === Number(chat.id)) {
          this.generalChat = { ...this.generalChat, unread_count: 0 };
        }
      }
      
      try {
        await this.loadMessages(chat.id);
        // После загрузки сообщений обновим last_read_message_id на сервере
        await this.markAsRead(chat.id);
        this.subscribeToChat(chat);
        
        // Финальная прокрутка после всех операций
        await this.$nextTick();
        setTimeout(() => {
          this.scrollToBottom();
        }, 200);
      } catch (e) {
        console.error("[Messenger] Ошибка при выборе чата:", e);
      }
    },

    async markAsRead(chatId) {
      if (!chatId || !this.messages.length) return;
      
      try {
        // Находим последнее сообщение
        const lastMessage = this.messages[this.messages.length - 1];
        if (lastMessage && lastMessage.id) {
          // Отправляем запрос на сервер для обновления last_read_message_id
          // Это уже делается в ChatController@messages, но можно добавить отдельный endpoint
          // Пока просто обновляем локально, сервер обновит при следующей загрузке
        }
      } catch (e) {
        console.error("[Messenger] Ошибка при отметке как прочитано:", e);
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
        
        // Ждем завершения загрузки и обновления DOM
        await this.$nextTick();
        this.loadingMessages = false;
        
        // Прокручиваем после того, как loadingMessages стал false
        await this.$nextTick();
        this.scrollToBottom();
      } catch (e) {
        this.messages = [];
        this.loadingMessages = false;
        this.$store.dispatch("showNotification", {
          title: "Не удалось загрузить сообщения",
          subtitle: e?.message || "",
          isDanger: true,
          duration: 3000,
        });
      }
    },

    subscribeToChat(chat) {
      if (!chat || !chat.id) return;
      
      // Убеждаемся, что подписка на этот чат уже есть
      if (!this.subscribedChannels.has(Number(chat.id))) {
        const companyId = this.$store.getters.currentCompanyId;
        if (companyId) {
          this.subscribeToChatById(chat.id, companyId);
        }
      }
      
      // Устанавливаем текущий канал для отображения сообщений
      this.currentChannel = this.subscribedChannels.get(Number(chat.id));
    },

    incrementUnreadCount(chatId, message) {
      const chatIdNum = Number(chatId);
      
      // Обновляем в списке chats
      this.chats = (this.chats || []).map((c) => {
        if (!c || Number(c.id) !== chatIdNum) return c;
        
        return {
          ...c,
          last_message: message,
          last_message_at: message.created_at || c.last_message_at || null,
          unread_count: (c.unread_count || 0) + 1, // Увеличиваем счетчик
        };
      });
      
      // Обновляем generalChat если это он
      if (this.generalChat && Number(this.generalChat.id) === chatIdNum) {
        this.generalChat = {
          ...this.generalChat,
          last_message: message,
          last_message_at: message.created_at || this.generalChat.last_message_at || null,
          unread_count: (this.generalChat.unread_count || 0) + 1,
        };
      }
    },
    
    unsubscribeFromChat() {
      this.currentChannel = null;
    },
    scrollToBottom() {
      const el = this.$refs.messagesWrap;
      if (!el) return;
      
      // Используем несколько попыток для надежности
      const scroll = () => {
        if (el.scrollHeight !== undefined) {
          el.scrollTop = el.scrollHeight;
        }
      };
      
      // Первая попытка сразу
      scroll();
      
      // Вторая попытка после небольшой задержки (на случай если DOM еще обновляется)
      setTimeout(() => {
        scroll();
      }, 100);
      
      // Третья попытка после еще одной задержки
      setTimeout(() => {
        scroll();
      }, 300);
    },
    isMyMessage(m) {
      const myId = this.$store.state.user?.id;
      const userId = m.user_id || m.userId || m.user?.id;
      return myId && userId && Number(myId) === Number(userId);
    },
    messageTime(m) {
      const raw = m.created_at || m.createdAt || null;
      if (!raw) return "";
      const s = String(raw);

      // ISO вида 2025-12-27T09:17:28.000000Z -> берём HH:mm после 'T'
      if (s.includes("T")) {
        const timePart = (s.split("T")[1] || "").trim();
        const hhmm = timePart.slice(0, 5);
        if (/^\d{2}:\d{2}$/.test(hhmm)) return hhmm;
      }

      // Формат "YYYY-MM-DD HH:mm:ss" или похожий -> ищем первую HH:mm
      const match = s.match(/(\d{2}:\d{2})/);
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
      console.log(this.selectedChatId, this.draft, this.selectedFiles);
      try {
        const msg = await ChatController.sendMessage(this.selectedChatId, {
          body: this.draft,
          files: this.selectedFiles,
        });

        if (msg) {
          // this.messages.push(msg);
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
      
      const myUserId = this.$store.state.user?.id;
      const isMyMessage = myUserId && Number(msg.user_id || msg.user?.id) === Number(myUserId);
      
      // Обновляем в generalChat
      if (this.generalChat && Number(this.generalChat.id) === chatId) {
        this.generalChat = {
          ...this.generalChat,
          last_message: msg,
          last_message_at: msg.created_at || this.generalChat.last_message_at || null,
          unread_count: isMyMessage ? 0 : (this.generalChat.unread_count || 0), // Не увеличиваем для открытого чата
        };
      }
      
      // Обновляем в списке chats
      this.chats = (this.chats || []).map((c) => {
        if (!c || Number(c.id) !== chatId) return c;
        return {
          ...c,
          last_message: msg,
          last_message_at: msg.created_at || c.last_message_at || null,
          unread_count: isMyMessage ? 0 : (c.unread_count || 0), // Не увеличиваем для открытого чата
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
          // Подписываемся на новый чат
          const companyId = this.$store.getters.currentCompanyId;
          if (companyId) {
            this.subscribeToChatById(chat.id, companyId);
          }
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
    parseDate(dateString) {
      if (!dateString) return null;
      
      // Парсим ISO формат: "2025-12-27T09:17:28.000000Z" или "2025-12-27 09:17:28"
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date;
    },
    
    formatDate(date, options = {}) {
      if (!date) return "";
      
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return "";
      
      const defaultOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      };
      
      const formatOptions = { ...defaultOptions, ...options };
      
      // Используем локализацию для русского языка
      return dateObj.toLocaleDateString('ru-RU', formatOptions);
    },
    
    formatDayLabel(date) {
      if (!date) return "Сегодня";
      
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return "Сегодня";
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const messageDay = new Date(dateObj);
      messageDay.setHours(0, 0, 0, 0);
      
      const diffTime = today - messageDay;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return "Сегодня";
      } else if (diffDays === 1) {
        return "Вчера";
      } else if (diffDays === 2) {
        return "Позавчера";
      } else if (diffDays < 7) {
        return dateObj.toLocaleDateString('ru-RU', { weekday: 'long' });
      } else {
        return dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
      }
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
      if (!date) return "";
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const messageDay = new Date(date);
      messageDay.setHours(0, 0, 0, 0);
      
      const diffTime = today - messageDay;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        // Сегодня - показываем время
        return this.messageTime(item.last_message || { created_at: raw });
      } else if (diffDays === 1) {
        return "Вчера";
      } else if (diffDays < 7) {
        return date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
      } else {
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    },
    getUserInitials(user) {
      if (!user) return "";
      const name = (user.name || "").charAt(0).toUpperCase();
      const surname = (user.surname || "").charAt(0).toUpperCase();
      return (name + surname) || "?";
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
      if (!this.draft.trim() && this.selectedFiles.length === 0) return;
      this.send();
    },
    handleShiftEnter() {
      // Shift+Enter добавляет новую строку - ничего не делаем
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



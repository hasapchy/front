<template>
    <router-link
        v-if="hasPermission"
        to="/messenger"
        class="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-700 hover:text-gray-900 hover:bg-gray-200 transition-colors"
        title="Чат"
    >
        <i class="fas fa-bell text-lg"></i>
        <span
            v-if="totalUnreadCount > 0"
            class="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] flex items-center justify-center shrink-0"
        >
            {{ totalUnreadCount > 99 ? '99+' : totalUnreadCount }}
        </span>
    </router-link>
</template>

<script>
import ChatController from "@/api/ChatController";
import { eventBus } from "@/eventBus";

export default {
    name: "MessengerBadge",
    data() {
        return {
            totalUnreadCount: 0,
            chats: [],
            generalChat: null,
        };
    },
    computed: {
        hasPermission() {
            return this.$store.getters.hasPermission("chats_view_all");
        },
    },
    async mounted() {
        if (!this.hasPermission) return;

        // Загружаем начальное количество непрочитанных
        await this.loadChats();

        // Подписываемся на события новых сообщений
        eventBus.on("chat:message", this.handleNewMessage);
        eventBus.on("chat:read", this.handleReadUpdate);
        eventBus.on("chat:unread-updated", this.handleUnreadUpdated);
    },
    beforeUnmount() {
        eventBus.off("chat:message", this.handleNewMessage);
        eventBus.off("chat:read", this.handleReadUpdate);
        eventBus.off("chat:unread-updated", this.handleUnreadUpdated);
    },
    methods: {
        async loadChats() {
            try {
                const items = await ChatController.getChats();
                this.chats = Array.isArray(items) ? items : [];
                const foundGeneral = this.chats.find((c) => c && c.type === "general") || null;
                this.generalChat = foundGeneral;
                this.updateTotalUnreadCount();
            } catch (error) {
                console.error("[MessengerBadge] Ошибка загрузки чатов:", error);
            }
        },
        updateTotalUnreadCount() {
            let total = 0;
            // generalChat — ссылка на элемент из chats, не считаем его дважды
            (this.chats || []).forEach((chat) => {
                if (chat && chat.unread_count) {
                    total += Number(chat.unread_count) || 0;
                }
            });
            this.totalUnreadCount = total;
        },
        handleNewMessage(event) {
            // Обновляем счетчик при получении нового сообщения
            const chatId = Number(event?.chat_id);
            if (!chatId) {
                // Если нет chat_id, перезагружаем чаты
                this.loadChats();
                return;
            }

            const myUserId = this.$store.state.user?.id;
            const isMyMessage = myUserId && Number(event?.user?.id) === Number(myUserId);
            const currentPath = this.$route?.path;

            // Если сообщение не от нас и мы не на странице мессенджера, увеличиваем счетчик
            if (!isMyMessage && currentPath !== "/messenger") {
                // Обновляем локальное состояние чата
                const chat = this.chats.find((c) => Number(c.id) === chatId);
                if (chat) {
                    chat.unread_count = (chat.unread_count || 0) + 1;
                } else if (this.generalChat && Number(this.generalChat.id) === chatId) {
                    this.generalChat.unread_count = (this.generalChat.unread_count || 0) + 1;
                }
                this.updateTotalUnreadCount();
            } else if (currentPath === "/messenger") {
                // Если мы на странице мессенджера, перезагружаем для актуальности
                setTimeout(() => {
                    this.loadChats();
                }, 300);
            }
        },
        handleReadUpdate(event) {
            // При обновлении прочтения обновляем счетчик
            const chatId = Number(event?.chat_id);
            if (chatId) {
                const chat = this.chats.find((c) => Number(c.id) === chatId);
                if (chat) {
                    // Сбрасываем счетчик для этого чата (так как он был прочитан)
                    chat.unread_count = 0;
                } else if (this.generalChat && Number(this.generalChat.id) === chatId) {
                    this.generalChat.unread_count = 0;
                }
                this.updateTotalUnreadCount();
            } else {
                // Если нет chat_id, перезагружаем
                this.loadChats();
            }
        },
        handleUnreadUpdated(event) {
            // Обновляем счетчик при явном обновлении unread_count
            const chatId = Number(event?.chatId);
            const unreadCount = Number(event?.unreadCount) || 0;
            
            if (chatId) {
                const chat = this.chats.find((c) => Number(c.id) === chatId);
                if (chat) {
                    chat.unread_count = unreadCount;
                } else if (this.generalChat && Number(this.generalChat.id) === chatId) {
                    this.generalChat.unread_count = unreadCount;
                }
                this.updateTotalUnreadCount();
            } else {
                // Если нет chat_id, перезагружаем
                this.loadChats();
            }
        },
    },
    watch: {
        // Слушаем изменения маршрута, чтобы обновить счетчик при возврате на мессенджер
        "$route.path"(newPath) {
            if (newPath === "/messenger") {
                // При открытии мессенджера обновляем счетчик
                setTimeout(() => {
                    this.loadChats();
                }, 500);
            }
        },
    },
};
</script>

<style scoped>
</style>

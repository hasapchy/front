<template>
    <template v-if="inline">
        <span
            v-if="totalUnreadCount > 0"
            class="ml-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] inline-flex items-center justify-center shrink-0"
        >
            {{ totalUnreadCount > 99 ? '99+' : totalUnreadCount }}
        </span>
    </template>
    <router-link
        v-else-if="hasPermission"
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
    props: {
        inline: { type: Boolean, default: false }
    },
    data() {
        return {
            totalUnreadCount: 0,
            chats: [],
        };
    },
    computed: {
        hasPermission() {
            return this.$store.getters.hasPermission("chats_view_all");
        },
    },
    async mounted() {
        if (!this.hasPermission && !this.inline) return;

        await this.loadChats();

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
                this.updateTotalUnreadCount();
            } catch (error) {
                console.error("[MessengerBadge] Ошибка загрузки чатов:", error);
            }
        },
        updateTotalUnreadCount() {
            let total = 0;
            (this.chats || []).forEach((chat) => {
                if (chat && chat.unread_count) {
                    total += Number(chat.unread_count) || 0;
                }
            });
            this.totalUnreadCount = total;
        },
        findChatById(chatId) {
            return (this.chats || []).find((c) => c && Number(c.id) === Number(chatId)) || null;
        },
        handleNewMessage(event) {
            const chatId = Number(event?.chat_id);
            if (!chatId) {
                this.loadChats();
                return;
            }

            const myUserId = this.$store.state.user?.id;
            const isMyMessage = myUserId && Number(event?.user?.id) === Number(myUserId);
            const currentPath = this.$route?.path;

            // Если сообщение не от нас и мы не на странице мессенджера, увеличиваем счетчик
            if (!isMyMessage && currentPath !== "/messenger") {
                const chat = this.findChatById(chatId);
                if (chat) {
                    chat.unread_count = (chat.unread_count || 0) + 1;
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
            const chatId = Number(event?.chat_id);
            if (!chatId) {
                this.loadChats();
                return;
            }
            const chat = this.findChatById(chatId);
            if (chat) {
                chat.unread_count = 0;
                this.updateTotalUnreadCount();
            } else {
                this.loadChats();
            }
        },
        handleUnreadUpdated(event) {
            const chatId = Number(event?.chatId);
            const unreadCount = Number(event?.unreadCount) ?? 0;
            if (!chatId) {
                this.loadChats();
                return;
            }
            const chat = this.findChatById(chatId);
            if (chat) {
                chat.unread_count = unreadCount;
                this.updateTotalUnreadCount();
            } else {
                this.loadChats();
            }
        },
    },
    watch: {
        "$route.path"(newPath) {
            if (newPath === "/messenger") {
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

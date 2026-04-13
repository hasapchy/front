<template>
    <template v-if="inline">
        <span v-if="totalUnreadCount > 0"
            class="ml-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] inline-flex items-center justify-center shrink-0">
            {{ totalUnreadCount > 99 ? '99+' : totalUnreadCount }}
        </span>
    </template>
    <router-link v-else-if="hasPermission" to="/messenger"
        class="relative flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-[var(--nav-accent)] transition-colors hover:bg-gray-50 dark:border-0 dark:bg-white dark:text-[var(--nav-accent)] dark:hover:bg-white/90"
        title="Чат">
        <i class="fas fa-comments text-lg" />
        <span v-if="totalUnreadCount > 0"
            class="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] flex items-center justify-center shrink-0">
            {{ totalUnreadCount > 99 ? '99+' : totalUnreadCount }}
        </span>
    </router-link>
</template>

<script>
import ChatController from "@/api/ChatController";
import { eventBus } from "@/eventBus";
import soundManager from "@/utils/soundUtils";

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
    watch: {
        "$route.path"(newPath) {
            if (newPath === "/messenger") {
                setTimeout(() => {
                    this.loadChats();
                }, 500);
            }
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
                if (chat && chat.unreadCount) {
                    total += Number(chat.unreadCount) || 0;
                }
            });
            this.totalUnreadCount = total;
        },
        findChatById(chatId) {
            return (this.chats || []).find((c) => c && Number(c.id) === Number(chatId)) || null;
        },
        handleNewMessage(event) {
            const chatId = Number(event?.chatId);
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
                    chat.unreadCount = (chat.unreadCount || 0) + 1;
                }
                this.updateTotalUnreadCount();
            } else if (currentPath === "/messenger") {
                setTimeout(() => {
                    this.loadChats();
                }, 300);
            }
            if (!isMyMessage) {
                soundManager.playMessage();
            }
        },
        handleReadUpdate(event) {
            const chatId = Number(event?.chatId);
            if (!chatId) {
                this.loadChats();
                return;
            }
            const chat = this.findChatById(chatId);
            if (chat) {
                chat.unreadCount = 0;
                this.updateTotalUnreadCount();
            } else {
                this.loadChats();
            }
        },
        handleUnreadUpdated(event) {
            const chatId = Number(event?.chatId);
            const unreadCount = event?.unreadCount == null ? 0 : Number(event.unreadCount);
            if (!chatId) {
                this.loadChats();
                return;
            }
            const chat = this.findChatById(chatId);
            if (chat) {
                chat.unreadCount = unreadCount;
                this.updateTotalUnreadCount();
            } else {
                this.loadChats();
            }
            if (unreadCount === 0) {
                setTimeout(() => {
                    this.loadChats();
                }, 400);
            }
        },
    },
};
</script>

<style scoped></style>

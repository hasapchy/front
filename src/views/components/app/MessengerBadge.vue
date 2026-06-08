<template>
    <template v-if="inline">
        <span v-if="totalUnreadCount > 0"
            class="ml-1 min-w-5 h-5 px-1 rounded-full bg-[var(--color-danger)] text-white text-[11px] inline-flex items-center justify-center shrink-0">
            {{ totalUnreadCount > 99 ? '99+' : totalUnreadCount }}
        </span>
    </template>
    <router-link v-else-if="hasPermission" to="/messenger"
        class="relative flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-[var(--nav-accent)] transition-colors hover:bg-gray-50 dark:border-0 dark:bg-white dark:text-[var(--nav-accent)] dark:hover:bg-white/90"
        title="Чат">
        <i class="fas fa-comments text-lg" />
        <span v-if="totalUnreadCount > 0"
            class="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[var(--color-danger)] text-white text-[11px] flex items-center justify-center shrink-0">
            {{ totalUnreadCount > 99 ? '99+' : totalUnreadCount }}
        </span>
    </router-link>
</template>

<script>
import { eventBus } from "@/eventBus";
import soundManager from "@/utils/soundUtils";

function eventChatId(event) {
    return Number(event?.chatId ?? event?.chat_id) || null;
}

export default {
    name: "MessengerBadge",
    props: {
        inline: { type: Boolean, default: false }
    },
    computed: {
        hasPermission() {
            return this.$store.getters.hasPermission("chats_view_all");
        },
        totalUnreadCount() {
            return this.$store.getters.chatsTotalUnread;
        },
    },
    mounted() {
        if (!this.hasPermission && !this.inline) {
            return;
        }
        eventBus.on("chat:message", this.onMessage);
        eventBus.on("chat:read", this.onRead);
        eventBus.on("chat:unread-updated", this.onUnreadUpdated);
    },
    beforeUnmount() {
        eventBus.off("chat:message", this.onMessage);
        eventBus.off("chat:read", this.onRead);
        eventBus.off("chat:unread-updated", this.onUnreadUpdated);
    },
    methods: {
        onMessage(event) {
            const chatId = eventChatId(event);
            const myUserId = this.$store.state.user?.id;
            const isMyMessage = myUserId && Number(event?.user?.id) === Number(myUserId);

            if (!isMyMessage) {
                soundManager.playMessage();
            }
            if (isMyMessage || this.$route.path === "/messenger") {
                return;
            }

            const chat = this.$store.getters.chats.find((c) => Number(c?.id) === chatId);
            if (!chatId) {
                this.$store.dispatch("loadChats");
                return;
            }
            if (chat) {
                this.$store.commit("PATCH_CHAT_UNREAD", {
                    chatId,
                    unreadCount: (Number(chat.unreadCount) || 0) + 1,
                });
            } else {
                this.$store.dispatch("loadChats");
            }
        },
        onRead(event) {
            const chatId = eventChatId(event);
            if (!chatId) {
                return;
            }
            this.$store.commit("PATCH_CHAT_UNREAD", { chatId, unreadCount: 0 });
        },
        onUnreadUpdated(event) {
            const chatId = eventChatId(event);
            if (!chatId) {
                return;
            }
            const unreadCount = event.unreadCount == null ? 0 : Number(event.unreadCount);
            this.$store.commit("PATCH_CHAT_UNREAD", { chatId, unreadCount });
        },
    },
};
</script>

<style scoped></style>

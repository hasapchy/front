<template>
  <teleport to="body">
    <transition name="fade-dialog">
      <div
        v-if="show"
        class="fixed inset-0 z-[100]"
        data-app-overlay-dialog
        @mousedown.stop
      >
        <div class="absolute inset-0 bg-black/40" @click="onclose" />
        <div class="relative flex min-h-full items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            class="w-full max-w-sm rounded-lg border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-[var(--surface-elevated)]"
          >
            <div class="border-b border-gray-200 px-4 py-3 dark:border-white/10">
              <div class="text-sm font-semibold text-gray-900 dark:text-[var(--text-primary)]">
                {{ userName }}
              </div>
            </div>
            <div class="flex flex-col gap-2 p-4">
              <button
                type="button"
                class="flex w-full items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
                :disabled="!canWriteChat"
                @click="openChat"
              >
                <span>{{ $t('userActionWriteChat') }}</span>
                <i class="fas fa-comments text-xs" />
              </button>
              <button
                type="button"
                class="flex w-full items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
                :disabled="!canOpenProfile"
                @click="openProfile"
              >
                <span>{{ $t('userActionOpenProfile') }}</span>
                <i class="fas fa-id-card text-xs" />
              </button>
              <button
                type="button"
                class="flex w-full items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
                :disabled="!canOpenSessions"
                @click="openSessions"
              >
                <span>{{ $t('userActionOpenSessions') }}</span>
                <i class="fas fa-clock text-xs" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script>
import ChatController from '@/api/ChatController';

export default {
    name: 'UserActionsModal',
    props: {
        show: { type: Boolean, required: true },
        user: { type: Object, required: false, default: null },
        onclose: { type: Function, required: true },
    },
    computed: {
        currentUserId() {
            return Number(this.$store.getters.user?.id);
        },
        userId() {
            return Number(this.user?.id);
        },
        isSelfUser() {
            return this.userId > 0 && this.currentUserId > 0 && this.userId === this.currentUserId;
        },
        userName() {
            return String(this.user?.name || this.$t('userActionTitle'));
        },
        canWriteChat() {
            return this.hasChatAccess && this.userId > 0 && !this.isSelfUser;
        },
        canOpenProfile() {
            return this.$store.getters.hasPermission('users_view') && this.userId > 0;
        },
        canOpenSessions() {
            return this.canOpenProfile && Boolean(this.$store.getters.user?.isAdmin);
        },
        hasChatAccess() {
            return this.$store.getters.hasPermission('chats_view_all') ||
                this.$store.getters.hasPermission('chats_view');
        }
    },
    mounted() {
        window.addEventListener('keydown', this.handleEscape);
    },
    beforeUnmount() {
        window.removeEventListener('keydown', this.handleEscape);
    },
    methods: {
        handleEscape(event) {
            if (event.key === 'Escape' && this.show) {
                this.onclose();
            }
        },
        async openChat() {
            if (!this.canWriteChat) {
                return;
            }
            try {
                const chat = await ChatController.startDirectChat(this.userId);
                if (!chat?.id) {
                    return;
                }
                await this.$router.push({
                    path: '/messenger',
                    query: { open_chat: String(chat.id) }
                });
                this.onclose();
            } catch {
                return;
            }
        },
        async openProfile() {
            if (!this.canOpenProfile) {
                return;
            }
            await this.$router.push(`/users/${this.userId}`);
            this.onclose();
        },
        async openSessions() {
            if (!this.canOpenSessions) {
                return;
            }
            await this.$router.push({
                path: `/users/${this.userId}`,
                query: { tab: 'sessions' }
            });
            this.onclose();
        }
    }
};
</script>

<style scoped>
.fade-dialog-enter-active,
.fade-dialog-leave-active {
  transition: opacity 0.15s ease;
}

.fade-dialog-enter-from,
.fade-dialog-leave-to {
  opacity: 0;
}
</style>

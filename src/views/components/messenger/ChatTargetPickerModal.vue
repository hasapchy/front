<template>
  <teleport to="body">
    <div
      v-if="visible"
      data-app-overlay-dialog
      class="chat-target-picker-modal fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
      @mousedown.self="$emit('close')"
    >
      <div
        class="mx-4 w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-xl"
        role="dialog"
        aria-modal="true"
        :aria-label="title || $t('shareInChat')"
        @mousedown.stop
      >
      <div class="border-b border-[var(--border-subtle)] px-6 py-4">
        <h3 class="text-lg font-semibold text-[var(--text-primary)]">
          {{ title || $t('shareInChat') }}
        </h3>
      </div>
      <div class="max-h-96 overflow-y-auto px-6 py-4">
        <div
          v-if="loading"
          class="flex items-center justify-center py-8 text-[var(--text-secondary)]"
        >
          <i class="fas fa-spinner fa-spin" />
        </div>
        <div
          v-else-if="loadError"
          class="py-6 text-center text-sm text-[var(--color-danger)]"
        >
          {{ loadError }}
        </div>
        <div
          v-else-if="!chatItems.length"
          class="py-6 text-center text-sm text-[var(--text-secondary)]"
        >
          {{ $t('noChatsAvailable') }}
        </div>
        <div
          v-else
          class="space-y-2"
        >
          <button
            v-for="chat in chatItems"
            :key="`${chat.type}-${chat.id || chat.chatId || chat.userId}`"
            type="button"
            class="flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left hover:bg-[var(--surface-muted)]"
            :class="isSelected(chat) ? 'border-[var(--nav-accent)] bg-[color-mix(in_srgb,var(--nav-accent)_12%,var(--surface-muted))]' : 'border-transparent'"
            @click="selectedTarget = chat"
          >
            <div class="relative shrink-0">
              <img
                v-if="chat.type === 'user' && chat.photo"
                :src="userPhotoUrl(chat.photo)"
                class="h-10 w-10 rounded-full border border-[var(--border-subtle)] object-cover"
                alt=""
                @error="applyAvatarImageFallback"
              >
              <div
                v-else-if="chat.type === 'user'"
                class="flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-success)_22%,var(--surface-muted))] text-xs font-semibold text-[color-mix(in_srgb,var(--color-success)_75%,#000)] dark:bg-[color-mix(in_srgb,var(--color-success)_18%,var(--surface-page))] dark:text-[var(--color-success)]"
              >
                {{ getUserInitials(chat) }}
              </div>
              <div
                v-else
                class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--text-primary)]"
              >
                <i
                  class="fas"
                  :class="chatIcon(chat)"
                />
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-medium text-[var(--text-primary)]">
                {{ getChatPickerTitle(chat) }}
              </div>
            </div>
          </button>
        </div>
      </div>
      <div class="border-t border-[var(--border-subtle)] px-6 py-4">
        <div
          v-if="selectedTarget"
          class="mb-2 text-xs text-[var(--text-secondary)]"
        >
          {{ $t('shareTo') }}: <span class="font-medium text-[var(--text-primary)]">{{ getChatPickerTitle(selectedTarget) }}</span>
        </div>
        <textarea
          v-model="comment"
          class="max-h-28 min-h-[44px] w-full resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--input-bg)] px-4 py-2 text-sm !shadow-none text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-[var(--nav-accent)] focus:ring-2 focus:ring-[var(--nav-accent)]/25"
          :placeholder="commentPlaceholder || $t('shareCommentPlaceholder')"
          :disabled="sending"
        />
        <div class="mt-3 flex items-center justify-end gap-3">
          <button
            type="button"
            class="rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
            :disabled="sending"
            @click="$emit('close')"
          >
            {{ $t('cancel') }}
          </button>
          <button
            type="button"
            class="rounded-lg bg-[var(--nav-accent)] px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
            :disabled="!selectedTarget || sending"
            @click="submit"
          >
            <i
              v-if="sending"
              class="fas fa-spinner fa-spin mr-1"
            />
            {{ $t('entityShareSend') }}
          </button>
        </div>
      </div>
      </div>
    </div>
  </teleport>
</template>

<script>
import ChatController from '@/api/ChatController';
import { applyAvatarImageFallback } from '@/constants/imageFallback';
import { buildChatPickerItems, getChatPickerTitle } from '@/utils/chatPickerUtils';
import { chatIcon } from '@/utils/chatTypes';
import { getUserInitials } from '@/utils/displayUtils';
import { getImageUrl } from '@/utils/dtoUtils';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import { SIDE_MODAL_NEST } from '@/constants/sideModalNest';

export default {
  mixins: [getApiErrorMessageMixin],
  inject: {
    sideModalNest: { from: SIDE_MODAL_NEST, default: null },
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: '',
    },
    commentPlaceholder: {
      type: String,
      default: '',
    },
    excludeChatId: {
      type: [Number, String],
      default: null,
    },
  },
  emits: ['close', 'submit'],
  data() {
    return {
      loading: false,
      sending: false,
      loadError: '',
      selectedTarget: null,
      comment: '',
      localChats: [],
    };
  },
  computed: {
    usersForCompany() {
      return this.$store.getters.usersForCurrentCompany || [];
    },
    chatItems() {
      return buildChatPickerItems({
        chats: this.localChats,
        users: this.usersForCompany,
        currentUserId: this.$store.state.user?.id,
        excludeChatId: this.excludeChatId,
      });
    },
  },
  watch: {
    visible: {
      immediate: true,
      handler(isVisible, wasVisible) {
        if (isVisible) {
          this.sideModalNest?.suspendTrap?.();
          this.resetState();
          this.loadChats();
          return;
        }
        if (wasVisible) {
          this.sideModalNest?.resumeTrap?.();
        }
      },
    },
  },
  beforeUnmount() {
    if (this.visible) {
      this.sideModalNest?.resumeTrap?.();
    }
  },
  methods: {
    applyAvatarImageFallback,
    chatIcon,
    getChatPickerTitle,
    getUserInitials,
    resetState() {
      this.selectedTarget = null;
      this.comment = '';
      this.sending = false;
      this.loadError = '';
    },
    async loadChats() {
      this.loading = true;
      this.loadError = '';
      try {
        await this.$store.dispatch('loadChats', { force: true });
        this.localChats = await ChatController.getChats();
      } catch (e) {
        this.localChats = [];
        this.loadError = this.getApiErrorMessage(e);
      } finally {
        this.loading = false;
      }
    },
    userPhotoUrl(path) {
      return getImageUrl(path) || '';
    },
    isSelected(chat) {
      if (!this.selectedTarget) {
        return false;
      }
      if (chat.type === 'user' && this.selectedTarget.type === 'user') {
        return Number(chat.id) === Number(this.selectedTarget.id);
      }
      const chatId = chat.chatId ?? chat.id;
      const selectedId = this.selectedTarget.chatId ?? this.selectedTarget.id;
      return Number(chatId) === Number(selectedId) && String(chat.type) === String(this.selectedTarget.type);
    },
    submit() {
      if (!this.selectedTarget || this.sending) {
        return;
      }
      this.$emit('submit', {
        target: this.selectedTarget,
        comment: (this.comment || '').trim(),
      });
    },
    setSending(value) {
      this.sending = value;
    },
  },
};
</script>

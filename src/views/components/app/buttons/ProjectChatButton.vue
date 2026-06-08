<template>
  <button
    v-if="visible"
    type="button"
    class="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--nav-accent)] hover:bg-[color-mix(in_srgb,var(--nav-accent)_10%,transparent)] disabled:cursor-not-allowed disabled:opacity-50"
    :disabled="loading"
    :aria-label="$t('openProjectChat')"
    :title="$t('openProjectChat')"
    @click.stop="handleClick"
  >
    <i
      v-if="loading"
      class="fas fa-spinner fa-spin text-sm"
    />
    <i
      v-else
      class="fas fa-comments text-sm"
    />
    <span
      v-if="unreadCount > 0"
      class="absolute -right-0.5 -top-0.5 inline-flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[10px] font-semibold leading-none text-white"
    >
      {{ unreadLabel }}
    </span>
  </button>
</template>

<script>
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import {
  getProjectChatUnread,
  hasChatsViewPermission,
  openProjectChat,
} from '@/utils/projectChat';

export default {
  name: 'ProjectChatButton',
  mixins: [getApiErrorMessageMixin],
  props: {
    projectId: {
      type: [Number, String],
      default: null,
    },
    beforeOpen: {
      type: Function,
      default: null,
    },
    closeOnSuccess: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['opened', 'close-request'],
  data() {
    return {
      loading: false,
    };
  },
  computed: {
    visible() {
      return Boolean(this.projectId) && hasChatsViewPermission(this.$store.getters);
    },
    unreadCount() {
      return getProjectChatUnread(this.$store, this.projectId);
    },
    unreadLabel() {
      return this.unreadCount > 99 ? '99+' : String(this.unreadCount);
    },
  },
  methods: {
    async handleClick() {
      if (this.loading || !this.visible) {
        return;
      }
      this.loading = true;
      try {
        if (this.beforeOpen) {
          const allowed = await this.beforeOpen();
          if (!allowed) {
            return;
          }
        }
        const chat = await openProjectChat(this.$router, this.projectId);
        if (!chat?.id) {
          return;
        }
        this.$emit('opened', chat);
        if (this.closeOnSuccess) {
          this.$emit('close-request');
        }
      } catch (error) {
        this.$store.dispatch('showNotification', {
          title: this.$t('projectChat'),
          subtitle: this.getApiErrorMessage(error),
          isDanger: true,
          duration: 5000,
        });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

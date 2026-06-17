<template>
  <div
    v-if="visible"
    style="display: contents"
  >
    <EntityShareBookmarkTabs
      :can-share-in-chat="canShareInChat"
      @copy-link="handleCopyLink"
      @open-share-modal="openShareModal"
    />
    <ChatTargetPickerModal
      ref="sharePickerRef"
      :visible="shareModalVisible"
      @close="closeShareModal"
      @submit="handleShareSubmit"
    />
  </div>
</template>

<script>
import EntityShareBookmarkTabs from '@/views/components/app/EntityShareBookmarkTabs.vue';
import ChatTargetPickerModal from '@/views/components/messenger/ChatTargetPickerModal.vue';
import notificationMixin from '@/mixins/notificationMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import { buildEntityShareUrl, copyTextToClipboard } from '@/utils/entityLinkUtils';
import { shareEntityToChat } from '@/services/entityShareService';

export default {
  components: {
    EntityShareBookmarkTabs,
    ChatTargetPickerModal,
  },
  mixins: [notificationMixin, getApiErrorMessageMixin],
  props: {
    entityType: {
      type: String,
      required: true,
    },
    entityItem: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      shareModalVisible: false,
    };
  },
  computed: {
    entityId() {
      return this.entityItem?.id;
    },
    visible() {
      return this.entityId != null && this.entityId !== '';
    },
    canShareInChat() {
      return this.$store.getters.hasPermission('chats_write')
        && (this.$store.getters.hasPermission('chats_view_all') || this.$store.getters.hasPermission('chats_view'));
    },
  },
  methods: {
    async handleCopyLink() {
      const url = buildEntityShareUrl(this.entityType, this.entityId);
      if (!url) {
        this.showNotification(this.$t('error'), this.$t('entityShareFailed'), { isDanger: true });
        return;
      }
      try {
        await copyTextToClipboard(url);
        this.showNotification(this.$t('linkCopied'), '', { isInfo: true, duration: 2500 });
      } catch (e) {
        this.showNotification(this.$t('error'), this.getApiErrorMessage(e), { isDanger: true });
      }
    },
    openShareModal() {
      this.shareModalVisible = true;
    },
    closeShareModal() {
      this.shareModalVisible = false;
    },
    async handleShareSubmit({ target, comment }) {
      const picker = this.$refs.sharePickerRef;
      picker?.setSending?.(true);
      try {
        const { chatId } = await shareEntityToChat({
          entityType: this.entityType,
          item: this.entityItem,
          target,
          comment,
        });
        this.showNotification(this.$t('entityShareSuccess'), '', {
          duration: 8000,
          actionLabel: this.$t('goToChat'),
          actionIcon: 'fa-comments',
          onAction: () => {
            this.$router.push({
              path: '/messenger',
              query: { open_chat: String(chatId) },
            });
          },
        });
        this.closeShareModal();
      } catch (e) {
        this.showNotification(this.$t('error'), this.getApiErrorMessage(e), { isDanger: true });
      } finally {
        picker?.setSending?.(false);
      }
    },
  },
};
</script>

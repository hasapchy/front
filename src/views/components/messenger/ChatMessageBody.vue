<template>
  <div class="chat-message-body">
    <span
      v-if="commentBody"
      class="whitespace-pre-wrap break-words"
      v-html="renderText(commentBody)"
    />
    <ChatEntityLinkCard
      v-if="entityMetadata"
      :entity="entityMetadata.entity"
      :entity-id="entityMetadata.entity_id"
      :url="entityMetadata.url"
      :icon="entityMetadata.icon"
      verify-access
    />
    <template v-else-if="segments.length">
      <template
        v-for="(segment, index) in segments"
        :key="`${segment.kind}-${index}`"
      >
        <ChatEntityLinkCard
          v-if="segment.kind === 'entity_link'"
          :entity="segment.entity"
          :entity-id="segment.entity_id"
          :url="segment.url"
          lazy
        />
        <span
          v-else
          class="whitespace-pre-wrap break-words"
          v-html="renderText(segment.value)"
        />
      </template>
    </template>
    <span
      v-else-if="body"
      class="whitespace-pre-wrap break-words"
      v-html="renderText(body)"
    />
  </div>
</template>

<script>
import ChatEntityLinkCard from '@/views/components/messenger/ChatEntityLinkCard.vue';
import { buildEntityShareUrl, parseEntityLinksInText, isEntityLinkMetadata } from '@/utils/entityLinkUtils';

export default {
  components: {
    ChatEntityLinkCard,
  },
  props: {
    body: {
      type: String,
      default: '',
    },
    metadata: {
      type: Object,
      default: null,
    },
    searchQuery: {
      type: String,
      default: '',
    },
  },
  computed: {
    entityMetadata() {
      return isEntityLinkMetadata(this.metadata) ? this.metadata : null;
    },
    commentBody() {
      if (!this.body || !this.entityMetadata) {
        return '';
      }
      const trimmed = String(this.body).trim();
      const shareUrl = buildEntityShareUrl(this.entityMetadata.entity, this.entityMetadata.entity_id);
      if (!trimmed || (shareUrl && trimmed === shareUrl)) {
        return '';
      }
      const path = String(this.entityMetadata.url || '').trim();
      if (path && trimmed === path) {
        return '';
      }
      return this.body;
    },
    segments() {
      if (!this.body || this.entityMetadata) {
        return [];
      }
      const parsed = parseEntityLinksInText(this.body);
      if (parsed.length === 1 && parsed[0].kind === 'text') {
        return [];
      }
      return parsed;
    },
  },
  methods: {
    escapeHtml(value) {
      const div = document.createElement('div');
      div.textContent = value;
      return div.innerHTML;
    },
    renderText(value) {
      if (!value) {
        return '';
      }
      const escaped = this.escapeHtml(value);
      const q = (this.searchQuery || '').trim();
      if (!q) {
        return escaped;
      }
      const pattern = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return escaped.replace(pattern, '<mark class="bg-yellow-200 dark:bg-yellow-500/30 rounded px-0.5">$1</mark>');
    },
  },
};
</script>

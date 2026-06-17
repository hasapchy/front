<template>
  <EntityBookmarkTab
    :icon-class="'fas fa-paperclip text-[11px]'"
    :aria-label="$t('copyLink')"
    @click="$emit('copy-link')"
  />
  <EntityBookmarkTab
    v-if="canShareInChat"
    :icon-class="'fas fa-paper-plane text-[11px]'"
    :aria-label="$t('shareInChat')"
    @click="$emit('open-share-modal')"
  />
</template>

<script>
import EntityBookmarkTab from '@/views/components/app/EntityBookmarkTab.vue';

export default {
  components: {
    EntityBookmarkTab,
  },
  props: {
    canShareInChat: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['copy-link', 'open-share-modal'],
};
</script>

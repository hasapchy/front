<template>
  <div
    v-if="hasBookmarks"
    style="display: contents"
  >
    <EntityShareBookmark
      v-if="showEntityShare"
      :entity-type="entityType"
      :entity-item="entityItem"
    />
    <EntityBookmarkTab
      v-for="tab in visibleTabs"
      :key="tab.key"
      :icon-class="tab.iconClass"
      :aria-label="tab.label"
      :variant="tab.variant || 'accent'"
      :disabled="Boolean(tab.disabled)"
      :badge="tab.badge || ''"
      @click="handleTabClick(tab)"
    />
    <slot />
  </div>
</template>

<script>
import EntityBookmarkTab from '@/views/components/app/EntityBookmarkTab.vue';
import EntityShareBookmark from '@/views/components/app/EntityShareBookmark.vue';

export default {
  components: {
    EntityBookmarkTab,
    EntityShareBookmark,
  },
  props: {
    entityType: {
      type: String,
      default: '',
    },
    entityItem: {
      type: Object,
      default: null,
    },
    tabs: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['action'],
  computed: {
    showEntityShare() {
      const id = this.entityItem?.id;
      return Boolean(this.entityType) && id != null && id !== '';
    },
    visibleTabs() {
      return (this.tabs || []).filter((tab) => tab.visible !== false);
    },
    hasBookmarks() {
      return this.showEntityShare
        || this.visibleTabs.length > 0
        || Boolean(this.$slots.default);
    },
  },
  methods: {
    handleTabClick(tab) {
      if (tab.disabled) {
        return;
      }
      if (typeof tab.onClick === 'function') {
        tab.onClick();
      }
      this.$emit('action', tab.key);
    },
  },
};
</script>

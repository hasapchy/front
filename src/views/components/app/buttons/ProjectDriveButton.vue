<template>
  <EntityBookmarkTab
    v-if="variant === 'bookmark'"
    :icon-class="iconClass"
    :aria-label="buttonLabel"
    :disabled="isDisabled"
    @click="handleClick"
  />
  <button
    v-else
    type="button"
    class="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--nav-accent)] hover:bg-[color-mix(in_srgb,var(--nav-accent)_10%,transparent)] disabled:cursor-not-allowed disabled:opacity-50"
    :class="{ 'cursor-pointer': !isDisabled }"
    :disabled="isDisabled"
    :aria-label="buttonLabel"
    :title="buttonLabel"
    @click.stop="handleClick"
  >
    <i
      v-if="loading"
      class="fas fa-spinner fa-spin text-sm"
    />
    <i
      v-else
      :class="iconClass"
      class="text-sm"
    />
  </button>
</template>

<script>
import EntityBookmarkTab from '@/views/components/app/EntityBookmarkTab.vue';
import { DRIVE_PROJECT_LINKED_FOLDER_ICON } from '@/constants/driveFolderIcons';

export default {
  name: 'ProjectDriveButton',
  components: {
    EntityBookmarkTab,
  },
  props: {
    linked: {
      type: Boolean,
      default: false,
    },
    folderId: {
      type: [Number, String],
      default: null,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    variant: {
      type: String,
      default: 'bookmark',
      validator: (value) => ['bookmark', 'icon'].includes(value),
    },
  },
  emits: ['click', 'close-request'],
  computed: {
    iconClass() {
      if (this.loading) {
        return 'fas fa-spinner fa-spin text-[11px]';
      }
      return this.linked ? `${DRIVE_PROJECT_LINKED_FOLDER_ICON} text-[11px]` : 'fa-solid fa-folder-tree text-[11px]';
    },
    buttonLabel() {
      if (this.linked) {
        return this.$t('projectDriveFolderLinked');
      }
      return this.$t('projectDriveFolderLinkButton');
    },
    isDisabled() {
      if (this.loading) {
        return true;
      }
      if (this.linked) {
        return !this.folderId || !this.$store.getters.hasPermission('drive_view');
      }
      return this.disabled;
    },
  },
  methods: {
    async handleClick() {
      if (this.isDisabled) {
        return;
      }
      if (this.linked && this.folderId) {
        try {
          await this.$router.push({
          path: '/drive',
          query: { folder_id: String(this.folderId) },
          });
        } finally {
          this.$emit('close-request');
        }
        return;
      }
      this.$emit('click');
    },
  },
};
</script>

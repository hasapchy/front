<template>
  <CenteredModalDialog
    :show-form="visible"
    :title="$t('moveToFolder')"
    :onclose="handleClose"
  >
    <p class="mb-3 truncate text-sm text-gray-600 dark:text-[var(--text-secondary)]">
      <template v-if="fileIds.length > 1">
        <strong>{{ $t('totalFiles') }}:</strong> {{ fileIds.length }}
      </template>
      <template v-else>
        <strong>{{ $t('fileName') }}:</strong> {{ fileName }}
      </template>
    </p>
    <div class="mb-2 flex flex-wrap items-center gap-1 text-xs">
      <button
        type="button"
        class="rounded border border-gray-300 px-2 py-1 text-gray-800 hover:bg-gray-50 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface-muted)]"
        :disabled="loading"
        @click="$emit('browse', null)"
      >
        {{ $t('driveRoot') }}
      </button>
      <div
        v-for="crumb in breadcrumbs"
        :key="`move-crumb-${crumb.id}`"
        class="inline-flex items-center gap-1"
      >
        <span class="text-gray-400 dark:text-[var(--text-secondary)]">/</span>
        <button
          type="button"
          class="max-w-[8rem] truncate rounded border border-gray-300 px-2 py-1 text-gray-800 hover:bg-gray-50 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface-muted)]"
          :disabled="loading"
          @click="$emit('browse', crumb.id)"
        >
          {{ crumb.name }}
        </button>
      </div>
    </div>
    <div class="max-h-48 space-y-0.5 overflow-y-auto rounded-lg border border-gray-200 p-1 dark:border-[var(--border-subtle)]">
      <button
        v-for="folder in folders"
        :key="`move-folder-${folder.id}`"
        type="button"
        class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-gray-800 hover:bg-gray-100 dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface-muted)]"
        :disabled="loading || isTargetDisabled(folder.id)"
        @click="$emit('browse', folder.id)"
      >
        <i
          :class="folderIconClass(folder)"
          :style="folderIconStyle(folder)"
        />
        <span class="truncate">{{ folder.name }}</span>
      </button>
      <CardViewEmptyState
        v-if="!loading && folders.length === 0"
        class="mx-2"
      />
    </div>
    <template #footer>
      <PrimaryButton :is-light="true" :onclick="() => $emit('close')">
        {{ $t('cancel') }}
      </PrimaryButton>
      <PrimaryButton
        :onclick="() => $emit('confirm')"
        :disabled="loading || isTargetDisabled(browseParentId)"
      >
        {{ $t('moveHere') }}
      </PrimaryButton>
    </template>
  </CenteredModalDialog>
</template>

<script>
import CenteredModalDialog from '@/views/components/app/dialog/CenteredModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import CardViewEmptyState from '@/views/components/app/cards/CardViewEmptyState.vue';
import { driveFolderIconClass, driveFolderIconColor } from '@/constants/driveFolderIcons';

export default {
  name: 'DriveMoveDialog',
  components: {
    CenteredModalDialog,
    PrimaryButton,
    CardViewEmptyState,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    fileIds: {
      type: Array,
      default: () => [],
    },
    fileName: {
      type: String,
      default: '-',
    },
    folders: {
      type: Array,
      default: () => [],
    },
    breadcrumbs: {
      type: Array,
      default: () => [],
    },
    browseParentId: {
      type: [Number, null],
      default: null,
    },
    isTargetDisabled: {
      type: Function,
      required: true,
    },
  },
  emits: ['close', 'confirm', 'browse'],
  methods: {
    handleClose() {
      this.$emit('close');
    },
    folderIconClass: driveFolderIconClass,
    folderIconStyle(folder) {
      return { color: driveFolderIconColor(folder) };
    },
  },
};
</script>

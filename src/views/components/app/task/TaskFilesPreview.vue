<template>
  <div class="min-w-0 w-full">
    <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-[var(--text-secondary)]">
      {{ $t('files') }}
    </label>
    <div
      v-if="files.length > 0"
      class="flex min-w-0 flex-wrap gap-2"
    >
      <a
        v-for="file in files"
        :key="file.path"
        :href="file.url"
        target="_blank"
        rel="noopener noreferrer"
        :title="file.name"
        class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-50 transition-colors hover:border-[color-mix(in_srgb,var(--nav-accent)_40%,var(--border-subtle))] dark:border-[var(--border-subtle)] dark:bg-[var(--surface-muted)]"
      >
        <img
          v-if="isImageFile(file)"
          :src="file.url"
          :alt="file.name"
          class="h-full w-full object-cover"
        >
        <i
          v-else
          :class="file.icon || 'far fa-file'"
          class="text-lg text-gray-600 dark:text-[var(--text-secondary)]"
        />
      </a>
    </div>
    <p
      v-else
      class="text-sm text-gray-500 dark:text-[var(--text-secondary)]"
    >
      {{ $t('noFilesUploaded') }}
    </p>
  </div>
</template>

<script>
import { isImageFile } from '@/utils/fileDragUtils';

export default {
    name: 'TaskFilesPreview',
    props: {
        files: {
            type: Array,
            default: () => [],
        },
    },
    methods: {
        isImageFile,
    },
};
</script>

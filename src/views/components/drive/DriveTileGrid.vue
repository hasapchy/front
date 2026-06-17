<template>
  <div class="relative min-h-[280px] flex-1 overflow-visible rounded-xl bg-gray-100/60 p-4 dark:bg-[var(--surface-muted)]/35">
    <div v-if="uploading" class="mb-4 rounded-lg bg-white/90 px-3 py-2 shadow-sm ring-1 ring-[var(--nav-accent)]/25 dark:bg-[var(--surface-elevated)] dark:ring-[var(--nav-accent)]/30">
      <div class="mb-1 flex items-center justify-between text-xs text-[var(--nav-accent)]">
        <span>{{ $t('upload') }}: {{ uploadProgress.filesCount }}</span>
        <span>{{ uploadProgress.percent }}%</span>
      </div>
      <div class="h-2 w-full rounded-full bg-[color-mix(in_srgb,var(--nav-accent)_18%,var(--surface-muted))]">
        <div
          class="h-2 rounded-full bg-[var(--nav-accent)] transition-all duration-200"
          :style="{ width: `${uploadProgress.percent}%` }"
        />
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4 overflow-visible sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      <div
        v-for="folder in folders"
        :key="`tile-folder-${folder.id}`"
        class="relative overflow-visible cursor-pointer rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-[color-mix(in_srgb,var(--label-accent)_40%,#e5e7eb)] dark:bg-[var(--surface-elevated)] dark:ring-white/10 dark:hover:ring-[color-mix(in_srgb,var(--label-accent)_45%,transparent)]"
        :class="{
          'ring-2 ring-[var(--nav-accent)] bg-[color-mix(in_srgb,var(--label-accent)_10%,#ffffff)] shadow-md dark:bg-[color-mix(in_srgb,var(--label-accent)_12%,var(--surface-elevated))]': dragOverFolderId === folder.id,
          'z-20': activeMenuKey === `folder-${folder.id}`,
        }"
        @dblclick="$emit('open-folder', folder.id)"
        @dragover.prevent.stop="$emit('folder-drag-over', $event, folder.id)"
        @dragleave.prevent.stop="$emit('folder-drag-leave', $event, folder.id)"
        @drop.prevent.stop="$emit('folder-drop', $event, folder.id)"
      >
        <div class="mb-2 flex h-8 items-center justify-end gap-1">
          <span
            v-if="folderIsProjectLinked(folder)"
            class="flex h-8 w-8 shrink-0 items-center justify-center"
            :title="$t('driveProjectLinked')"
          >
            <i :class="[DRIVE_PROJECT_LINKED_FOLDER_ICON, 'text-sm text-[var(--label-accent)]']" />
          </span>
          <span
            v-if="folder.isShared"
            class="flex h-8 w-8 shrink-0 items-center justify-center"
            :title="$t('driveShared')"
          >
            <i class="fas fa-users text-sm text-[var(--label-accent)]" />
          </span>
          <button
            type="button"
            class="relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-[var(--text-secondary)] dark:hover:bg-[var(--surface-muted)] dark:hover:text-[var(--text-primary)]"
            @click.stop="$emit('toggle-menu', `folder-${folder.id}`)"
            @dragstart.stop
          >
            <i class="fas fa-ellipsis-v" />
          </button>
        </div>
        <div class="mb-2 flex h-16 w-full items-center justify-center">
          <i
            :class="[folderIconClass(folder), 'text-4xl']"
            :style="folderIconStyle(folder)"
          />
        </div>
        <div class="w-full truncate text-center text-sm font-medium text-gray-800 dark:text-[var(--text-primary)]">
          {{ folder.name }}
        </div>
        <div
          v-if="activeMenuKey === `folder-${folder.id}`"
          class="absolute right-3 top-12 z-30 w-44 rounded-lg border border-gray-200 bg-white p-1 text-gray-800 shadow-lg dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:text-[var(--text-primary)]"
          @click.stop
        >
          <button type="button" class="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)]" @click="$emit('folder-open', folder)"><i class="fas fa-folder-open mr-2" />{{ $t('open') }}</button>
          <button
            type="button"
            class="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)]"
            :disabled="!$store.getters.hasPermission('drive_update')"
            @click="$emit('rename-folder', folder)"
          >
            <i class="fas fa-pen mr-2" />{{ $t('edit') }}
          </button>
          <button type="button" class="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)]" :disabled="!$store.getters.hasPermission('drive_update')" @click="$emit('share-folder', folder)"><i class="fas fa-share-alt mr-2" />{{ $t('shareAccess') }}</button>
          <button type="button" class="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)]" @click="$emit('details-folder', folder)"><i class="fas fa-circle-info mr-2" />{{ $t('details') }}</button>
          <button
            v-if="!folderIsProjectLinked(folder)"
            type="button"
            class="w-full rounded px-3 py-2 text-left text-sm text-[var(--color-danger)] hover:bg-[color-mix(in_srgb,var(--color-danger)_12%,var(--surface-muted))]"
            :disabled="!$store.getters.hasPermission('drive_delete')"
            @click="$emit('delete-folder', folder.id)"
          >
            <i class="fas fa-trash mr-2" />{{ $t('delete') }}
          </button>
        </div>
      </div>

      <div
        v-for="file in files"
        :key="`tile-file-${file.id}`"
        class="relative overflow-visible rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-[color-mix(in_srgb,var(--label-accent)_40%,#e5e7eb)] dark:bg-[var(--surface-elevated)] dark:ring-white/10 dark:hover:ring-[color-mix(in_srgb,var(--label-accent)_45%,transparent)]"
        :class="{
          'z-20': activeMenuKey === `file-${file.id}`,
          'opacity-60': draggingFileId === file.id,
          'ring-2 ring-[var(--nav-accent)] shadow-md': selectedIds.includes(file.id),
        }"
        draggable="true"
        @dragstart="$emit('file-drag-start', $event, file)"
        @dragend="$emit('file-drag-end')"
      >
        <div class="mb-2 flex items-start justify-between gap-2">
          <input
            type="checkbox"
            class="mt-0.5 shrink-0 cursor-pointer rounded border-gray-300 bg-white text-[var(--nav-accent)] focus:ring-[var(--nav-accent)] dark:border-gray-500 dark:bg-[var(--surface-muted)]"
            :checked="selectedIds.includes(file.id)"
            @click.stop
            @change="$emit('toggle-file-selection', file.id)"
          >
          <div class="ml-auto flex h-8 items-center gap-1">
            <span
              v-if="file.isShared"
              class="flex h-8 w-8 shrink-0 items-center justify-center"
              :title="$t('driveShared')"
            >
              <i class="fas fa-users text-sm text-[var(--label-accent)]" />
            </span>
            <button
              type="button"
              class="relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-[var(--text-secondary)] dark:hover:bg-[var(--surface-muted)] dark:hover:text-[var(--text-primary)]"
              @click.stop="$emit('toggle-menu', `file-${file.id}`)"
              @dragstart.stop
            >
              <i class="fas fa-ellipsis-v" />
            </button>
          </div>
        </div>
        <div class="mb-2 flex h-16 w-full items-center justify-center overflow-hidden">
          <img
            v-if="filePreviewUrls[file.id]"
            :src="filePreviewUrls[file.id]"
            :alt="file.name"
            class="max-h-16 max-w-full object-contain"
            @error="$emit('preview-error', file.id)"
          >
          <i v-else :class="[fileIconClassFor(file), 'text-4xl']" />
        </div>
        <div class="w-full truncate text-center text-sm font-medium text-gray-800 dark:text-[var(--text-primary)]">
          {{ file.name }}
        </div>
        <div
          v-if="activeMenuKey === `file-${file.id}`"
          class="absolute right-3 top-12 z-30 w-44 rounded-lg border border-gray-200 bg-white p-1 text-gray-800 shadow-lg dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:text-[var(--text-primary)]"
          @click.stop
        >
          <button type="button" class="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)]" @click="$emit('download-file', file)"><i class="fas fa-download mr-2" />{{ $t('download') }}</button>
          <button type="button" class="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)]" :disabled="!$store.getters.hasPermission('drive_update')" @click="$emit('rename-file', file)"><i class="fas fa-pen mr-2" />{{ $t('renameFile') }}</button>
          <button type="button" class="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)]" :disabled="!$store.getters.hasPermission('drive_update')" @click="$emit('move-file', file)"><i class="fas fa-folder-tree mr-2" />{{ $t('moveToFolder') }}</button>
          <button type="button" class="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)]" :disabled="!$store.getters.hasPermission('drive_update')" @click="$emit('share-file', file)"><i class="fas fa-share-alt mr-2" />{{ $t('shareAccess') }}</button>
          <button type="button" class="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)]" @click="$emit('details-file', file)"><i class="fas fa-circle-info mr-2" />{{ $t('details') }}</button>
          <button type="button" class="w-full rounded px-3 py-2 text-left text-sm text-[var(--color-danger)] hover:bg-[color-mix(in_srgb,var(--color-danger)_12%,var(--surface-muted))]" :disabled="!$store.getters.hasPermission('drive_delete')" @click="$emit('delete-file', file.id)"><i class="fas fa-trash mr-2" />{{ $t('delete') }}</button>
        </div>
      </div>
    </div>

    <CardViewEmptyState
      v-if="!loading && folders.length === 0 && files.length === 0"
      class="mt-4"
    />
  </div>
</template>

<script>
import DriveController from "@/api/DriveController";
import CardViewEmptyState from '@/views/components/app/cards/CardViewEmptyState.vue';
import {
  DRIVE_PROJECT_LINKED_FOLDER_ICON,
  driveFolderIconClass,
  driveFolderIconColor,
  driveFolderIsProjectLinked,
} from "@/constants/driveFolderIcons";

export default {
  name: "DriveTileGrid",
  components: { CardViewEmptyState },
  props: {
    folders: { type: Array, default: () => [] },
    files: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    uploading: { type: Boolean, default: false },
    uploadProgress: { type: Object, required: true },
    filePreviewUrls: { type: Object, default: () => ({}) },
    selectedIds: { type: Array, default: () => [] },
    activeMenuKey: { type: String, default: null },
    dragOverFolderId: { type: [Number, null], default: null },
    draggingFileId: { type: [Number, null], default: null },
  },
  emits: [
    "open-folder",
    "folder-drag-over",
    "folder-drag-leave",
    "folder-drop",
    "toggle-menu",
    "folder-open",
    "rename-folder",
    "share-folder",
    "details-folder",
    "delete-folder",
    "file-drag-start",
    "file-drag-end",
    "toggle-file-selection",
    "preview-error",
    "download-file",
    "rename-file",
    "move-file",
    "share-file",
    "details-file",
    "delete-file",
  ],
  data() {
    return {
      DRIVE_PROJECT_LINKED_FOLDER_ICON,
    };
  },
  methods: {
    folderIsProjectLinked: driveFolderIsProjectLinked,
    folderIconClass: driveFolderIconClass,
    folderIconStyle(folder) {
      return { color: driveFolderIconColor(folder) };
    },
    fileIconClassFor(file) {
      return DriveController.getFileIconClass(file);
    },
  },
};
</script>

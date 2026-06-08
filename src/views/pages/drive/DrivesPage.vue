<template>
  <div
    class="layout-flex-fill-col relative"
    @click="closeMenus"
    @dragenter.prevent="onPageDragEnter"
    @dragover.prevent="onPageDragOver"
    @dragleave.prevent="onPageDragLeave"
    @drop.prevent="onPageDrop"
  >
    <teleport to="body">
      <div
        v-if="isPageDragOver"
        class="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-black/30 p-6"
      >
        <div class="flex w-full max-w-md flex-col items-center rounded-2xl border-2 border-dashed border-[var(--nav-accent)] bg-[color-mix(in_srgb,var(--color-info)_15%,var(--surface-muted))] px-8 py-10 text-center shadow-lg dark:bg-[var(--surface-elevated)]">
          <i class="fas fa-cloud-upload-alt mb-4 text-5xl text-[var(--color-info)]" />
          <p class="text-lg font-semibold text-[var(--color-info)] dark:text-[var(--text-primary)]">
            {{ $t('dropFilesToUpload') }}
          </p>
        </div>
      </div>
    </teleport>
    <TableControlsBar :show-pagination="false">
      <template #left>
        <PrimaryButton
          icon="fas fa-folder-plus"
          :onclick="openCreateFolder"
          :disabled="!$store.getters.hasPermission('drive_create')"
          :aria-label="$t('createFolder')"
        />
        <PrimaryButton
          icon="fas fa-cloud-upload-alt"
          :is-light="true"
          :onclick="openFileUploadPicker"
          :disabled="!canUploadFiles()"
          :aria-label="$t('upload')"
        />
        <input
          ref="fileInput"
          type="file"
          multiple
          class="hidden"
          @change="onFilesInputChange($event, false)"
        >
        <PrimaryButton
          icon="fas fa-folder-open"
          :is-light="true"
          :onclick="openFolderUploadPicker"
          :disabled="!canUploadFiles()"
          :aria-label="$t('uploadFolder')"
        />
        <input
          ref="folderInput"
          type="file"
          webkitdirectory
          directory
          multiple
          class="hidden"
          @change="onFilesInputChange($event, true)"
        >
        <button
          v-if="files.length"
          type="button"
          class="inline-flex h-[38px] w-[38px] items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          :title="$t('selectAll')"
          :aria-label="$t('selectAll')"
          @click="toggleSelectAllFilesFromButton"
        >
          <i
            :class="[
              allFilesSelected ? 'fas fa-check-square' : someFilesSelected ? 'fas fa-minus-square' : 'far fa-square',
              allFilesSelected || someFilesSelected ? 'text-[var(--nav-accent)]' : '',
            ]"
          />
        </button>
        <input
          ref="selectAllFilesInput"
          type="checkbox"
          class="hidden"
          tabindex="-1"
          aria-hidden="true"
          :checked="allFilesSelected"
        >
        <transition name="fade">
          <BatchButton
            v-if="selectedIds.length"
            :selected-ids="selectedIds"
            :batch-actions="getBatchActions()"
            :show-status-select="false"
          />
        </transition>
      </template>
    </TableControlsBar>

    <div class="mb-3 flex flex-wrap items-center gap-1 text-sm text-gray-600 dark:text-[var(--text-secondary)]">
      <button
        type="button"
        class="rounded-md px-2.5 py-1 font-medium transition-colors hover:bg-white/80 hover:text-gray-900 disabled:opacity-50 dark:hover:bg-[var(--surface-elevated)] dark:hover:text-[var(--text-primary)]"
        :disabled="loading"
        @click="goRoot"
      >
        <i class="fas fa-home text-xs opacity-70" />
      </button>
      <span
        v-for="(crumb, index) in breadcrumbs"
        :key="`crumb-${crumb.id}`"
        class="inline-flex items-center gap-1"
      >
        <span class="text-gray-300 dark:text-[var(--text-muted)]">/</span>
        <button
          type="button"
          class="max-w-[12rem] truncate rounded-md px-2.5 py-1 transition-colors hover:bg-white/80 hover:text-gray-900 disabled:opacity-50 dark:hover:bg-[var(--surface-elevated)] dark:hover:text-[var(--text-primary)]"
          :class="index === breadcrumbs.length - 1 ? 'font-semibold text-gray-900 dark:text-[var(--text-primary)]' : ''"
          :disabled="loading"
          @click="openFolder(crumb.id)"
        >
          {{ crumb.name }}
        </button>
      </span>
    </div>

    <DriveTileGrid
      :folders="folders"
      :files="files"
      :loading="loading"
      :uploading="uploading"
      :upload-progress="uploadProgress"
      :file-preview-urls="filePreviewUrls"
      :selected-ids="selectedIds"
      :active-menu-key="activeMenuKey"
      :drag-over-folder-id="dragOverFolderId"
      :dragging-file-id="draggingFileId"
      @open-folder="openFolder"
      @folder-drag-over="onFolderDragOver"
      @folder-drag-leave="onFolderDragLeave"
      @folder-drop="onFolderDrop"
      @toggle-menu="toggleItemMenu"
      @folder-open="onTileFolderOpen"
      @rename-folder="onTileRenameFolder"
      @share-folder="onTileShareFolder"
      @details-folder="onTileDetailsFolder"
      @delete-folder="onTileDeleteFolder"
      @file-drag-start="onFileDragStart"
      @file-drag-end="onFileDragEnd"
      @toggle-file-selection="toggleFileSelection"
      @preview-error="onFilePreviewError"
      @download-file="onTileDownloadFile"
      @rename-file="onTileRenameFile"
      @move-file="onTileMoveFile"
      @share-file="onTileShareFile"
      @details-file="onTileDetailsFile"
      @delete-file="onTileDeleteFile"
    />

    <DriveFolderDialog
      :visible="folderDialog.visible"
      :icon-picker-visible="folderIconPickerVisible"
      :folder-dialog="folderDialog"
      :dialog-title="getItemDialogTitle()"
      :folder-icon-options="folderIconOptions"
      :folder-icon-colors="folderIconColors"
      @close="closeFolderDialog"
      @save="saveFolder"
      @toggle-icon-picker="folderIconPickerVisible = !folderIconPickerVisible"
      @select-icon="selectFolderIcon"
      @update-name="folderDialog.name = $event"
      @update-icon-color="folderDialog.iconColor = $event"
    />

    <DriveMoveDialog
      :visible="moveDialog.visible"
      :loading="moveDialog.loading"
      :file-ids="moveDialog.fileIds"
      :file-name="moveDialogFileName"
      :folders="moveDialog.folders"
      :breadcrumbs="moveDialog.breadcrumbs"
      :browse-parent-id="moveDialog.browseParentId"
      :is-target-disabled="isMoveTargetDisabled"
      @close="closeMoveDialog"
      @confirm="confirmMoveHere"
      @browse="browseMoveParent"
    />

    <DriveShareDialog
      ref="shareDialog"
      :visible="shareDialog.visible"
      :resource-id="shareDialog.resourceId"
      :resource-type="shareDialog.resourceType"
      :resource-name="shareDialog.resourceName"
      :resource-item="shareDialog.resourceItem"
      @close="closeShareDialog"
      @saved="onShareSaved"
    />

    <DriveItemDetailsPanel
      :visible="detailsDialog.visible"
      :type="detailsDialog.type"
      :item="detailsDialog.item"
      @close="closeDetails"
    />

    <AlertDialog
      :dialog="itemDeleteDialog.visible"
      :descr="$t('confirmDelete')"
      :confirm-text="$t('delete')"
      :leave-text="$t('cancel')"
      @confirm="confirmDelete"
      @leave="closeItemDeleteDialog"
    />
    <AlertDialog
      :dialog="deleteDialog"
      :descr="`${$t('confirmDeleteSelected')} (${idsToDelete.length})?`"
      :confirm-text="$t('delete')"
      :leave-text="$t('cancel')"
      @confirm="confirmDeleteItems"
      @leave="deleteDialog = false"
    />
  </div>
</template>

<script>
import DriveController from '@/api/DriveController';
import { clearDrivePreviewCache } from '@/cache/drivePreviewCache';
import notificationMixin from '@/mixins/notificationMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import DriveFolderDialog from '@/views/components/drive/DriveFolderDialog.vue';
import DriveMoveDialog from '@/views/components/drive/DriveMoveDialog.vue';
import DriveShareDialog from '@/views/components/drive/DriveShareDialog.vue';
import DriveItemDetailsPanel from '@/views/components/drive/DriveItemDetailsPanel.vue';
import DriveTileGrid from '@/views/components/drive/DriveTileGrid.vue';
import driveDragDropMixin from '@/mixins/driveDragDropMixin';
import {
  loadDriveConfig,
  getFolderIconOptions,
  getFolderIconColorDefault,
} from '@/utils/driveConfig';
import {
  DRIVE_FOLDER_ICON_COLORS,
  DRIVE_FOLDER_ICON_DEFAULT,
  driveFolderIconClass,
  driveFolderIconColor,
} from '@/constants/driveFolderIcons';

export default {
  name: 'DrivesPage',
  components: {
    PrimaryButton,
    TableControlsBar,
    AlertDialog,
    BatchButton,
    DriveFolderDialog,
    DriveMoveDialog,
    DriveShareDialog,
    DriveItemDetailsPanel,
    DriveTileGrid,
  },
  mixins: [notificationMixin, getApiErrorMessageMixin, batchActionsMixin, companyChangeMixin, driveDragDropMixin],
  data() {
    return {
      controller: DriveController,
      deletePermission: 'drive_delete',
      loading: false,
      parentId: null,
      folders: [],
      files: [],
      breadcrumbs: [],
      folderDialog: {
        visible: false,
        mode: 'create',
        resourceType: 'folder',
        id: null,
        name: '',
        fileExtension: '',
        icon: DRIVE_FOLDER_ICON_DEFAULT,
        iconColor: getFolderIconColorDefault(),
      },
      folderIconPickerVisible: false,
      folderIconOptions: getFolderIconOptions(),
      folderIconColors: DRIVE_FOLDER_ICON_COLORS,
      shareDialog: {
        visible: false,
        resourceType: 'folder',
        resourceId: null,
        resourceName: '',
        resourceItem: null,
      },
      activeMenuKey: null,
      detailsDialog: {
        visible: false,
        type: null,
        item: null,
      },
      moveDialog: {
        visible: false,
        fileIds: [],
        browseParentId: null,
        folders: [],
        breadcrumbs: [],
        loading: false,
      },
      filePreviewUrls: {},
      itemDeleteDialog: {
        visible: false,
        type: null,
        id: null,
      },
    };
  },
  async mounted() {
    this.$store.commit('SET_SETTINGS_OPEN', false);
    this.parentId = this.getParentIdFromRoute(this.$route);
    try {
      await loadDriveConfig();
      this.folderIconOptions = getFolderIconOptions();
      this.folderDialog.iconColor = getFolderIconColorDefault();
    } catch (error) {
      this.showNotification(this.$t('error'), this.getApiErrorMessage(error).join('\n') || this.$t('errorGettingData'), true);
    }
    await this.fetchItems();
  },
  beforeUnmount() {
    this.revokeFilePreviewUrls();
  },
  computed: {
    allFilesSelected() {
      return this.files.length > 0 && this.selectedIds.length === this.files.length;
    },
    someFilesSelected() {
      return this.selectedIds.length > 0 && !this.allFilesSelected;
    },
    moveDialogFileName() {
      const fileId = this.moveDialog.fileIds[0];
      if (!fileId) {
        return '-';
      }
      return this.files.find((item) => item.id === fileId)?.name || '-';
    },
    isAnyModalOpen() {
      return this.folderDialog.visible
        || this.moveDialog.visible
        || this.shareDialog.visible
        || this.detailsDialog.visible
        || this.itemDeleteDialog.visible
        || this.deleteDialog;
    },
  },
  watch: {
    someFilesSelected: {
      handler(value) {
        this.$nextTick(() => {
          const input = this.$refs.selectAllFilesInput;
          if (input) {
            input.indeterminate = value;
          }
        });
      },
      immediate: true,
    },
    isAnyModalOpen(value) {
      if (value) {
        this.closeMenus();
      }
    },
    '$route.query.folder_id'(value) {
      const routeParentId = this.normalizeFolderId(value);
      if (routeParentId === this.parentId) {
        return;
      }
      this.parentId = routeParentId;
      this.fetchItems();
    },
  },
  methods: {
    async handleCompanyChanged() {
      this.parentId = null;
      this.syncRouteFolderId(null);
      this.revokeFilePreviewUrls();
      this.selectedIds = [];
      this.closeMenus();
      await this.fetchItems();
    },
    normalizeFolderId(value) {
      const parsed = Number.parseInt(String(value ?? ''), 10);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        return null;
      }
      return parsed;
    },
    getParentIdFromRoute(route) {
      return this.normalizeFolderId(route?.query?.folder_id);
    },
    syncRouteFolderId(parentId) {
      const nextValue = parentId ? String(parentId) : undefined;
      const currentValue = this.$route?.query?.folder_id;
      if ((currentValue ?? undefined) === (nextValue ?? undefined)) {
        return;
      }
      const query = { ...(this.$route?.query || {}) };
      if (nextValue === undefined) {
        delete query.folder_id;
      } else {
        query.folder_id = nextValue;
      }
      this.$router.replace({ query }).catch(() => {});
    },
    getBatchActions() {
      const actions = [];
      if (this.$store.getters.hasPermission('drive_delete')) {
        actions.push({
          icon: 'fas fa-trash',
          type: 'danger',
          action: this.deleteItems,
          disabled: this.loadingBatch,
          ariaLabel: this.$t('delete'),
        });
      }
      if (this.$store.getters.hasPermission('drive_update')) {
        actions.push({
          icon: 'fas fa-folder-tree',
          type: 'info',
          action: this.openBatchMove,
          disabled: this.loadingBatch,
          ariaLabel: this.$t('moveToFolder'),
        });
      }
      return actions;
    },
    toggleFileSelection(fileId) {
      if (this.selectedIds.includes(fileId)) {
        this.selectedIds = this.selectedIds.filter((id) => id !== fileId);
      } else {
        this.selectedIds = [...this.selectedIds, fileId];
      }
    },
    openFileUploadPicker() {
      this.$refs.fileInput?.click();
    },
    openFolderUploadPicker() {
      this.$refs.folderInput?.click();
    },
    toggleSelectAllFilesFromButton() {
      if (this.allFilesSelected) {
        this.selectedIds = [];
      } else {
        this.selectedIds = this.files.map((file) => file.id);
      }
    },
    async fetchItems() {
      this.loading = true;
      this.selectedIds = [];
      try {
        const listing = await DriveController.getItems(this.parentId);
        this.folders = listing.folders;
        this.files = listing.files;
        this.breadcrumbs = listing.breadcrumbs;
        await this.loadImagePreviews();
      } catch (error) {
        this.showNotification(this.$t('error'), this.getApiErrorMessage(error).join('\n') || this.$t('errorGettingData'), true);
      } finally {
        this.loading = false;
      }
    },
    revokePreviewUrl(fileId) {
      const url = this.filePreviewUrls[fileId];
      if (!url && !(fileId in this.filePreviewUrls)) {
        return;
      }
      if (url) {
        window.URL.revokeObjectURL(url);
      }
      const nextPreviewUrls = { ...this.filePreviewUrls };
      delete nextPreviewUrls[fileId];
      this.filePreviewUrls = nextPreviewUrls;
    },
    revokeFilePreviewUrls() {
      Object.keys(this.filePreviewUrls).forEach((fileId) => {
        this.revokePreviewUrl(fileId);
      });
    },
    async loadImagePreviews() {
      const companyId = this.currentCompanyId;
      if (!companyId) {
        return;
      }
      const imageFiles = this.files.filter((file) => DriveController.isImageFile(file));
      const activeIds = new Set(imageFiles.map((file) => file.id));
      const nextPreviewUrls = { ...this.filePreviewUrls };
      Object.keys(nextPreviewUrls).forEach((fileId) => {
        if (!activeIds.has(Number(fileId))) {
          const url = nextPreviewUrls[fileId];
          if (url) {
            window.URL.revokeObjectURL(url);
          }
          delete nextPreviewUrls[fileId];
        }
      });
      const previewEntries = await Promise.all(imageFiles.map(async (file) => {
        if (nextPreviewUrls[file.id]) {
          return null;
        }
        try {
          const url = await DriveController.fetchFilePreviewUrl(file.id, companyId);
          return url ? [file.id, url] : null;
        } catch {
          return null;
        }
      }));
      previewEntries.forEach((entry) => {
        if (entry) {
          nextPreviewUrls[entry[0]] = entry[1];
        }
      });
      this.filePreviewUrls = nextPreviewUrls;
    },
    onFilePreviewError(fileId) {
      this.$nextTick(async () => {
        const companyId = this.currentCompanyId;
        this.revokePreviewUrl(fileId);
        if (companyId) {
          await clearDrivePreviewCache(companyId, fileId);
        }
      });
    },
    openFolder(id) {
      this.parentId = this.normalizeFolderId(id);
      this.syncRouteFolderId(this.parentId);
      this.closeMenus();
      this.fetchItems();
    },
    goRoot() {
      this.parentId = null;
      this.syncRouteFolderId(null);
      this.closeMenus();
      this.fetchItems();
    },
    getItemDialogTitle() {
      if (this.folderDialog.mode === 'create') {
        return this.$t('createFolder');
      }
      if (this.folderDialog.resourceType === 'file') {
        return this.$t('renameFile');
      }
      return this.$t('renameFolder');
    },
    openCreateFolder() {
      this.closeMenus();
      this.folderDialog = {
        visible: true,
        mode: 'create',
        resourceType: 'folder',
        id: null,
        name: '',
        fileExtension: '',
        icon: DRIVE_FOLDER_ICON_DEFAULT,
        iconColor: getFolderIconColorDefault(),
      };
      this.folderIconPickerVisible = false;
    },
    openRenameFolder(folder) {
      this.closeMenus();
      this.folderDialog = {
        visible: true,
        mode: 'rename',
        resourceType: 'folder',
        id: folder.id,
        name: folder.name,
        fileExtension: '',
        icon: driveFolderIconClass(folder),
        iconColor: driveFolderIconColor(folder),
      };
      this.folderIconPickerVisible = false;
    },
    selectFolderIcon(icon) {
      this.folderDialog.icon = icon;
      this.folderIconPickerVisible = false;
    },
    openRenameFile(file) {
      this.closeMenus();
      const extension = DriveController.getFileExtension(file);
      Object.assign(this.folderDialog, {
        visible: true,
        mode: 'rename',
        resourceType: 'file',
        id: file.id,
        name: DriveController.splitFileBaseName(file.name, extension),
        fileExtension: extension,
      });
    },
    closeFolderDialog() {
      this.folderDialog.visible = false;
      this.folderIconPickerVisible = false;
    },
    async saveFolder() {
      const name = String(this.folderDialog.name || '').trim();
      if (!name) {
        const message = this.folderDialog.resourceType === 'file'
          ? this.$t('driveFileNameRequired')
          : this.$t('driveFolderNameRequired');
        this.showNotification(this.$t('error'), message, true);
        return;
      }
      try {
        if (this.folderDialog.resourceType === 'file') {
          const fileName = DriveController.buildFileName(
            name,
            this.folderDialog.fileExtension,
          );
          if (!fileName) {
            this.showNotification(this.$t('error'), this.$t('driveFileNameRequired'), true);
            return;
          }
          await DriveController.renameFile(this.folderDialog.id, {
            name: fileName,
          });
        } else if (this.folderDialog.mode === 'create') {
          await DriveController.createFolder({
            name,
            parent_id: this.parentId,
            icon: this.folderDialog.icon,
            icon_color: this.folderDialog.iconColor,
          });
        } else {
          await DriveController.renameFolder(this.folderDialog.id, {
            name,
            icon: this.folderDialog.icon,
            icon_color: this.folderDialog.iconColor,
          });
        }
        this.closeFolderDialog();
        await this.fetchItems();
      } catch (error) {
        this.showNotification(this.$t('error'), this.getApiErrorMessage(error).join('\n') || this.$t('errorSavingData'), true);
      }
    },
    async deleteFolder(id) {
      try {
        await DriveController.deleteFolder(id);
        this.closeMenus();
        await this.fetchItems();
      } catch (error) {
        this.showNotification(this.$t('error'), this.getApiErrorMessage(error).join('\n') || this.$t('errorDeletingData'), true);
      }
    },
    onTileFolderOpen(folder) {
      this.openFolder(folder.id);
      this.closeMenus();
    },
    onTileRenameFolder(folder) {
      this.openRenameFolder(folder);
      this.closeMenus();
    },
    onTileShareFolder(folder) {
      this.openShareModal('folder', folder);
      this.closeMenus();
    },
    onTileDetailsFolder(folder) {
      this.openDetails('folder', folder);
      this.closeMenus();
    },
    onTileDeleteFolder(id) {
      this.requestDelete('folder', id);
      this.closeMenus();
    },
    onTileDownloadFile(file) {
      this.downloadFile(file);
      this.closeMenus();
    },
    onTileRenameFile(file) {
      this.openRenameFile(file);
      this.closeMenus();
    },
    onTileMoveFile(file) {
      this.openMoveFile(file);
      this.closeMenus();
    },
    onTileShareFile(file) {
      this.openShareModal('file', file);
      this.closeMenus();
    },
    onTileDetailsFile(file) {
      this.openDetails('file', file);
      this.closeMenus();
    },
    onTileDeleteFile(id) {
      this.requestDelete('file', id);
      this.closeMenus();
    },
    isMoveTargetDisabled(targetFolderId) {
      const { fileIds } = this.moveDialog;
      if (fileIds.length === 0) {
        return true;
      }
      const targetId = this.normalizeFolderId(targetFolderId);
      return fileIds.every((fileId) => {
        const file = this.files.find((item) => item.id === fileId);
        return this.normalizeFolderId(file?.folder_id) === targetId;
      });
    },
    openBatchMove(ids) {
      if (!Array.isArray(ids) || ids.length === 0) {
        return;
      }
      this.closeMenus();
      this.moveDialog.visible = true;
      this.moveDialog.fileIds = [...ids];
      this.moveDialog.browseParentId = this.parentId;
      this.loadMoveBrowseFolders();
    },
    async openMoveFile(file) {
      this.openBatchMove([file.id]);
    },
    closeMoveDialog() {
      this.moveDialog.visible = false;
      this.moveDialog.fileIds = [];
      this.moveDialog.browseParentId = null;
      this.moveDialog.folders = [];
      this.moveDialog.breadcrumbs = [];
      this.moveDialog.loading = false;
    },
    async loadMoveBrowseFolders() {
      this.moveDialog.loading = true;
      try {
        const listing = await DriveController.getItems(this.moveDialog.browseParentId);
        this.moveDialog.folders = listing.folders;
        this.moveDialog.breadcrumbs = listing.breadcrumbs;
      } catch (error) {
        this.showNotification(this.$t('error'), this.getApiErrorMessage(error).join('\n') || this.$t('errorGettingData'), true);
      } finally {
        this.moveDialog.loading = false;
      }
    },
    async browseMoveParent(parentId) {
      this.moveDialog.browseParentId = this.normalizeFolderId(parentId);
      await this.loadMoveBrowseFolders();
    },
    async confirmMoveHere() {
      const { fileIds } = this.moveDialog;
      if (fileIds.length === 0 || this.isMoveTargetDisabled(this.moveDialog.browseParentId)) {
        if (fileIds.length > 0) {
          this.showNotification(this.$t('error'), this.$t('moveSameFolder'), true);
        }
        return;
      }
      try {
        await this.performBatchMoveFiles(fileIds, this.moveDialog.browseParentId);
        this.closeMoveDialog();
      } catch (error) {
        this.showNotification(this.$t('error'), this.getApiErrorMessage(error).join('\n') || this.$t('errorSavingData'), true);
      }
    },
    async performBatchMoveFiles(fileIds, targetFolderId) {
      const targetId = this.normalizeFolderId(targetFolderId);
      const idsToMove = fileIds.filter((fileId) => {
        const file = this.files.find((item) => item.id === fileId);
        return this.normalizeFolderId(file?.folder_id) !== targetId;
      });
      if (idsToMove.length === 0) {
        this.showNotification(this.$t('error'), this.$t('moveSameFolder'), true);
        return;
      }
      await DriveController.moveFiles(idsToMove, targetId);
      this.selectedIds = [];
      await this.fetchItems();
      this.showNotification(this.$t('success'), this.$t('savedSuccessfully'), false);
    },
    async downloadFile(file) {
      try {
        await DriveController.downloadFile(file.id, file.name);
      } catch (error) {
        this.showNotification(this.$t('error'), this.getApiErrorMessage(error).join('\n') || this.$t('errorGettingData'), true);
      }
    },
    async afterBatchDelete() {
      const companyId = this.currentCompanyId;
      const ids = [...(this.idsToDelete || [])];
      if (!companyId || ids.length === 0) {
        return;
      }
      await Promise.all(ids.map((id) => clearDrivePreviewCache(companyId, id)));
    },
    async deleteFile(id) {
      try {
        await DriveController.deleteFile(id, this.currentCompanyId);
        this.closeMenus();
        await this.fetchItems();
      } catch (error) {
        this.showNotification(this.$t('error'), this.getApiErrorMessage(error).join('\n') || this.$t('errorDeletingData'), true);
      }
    },
    openShareModal(resourceType, item) {
      this.closeMenus();
      this.shareDialog.visible = true;
      this.shareDialog.resourceType = resourceType;
      this.shareDialog.resourceId = item.id;
      this.shareDialog.resourceName = item.name || '';
      this.shareDialog.resourceItem = resourceType === 'folder' ? item : null;
    },
    closeShareDialog() {
      this.shareDialog.visible = false;
      this.shareDialog.resourceItem = null;
    },
    toggleItemMenu(key) {
      this.activeMenuKey = this.activeMenuKey === key ? null : key;
    },
    closeMenus() {
      this.activeMenuKey = null;
    },
    requestDelete(type, id) {
      this.closeMenus();
      this.itemDeleteDialog.visible = true;
      this.itemDeleteDialog.type = type;
      this.itemDeleteDialog.id = id;
    },
    closeItemDeleteDialog() {
      this.itemDeleteDialog.visible = false;
      this.itemDeleteDialog.type = null;
      this.itemDeleteDialog.id = null;
    },
    async confirmDelete() {
      const { type, id } = this.itemDeleteDialog;
      if (!type || !id) {
        this.closeItemDeleteDialog();
        return;
      }
      if (type === 'folder') {
        await this.deleteFolder(id);
      } else {
        await this.deleteFile(id);
      }
      this.closeItemDeleteDialog();
    },
    openDetails(type, item) {
      this.closeMenus();
      this.detailsDialog.visible = true;
      this.detailsDialog.type = type;
      this.detailsDialog.item = item;
    },
    closeDetails() {
      this.detailsDialog.visible = false;
      this.detailsDialog.type = null;
      this.detailsDialog.item = null;
    },
    async onShareSaved() {
      await this.fetchItems();
    },
  },
};
</script>

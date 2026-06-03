<template>
  <div class="layout-flex-fill-col" @click="closeMenus">
    <TableControlsBar :show-pagination="false">
      <template #left>
        <PrimaryButton
          icon="fas fa-folder-plus"
          :onclick="openCreateFolder"
          :disabled="!$store.getters.hasPermission('drive_create')"
        />
        <button
          type="button"
          class="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="!$store.getters.hasPermission('drive_create') || uploading"
          @click="$refs.fileInput.click()"
        >
          {{ $t('upload') }}
        </button>
        <input
          ref="fileInput"
          type="file"
          multiple
          class="hidden"
          @change="handleFileUpload"
        >
        <button
          type="button"
          class="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="!$store.getters.hasPermission('drive_create') || uploading"
          @click="$refs.folderInput.click()"
        >
          {{ $t('uploadFolder') }}
        </button>
        <input
          ref="folderInput"
          type="file"
          webkitdirectory
          directory
          multiple
          class="hidden"
          @change="handleFolderUpload"
        >
      </template>
    </TableControlsBar>

    <div class="mb-3 flex items-center gap-2 text-sm">
      <button
        type="button"
        class="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
        :disabled="loading"
        @click="goRoot"
      >
        /
      </button>
      <div v-for="crumb in breadcrumbs" :key="crumb.id" class="inline-flex items-center gap-2">
        <span>/</span>
        <button
          type="button"
          class="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
          :disabled="loading"
          @click="openFolder(crumb.id)"
        >
          {{ crumb.name }}
        </button>
      </div>
    </div>

    <div
      class="rounded-lg border border-gray-300 bg-white p-3 transition-colors"
      :class="{ 'border-blue-400 bg-blue-50/40': isContentDragOver }"
      @dragover.prevent="onContentDragOver"
      @dragleave.prevent="onContentDragLeave"
      @drop.prevent="onContentDrop"
    >
      <div
        v-if="isContentDragOver"
        class="mb-3 rounded-md border border-dashed border-blue-400 bg-blue-50 px-3 py-2 text-sm text-blue-700"
      >
        {{ $t('dropFilesToUpload') }}
      </div>
      <div v-if="uploading" class="mb-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
        <div class="mb-1 flex items-center justify-between text-xs text-blue-700">
          <span>{{ $t('upload') }}: {{ uploadProgress.filesCount }}</span>
          <span>{{ uploadProgress.percent }}%</span>
        </div>
        <div class="h-2 w-full rounded-full bg-blue-100">
          <div
            class="h-2 rounded-full bg-blue-500 transition-all duration-200"
            :style="{ width: `${uploadProgress.percent}%` }"
          />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <div
          v-for="folder in folders"
          :key="`tile-folder-${folder.id}`"
          class="relative cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-md"
          :class="{ 'border-blue-400 bg-blue-50': dragOverFolderId === folder.id }"
          @dblclick="openFolder(folder.id)"
          @dragover.prevent.stop="onFolderDragOver(folder.id)"
          @dragleave.prevent.stop="onFolderDragLeave($event, folder.id)"
          @drop.prevent.stop="onFolderDrop($event, folder.id)"
        >
          <div class="mb-2 flex items-start justify-between gap-2">
            <button
              type="button"
              class="truncate text-left font-medium text-gray-800 hover:underline"
              @dblclick="openFolder(folder.id)"
            >
              <div class="mb-2">
                <i :class="[folder.icon || 'fas fa-folder', 'text-4xl text-yellow-400']" />
              </div>
              <div class="truncate text-sm">{{ folder.name }}</div>
            </button>
            <button
              type="button"
              class="h-8 w-8 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              @click.stop="toggleItemMenu(`folder-${folder.id}`)"
            >
              <i class="fas fa-ellipsis-v" />
            </button>
          </div>
          <div
            v-if="activeMenuKey === `folder-${folder.id}`"
            class="absolute right-3 top-12 z-20 w-44 rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
            @click.stop
          >
            <button type="button" class="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100" @click="openFolder(folder.id); closeMenus()"><i class="fas fa-folder-open mr-2" />{{ $t('open') }}</button>
            <button type="button" class="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100" :disabled="!$store.getters.hasPermission('drive_update')" @click="openRenameFolder(folder); closeMenus()"><i class="fas fa-pen mr-2" />{{ $t('edit') }}</button>
            <button type="button" class="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100" :disabled="!$store.getters.hasPermission('drive_share')" @click="openShareModal('folder', folder); closeMenus()"><i class="fas fa-share-alt mr-2" />{{ $t('shareAccess') }}</button>
            <button type="button" class="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100" @click="openDetails('folder', folder); closeMenus()"><i class="fas fa-circle-info mr-2" />{{ $t('details') }}</button>
            <button type="button" class="w-full rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50" :disabled="!$store.getters.hasPermission('drive_delete')" @click="requestDelete('folder', folder.id); closeMenus()"><i class="fas fa-trash mr-2" />{{ $t('delete') }}</button>
          </div>
        </div>

        <div
          v-for="file in files"
          :key="`tile-file-${file.id}`"
          class="relative rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="mb-2 flex items-start justify-between gap-2">
            <div class="min-w-0 truncate text-left font-medium text-gray-800">
              <div class="mb-2">
                <i :class="[getFileIconClass(file), 'text-4xl']" />
              </div>
              <div class="truncate text-sm">{{ file.name }}</div>
            </div>
            <button
              type="button"
              class="h-8 w-8 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              @click.stop="toggleItemMenu(`file-${file.id}`)"
            >
              <i class="fas fa-ellipsis-v" />
            </button>
          </div>
          <div
            v-if="activeMenuKey === `file-${file.id}`"
            class="absolute right-3 top-12 z-20 w-44 rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
            @click.stop
          >
            <button type="button" class="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100" @click="downloadFile(file); closeMenus()"><i class="fas fa-download mr-2" />{{ $t('download') }}</button>
            <button type="button" class="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100" :disabled="!$store.getters.hasPermission('drive_share')" @click="openShareModal('file', file); closeMenus()"><i class="fas fa-share-alt mr-2" />{{ $t('shareAccess') }}</button>
            <button type="button" class="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100" @click="openDetails('file', file); closeMenus()"><i class="fas fa-circle-info mr-2" />{{ $t('details') }}</button>
            <button type="button" class="w-full rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50" :disabled="!$store.getters.hasPermission('drive_delete')" @click="requestDelete('file', file.id); closeMenus()"><i class="fas fa-trash mr-2" />{{ $t('delete') }}</button>
          </div>
        </div>
      </div>

      <div
        v-if="!loading && folders.length === 0 && files.length === 0"
        class="px-3 py-6 text-center text-sm text-gray-500"
      >
        {{ $t('noData') }}
      </div>
    </div>

    <teleport to="body">
      <div
        v-if="folderDialog.visible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
        @click="closeFolderDialog"
      >
        <div
          class="w-full max-w-md rounded-xl bg-white p-4 shadow-xl"
          @click.stop
        >
          <div class="mb-3 text-base font-semibold text-gray-900">
            {{ folderDialog.mode === 'create' ? $t('createFolder') : $t('renameFolder') }}
          </div>
          <input
            v-model.trim="folderDialog.name"
            class="w-full rounded border border-gray-300 px-3 py-2"
            :placeholder="$t('folderName')"
            @keyup.enter="saveFolder"
          >
          <div class="mt-3">
            <label class="mb-1 block text-xs text-gray-600">{{ $t('folderIcon') }}</label>
            <select
              v-model="folderDialog.icon"
              class="w-full rounded border border-gray-300 px-3 py-2"
            >
              <option
                v-for="item in folderIconOptions"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </option>
            </select>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <PrimaryButton :is-light="true" :onclick="closeFolderDialog">
              {{ $t('cancel') }}
            </PrimaryButton>
            <PrimaryButton :onclick="saveFolder">
              {{ $t('save') }}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </teleport>

    <SideModalDialog
      :show-form="shareDialog.visible"
      :title="$t('shareAccess')"
      :onclose="closeShareDialog"
      :close-on-escape="true"
    >
      <div class="grid grid-cols-1 gap-3 p-4">
          <select v-model="shareDialog.subjectType" class="rounded border border-gray-300 px-3 py-2">
            <option value="user">{{ $t('user') }}</option>
            <option value="role">{{ $t('role') }}</option>
          </select>
          <input
            v-model.number="shareDialog.subjectId"
            type="number"
            min="1"
            class="rounded border border-gray-300 px-3 py-2"
            :placeholder="$t('subjectId')"
          >
          <select v-model="shareDialog.ability" class="rounded border border-gray-300 px-3 py-2">
            <option value="view">{{ $t('view') }}</option>
            <option value="upload">{{ $t('create') }}</option>
            <option value="rename">{{ $t('edit') }}</option>
            <option value="delete">{{ $t('delete') }}</option>
            <option value="share">{{ $t('share') }}</option>
          </select>
          <select v-model="shareDialog.effect" class="rounded border border-gray-300 px-3 py-2">
            <option value="allow">{{ $t('allow') }}</option>
            <option value="deny">{{ $t('deny') }}</option>
          </select>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <PrimaryButton :is-light="true" :onclick="closeShareDialog">
            {{ $t('cancel') }}
          </PrimaryButton>
          <PrimaryButton :onclick="savePermission">
            {{ $t('save') }}
          </PrimaryButton>
        </div>
      </template>
    </SideModalDialog>

    <SideModalDialog
      :show-form="detailsDialog.visible"
      :title="$t('details')"
      :onclose="closeDetails"
      :close-on-escape="true"
    >
      <div class="space-y-3 p-4 text-sm">
        <div class="rounded-lg border border-gray-200 p-3"><strong>{{ $t('name') }}:</strong> {{ detailsDialog.item?.name || '-' }}</div>
        <div class="rounded-lg border border-gray-200 p-3"><strong>{{ $t('type') }}:</strong> {{ detailsDialog.type === 'folder' ? $t('folder') : (detailsDialog.item?.mime_type || '-') }}</div>
        <div class="rounded-lg border border-gray-200 p-3"><strong>{{ $t('createdBy') }}:</strong> {{ creatorName(detailsDialog.item?.creator) }}</div>
        <div class="rounded-lg border border-gray-200 p-3"><strong>{{ $t('createdAt') }}:</strong> {{ formatDate(detailsDialog.item?.created_at) }}</div>
        <div v-if="detailsDialog.type === 'file'" class="rounded-lg border border-gray-200 p-3"><strong>{{ $t('size') }}:</strong> {{ formatSize(detailsDialog.item?.size) }}</div>
      </div>
    </SideModalDialog>

    <AlertDialog
      :dialog="deleteDialog.visible"
      :descr="$t('confirmDelete')"
      :confirm-text="$t('delete')"
      :leave-text="$t('cancel')"
      @confirm="confirmDelete"
      @leave="closeDeleteDialog"
    />
  </div>
</template>

<script>
import DriveController from '@/api/DriveController';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';

export default {
  name: 'DrivesPage',
  components: { SideModalDialog, PrimaryButton, TableControlsBar, AlertDialog },
  data() {
    return {
      loading: false,
      uploading: false,
      parentId: null,
      folders: [],
      files: [],
      breadcrumbs: [],
      folderDialog: {
        visible: false,
        mode: 'create',
        id: null,
        name: '',
        icon: 'fas fa-folder',
      },
      shareDialog: {
        visible: false,
        resourceType: 'folder',
        resourceId: null,
        subjectType: 'user',
        subjectId: null,
        ability: 'view',
        effect: 'allow',
      },
      activeMenuKey: null,
      detailsDialog: {
        visible: false,
        type: null,
        item: null,
      },
      isContentDragOver: false,
      dragOverFolderId: null,
      uploadProgress: {
        percent: 0,
        filesCount: 0,
      },
      deleteDialog: {
        visible: false,
        type: null,
        id: null,
      },
      folderIconOptions: [
        { value: 'fas fa-folder', label: 'Folder' },
        { value: 'fas fa-briefcase', label: 'Briefcase' },
        { value: 'fas fa-file-contract', label: 'Contracts' },
        { value: 'fas fa-users', label: 'Team' },
        { value: 'fas fa-chart-line', label: 'Reports' },
        { value: 'fas fa-money-bill-wave', label: 'Finance' },
        { value: 'fas fa-image', label: 'Media' },
        { value: 'fas fa-cogs', label: 'Settings' },
      ],
    };
  },
  mounted() {
    this.$store.commit('SET_SETTINGS_OPEN', false);
    this.parentId = this.getParentIdFromRoute(this.$route);
    this.fetchItems();
  },
  watch: {
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
    async fetchItems() {
      this.loading = true;
      try {
        const data = await DriveController.getItems(this.parentId);
        this.folders = data.folders || [];
        this.files = data.files || [];
        this.breadcrumbs = data.breadcrumbs || [];
      } catch (error) {
        this.$toast?.error(error?.response?.data?.error || this.$t('errorGettingData'));
      } finally {
        this.loading = false;
      }
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
    openCreateFolder() {
      this.folderDialog = { visible: true, mode: 'create', id: null, name: '', icon: 'fas fa-folder' };
    },
    openRenameFolder(folder) {
      this.folderDialog = {
        visible: true,
        mode: 'rename',
        id: folder.id,
        name: folder.name,
        icon: folder.icon || 'fas fa-folder',
      };
    },
    closeFolderDialog() {
      this.folderDialog.visible = false;
    },
    async saveFolder() {
      if (!this.folderDialog.name) {
        this.$toast?.error(this.$t('validationError'));
        return;
      }
      try {
        if (this.folderDialog.mode === 'create') {
          await DriveController.createFolder({
            name: this.folderDialog.name,
            parent_id: this.parentId,
            icon: this.folderDialog.icon,
          });
        } else {
          await DriveController.renameFolder(this.folderDialog.id, {
            name: this.folderDialog.name,
            icon: this.folderDialog.icon,
          });
        }
        this.closeFolderDialog();
        await this.fetchItems();
      } catch (error) {
        this.$toast?.error(error?.response?.data?.error || this.$t('errorSavingData'));
      }
    },
    async deleteFolder(id) {
      try {
        await DriveController.deleteFolder(id);
        this.closeMenus();
        await this.fetchItems();
      } catch (error) {
        this.$toast?.error(error?.response?.data?.error || this.$t('errorDeletingData'));
      }
    },
    async handleFileUpload(event) {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) {
        return;
      }
      try {
        await this.performUpload(files, this.parentId);
        await this.fetchItems();
      } catch (error) {
        this.$toast?.error(error?.response?.data?.error || this.$t('errorSavingData'));
      }
      event.target.value = '';
    },
    async handleFolderUpload(event) {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) {
        return;
      }
      const filePaths = files.map((file) => String(file.webkitRelativePath || file.name || ''));
      try {
        await this.performUpload(files, this.parentId, filePaths);
        await this.fetchItems();
      } catch (error) {
        this.$toast?.error(error?.response?.data?.error || this.$t('errorSavingData'));
      }
      event.target.value = '';
    },
    onContentDragOver() {
      if (!this.$store.getters.hasPermission('drive_create') || this.uploading) {
        return;
      }
      this.isContentDragOver = true;
    },
    onContentDragLeave(event) {
      const currentTarget = event.currentTarget;
      if (currentTarget && event.relatedTarget && currentTarget.contains(event.relatedTarget)) {
        return;
      }
      this.isContentDragOver = false;
    },
    async onContentDrop(event) {
      this.isContentDragOver = false;
      if (!this.$store.getters.hasPermission('drive_create') || this.uploading) {
        return;
      }
      const files = Array.from(event.dataTransfer?.files || []);
      if (files.length === 0) {
        return;
      }
      try {
        await this.performUpload(files, this.parentId);
        await this.fetchItems();
      } catch (error) {
        this.$toast?.error(error?.response?.data?.error || this.$t('errorSavingData'));
      }
    },
    async performUpload(files, folderId = null, filePaths = []) {
      this.uploading = true;
      this.uploadProgress.filesCount = files.length;
      this.uploadProgress.percent = 0;
      try {
        await DriveController.uploadFiles(files, folderId, filePaths, {
          onUploadProgress: (progressEvent) => {
            const total = Number(progressEvent?.total || 0);
            if (total <= 0) {
              return;
            }
            const loaded = Number(progressEvent?.loaded || 0);
            const percent = Math.min(100, Math.max(0, Math.round((loaded / total) * 100)));
            this.uploadProgress.percent = percent;
          },
        });
      } finally {
        this.uploadProgress.percent = 0;
        this.uploadProgress.filesCount = 0;
        this.uploading = false;
      }
    },
    onFolderDragOver(folderId) {
      if (!this.$store.getters.hasPermission('drive_create') || this.uploading) {
        return;
      }
      this.dragOverFolderId = folderId;
    },
    onFolderDragLeave(event, folderId) {
      const currentTarget = event.currentTarget;
      if (currentTarget && event.relatedTarget && currentTarget.contains(event.relatedTarget)) {
        return;
      }
      if (this.dragOverFolderId === folderId) {
        this.dragOverFolderId = null;
      }
    },
    async onFolderDrop(event, folderId) {
      this.dragOverFolderId = null;
      if (!this.$store.getters.hasPermission('drive_create') || this.uploading) {
        return;
      }
      const files = Array.from(event.dataTransfer?.files || []);
      if (files.length === 0) {
        return;
      }
      try {
        await this.performUpload(files, folderId);
        if (this.parentId === folderId) {
          await this.fetchItems();
        } else {
          this.$toast?.success(this.$t('savedSuccessfully'));
        }
      } catch (error) {
        this.$toast?.error(error?.response?.data?.error || this.$t('errorSavingData'));
      }
    },
    async downloadFile(file) {
      try {
        await DriveController.downloadFile(file.id, file.name);
      } catch (error) {
        this.$toast?.error(error?.response?.data?.error || this.$t('errorGettingData'));
      }
    },
    async deleteFile(id) {
      try {
        await DriveController.deleteFile(id);
        this.closeMenus();
        await this.fetchItems();
      } catch (error) {
        this.$toast?.error(error?.response?.data?.error || this.$t('errorDeletingData'));
      }
    },
    openShareModal(resourceType, item) {
      this.shareDialog.visible = true;
      this.shareDialog.resourceType = resourceType;
      this.shareDialog.resourceId = item.id;
      this.shareDialog.subjectType = 'user';
      this.shareDialog.subjectId = null;
      this.shareDialog.ability = 'view';
      this.shareDialog.effect = 'allow';
    },
    closeShareDialog() {
      this.shareDialog.visible = false;
    },
    toggleItemMenu(key) {
      this.activeMenuKey = this.activeMenuKey === key ? null : key;
    },
    closeMenus() {
      this.activeMenuKey = null;
    },
    requestDelete(type, id) {
      this.deleteDialog.visible = true;
      this.deleteDialog.type = type;
      this.deleteDialog.id = id;
    },
    closeDeleteDialog() {
      this.deleteDialog.visible = false;
      this.deleteDialog.type = null;
      this.deleteDialog.id = null;
    },
    async confirmDelete() {
      const { type, id } = this.deleteDialog;
      if (!type || !id) {
        this.closeDeleteDialog();
        return;
      }
      if (type === 'folder') {
        await this.deleteFolder(id);
      } else {
        await this.deleteFile(id);
      }
      this.closeDeleteDialog();
    },
    openDetails(type, item) {
      this.detailsDialog.visible = true;
      this.detailsDialog.type = type;
      this.detailsDialog.item = item;
    },
    closeDetails() {
      this.detailsDialog.visible = false;
      this.detailsDialog.type = null;
      this.detailsDialog.item = null;
    },
    formatDate(value) {
      if (!value) {
        return '-';
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return String(value);
      }
      return date.toLocaleString();
    },
    formatSize(bytes) {
      const num = Number(bytes);
      if (!Number.isFinite(num) || num <= 0) {
        return '0 B';
      }
      const units = ['B', 'KB', 'MB', 'GB'];
      const power = Math.min(Math.floor(Math.log(num) / Math.log(1024)), units.length - 1);
      return `${(num / (1024 ** power)).toFixed(2)} ${units[power]}`;
    },
    getFileExtension(file) {
      if (file?.extension) {
        return String(file.extension).toLowerCase();
      }
      const name = String(file?.name || '');
      const parts = name.split('.');
      return parts.length > 1 ? parts.pop().toLowerCase() : '';
    },
    getFileIconClass(file) {
      const ext = this.getFileExtension(file);
      const map = {
        xls: 'fas fa-file-excel text-green-500',
        xlsx: 'fas fa-file-excel text-green-500',
        csv: 'fas fa-file-csv text-green-500',
        doc: 'fas fa-file-word text-blue-500',
        docx: 'fas fa-file-word text-blue-500',
        pdf: 'fas fa-file-pdf text-red-500',
        txt: 'fas fa-file-lines text-gray-500',
        md: 'fas fa-file-lines text-gray-500',
        zip: 'fas fa-file-zipper text-amber-500',
        rar: 'fas fa-file-zipper text-amber-500',
        '7z': 'fas fa-file-zipper text-amber-500',
        jpg: 'fas fa-file-image text-purple-500',
        jpeg: 'fas fa-file-image text-purple-500',
        png: 'fas fa-file-image text-purple-500',
        gif: 'fas fa-file-image text-purple-500',
        webp: 'fas fa-file-image text-purple-500',
        bmp: 'fas fa-file-image text-purple-500',
        svg: 'fas fa-file-image text-purple-500',
      };
      return map[ext] || 'fas fa-file text-blue-400';
    },
    getFileFormatLabel(file) {
      const ext = this.getFileExtension(file);
      if (ext) {
        return `.${ext.toUpperCase()}`;
      }
      return file?.mime_type || '-';
    },
    async savePermission() {
      if (!this.shareDialog.subjectId) {
        this.$toast?.error(this.$t('validationError'));
        return;
      }
      try {
        await DriveController.setPermission({
          resource_type: this.shareDialog.resourceType,
          resource_id: this.shareDialog.resourceId,
          subject_type: this.shareDialog.subjectType,
          subject_id: this.shareDialog.subjectId,
          ability: this.shareDialog.ability,
          effect: this.shareDialog.effect,
        });
        this.closeShareDialog();
        this.$toast?.success(this.$t('savedSuccessfully'));
      } catch (error) {
        this.$toast?.error(error?.response?.data?.error || this.$t('errorSavingData'));
      }
    },
    creatorName(creator) {
      if (!creator) {
        return '-';
      }
      return [creator.name, creator.surname].filter(Boolean).join(' ');
    },
  },
};
</script>

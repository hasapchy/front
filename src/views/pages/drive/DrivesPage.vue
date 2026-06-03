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
        <div class="flex w-full max-w-md flex-col items-center rounded-2xl border-2 border-dashed border-blue-500 bg-blue-50 px-8 py-10 text-center shadow-lg dark:bg-[var(--surface-elevated)]">
          <i class="fas fa-cloud-upload-alt mb-4 text-5xl text-blue-600" />
          <p class="text-lg font-semibold text-blue-800 dark:text-[var(--text-primary)]">
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
          :disabled="!$store.getters.hasPermission('drive_create') || uploading"
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
          :disabled="!$store.getters.hasPermission('drive_create') || uploading"
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

    <div class="relative min-h-[280px] flex-1 overflow-visible rounded-xl bg-gray-100/60 p-4 dark:bg-[var(--surface-muted)]/35">
      <div v-if="uploading" class="mb-4 rounded-lg bg-white/90 px-3 py-2 shadow-sm ring-1 ring-blue-200/80 dark:bg-[var(--surface-elevated)] dark:ring-blue-500/30">
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
      <div class="grid grid-cols-2 gap-4 overflow-visible sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <div
          v-for="folder in folders"
          :key="`tile-folder-${folder.id}`"
          class="relative overflow-visible cursor-pointer rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-[color-mix(in_srgb,var(--label-accent)_40%,#e5e7eb)] dark:bg-[var(--surface-elevated)] dark:ring-white/10 dark:hover:ring-[color-mix(in_srgb,var(--label-accent)_45%,transparent)]"
          :class="{
            'ring-2 ring-[var(--nav-accent)] bg-[color-mix(in_srgb,var(--label-accent)_10%,#ffffff)] shadow-md dark:bg-[color-mix(in_srgb,var(--label-accent)_12%,var(--surface-elevated))]': dragOverFolderId === folder.id,
            'z-20': activeMenuKey === `folder-${folder.id}`,
          }"
          @dblclick="openFolder(folder.id)"
          @dragover.prevent.stop="onFolderDragOver($event, folder.id)"
          @dragleave.prevent.stop="onFolderDragLeave($event, folder.id)"
          @drop.prevent.stop="onFolderDrop($event, folder.id)"
        >
          <div class="mb-2 flex justify-end">
            <button
              type="button"
              class="relative z-10 h-8 w-8 shrink-0 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-[var(--surface-muted)]"
              @click.stop="toggleItemMenu(`folder-${folder.id}`)"
              @dragstart.stop
            >
              <i class="fas fa-ellipsis-v" />
            </button>
          </div>
          <div class="mb-2 flex h-16 w-full items-center justify-center">
            <i :class="[folder.icon || 'fas fa-folder', 'text-4xl text-yellow-400']" />
          </div>
          <div class="w-full truncate text-center text-sm font-medium text-gray-800 dark:text-[var(--text-primary)]">
            {{ folder.name }}
          </div>
          <div
            v-if="activeMenuKey === `folder-${folder.id}`"
            class="absolute right-3 top-12 z-30 w-44 rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
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
          class="relative overflow-visible rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-[color-mix(in_srgb,var(--label-accent)_40%,#e5e7eb)] dark:bg-[var(--surface-elevated)] dark:ring-white/10 dark:hover:ring-[color-mix(in_srgb,var(--label-accent)_45%,transparent)]"
          :class="{
            'z-20': activeMenuKey === `file-${file.id}`,
            'opacity-60': draggingFileId === file.id,
            'ring-2 ring-[var(--nav-accent)] shadow-md': selectedIds.includes(file.id),
          }"
          draggable="true"
          @dragstart="onFileDragStart($event, file)"
          @dragend="onFileDragEnd"
        >
          <div class="mb-2 flex items-start justify-between gap-2">
            <input
              type="checkbox"
              class="mt-0.5 shrink-0 cursor-pointer rounded border-gray-300 bg-white text-[var(--nav-accent)] focus:ring-[var(--nav-accent)] dark:border-gray-500 dark:bg-[var(--surface-muted)]"
              :checked="selectedIds.includes(file.id)"
              @click.stop
              @change="toggleFileSelection(file.id)"
            >
            <button
              type="button"
              class="relative z-10 ml-auto h-8 w-8 shrink-0 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-[var(--surface-muted)]"
              @click.stop="toggleItemMenu(`file-${file.id}`)"
              @dragstart.stop
            >
              <i class="fas fa-ellipsis-v" />
            </button>
          </div>
          <div class="mb-2 flex h-16 w-full items-center justify-center overflow-hidden">
            <img
              v-if="filePreviewUrls[file.id]"
              :src="filePreviewUrls[file.id]"
              :alt="file.name"
              class="max-h-16 max-w-full object-contain"
              @error="onFilePreviewError(file.id)"
            >
            <i v-else :class="[fileIconClass(file), 'text-4xl']" />
          </div>
          <div class="w-full truncate text-center text-sm font-medium text-gray-800">
            {{ file.name }}
          </div>
          <div
            v-if="activeMenuKey === `file-${file.id}`"
            class="absolute right-3 top-12 z-30 w-44 rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
            @click.stop
          >
            <button type="button" class="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100" @click="downloadFile(file); closeMenus()"><i class="fas fa-download mr-2" />{{ $t('download') }}</button>
            <button type="button" class="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100" :disabled="!$store.getters.hasPermission('drive_update')" @click="openRenameFile(file); closeMenus()"><i class="fas fa-pen mr-2" />{{ $t('renameFile') }}</button>
            <button type="button" class="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100" :disabled="!$store.getters.hasPermission('drive_update')" @click="openMoveFile(file); closeMenus()"><i class="fas fa-folder-tree mr-2" />{{ $t('moveToFolder') }}</button>
            <button type="button" class="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100" :disabled="!$store.getters.hasPermission('drive_share')" @click="openShareModal('file', file); closeMenus()"><i class="fas fa-share-alt mr-2" />{{ $t('shareAccess') }}</button>
            <button type="button" class="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100" @click="openDetails('file', file); closeMenus()"><i class="fas fa-circle-info mr-2" />{{ $t('details') }}</button>
            <button type="button" class="w-full rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50" :disabled="!$store.getters.hasPermission('drive_delete')" @click="requestDelete('file', file.id); closeMenus()"><i class="fas fa-trash mr-2" />{{ $t('delete') }}</button>
          </div>
        </div>
      </div>

      <div
        v-if="!loading && folders.length === 0 && files.length === 0"
        class="flex flex-col items-center justify-center gap-2 py-16 text-center text-sm text-gray-500 dark:text-[var(--text-secondary)]"
      >
        <i class="fas fa-folder-open text-3xl text-gray-300 dark:text-[var(--text-muted)]" />
        <span>{{ $t('noData') }}</span>
      </div>
    </div>

    <CenteredModalDialog
      :show-form="folderDialog.visible"
      :title="getItemDialogTitle()"
      :onclose="closeFolderDialog"
    >
      <div
        v-if="folderDialog.resourceType === 'file' && folderDialog.fileExtension"
        class="flex items-center gap-1"
      >
        <input
          v-model.trim="folderDialog.name"
          class="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2"
          :placeholder="$t('fileName')"
          @keyup.enter="saveFolder"
        >
        <span class="shrink-0 text-sm text-gray-500">.{{ folderDialog.fileExtension }}</span>
      </div>
      <input
        v-else
        v-model.trim="folderDialog.name"
        class="w-full rounded border border-gray-300 px-3 py-2"
        :placeholder="folderDialog.resourceType === 'file' ? $t('fileName') : $t('folderName')"
        @keyup.enter="saveFolder"
      >
      <div v-if="folderDialog.resourceType === 'folder'" class="mt-3">
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
      <template #footer>
        <PrimaryButton :is-light="true" :onclick="closeFolderDialog">
          {{ $t('cancel') }}
        </PrimaryButton>
        <PrimaryButton :onclick="saveFolder">
          {{ $t('save') }}
        </PrimaryButton>
      </template>
    </CenteredModalDialog>

    <CenteredModalDialog
      :show-form="moveDialog.visible"
      :title="$t('moveToFolder')"
      :onclose="closeMoveDialog"
    >
      <p class="mb-3 truncate text-sm text-gray-600">
        <template v-if="moveDialog.fileIds.length > 1">
          <strong>{{ $t('totalFiles') }}:</strong> {{ moveDialog.fileIds.length }}
        </template>
        <template v-else>
          <strong>{{ $t('fileName') }}:</strong> {{ moveDialogFileName }}
        </template>
      </p>
      <div class="mb-2 flex flex-wrap items-center gap-1 text-xs">
        <button
          type="button"
          class="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
          :disabled="moveDialog.loading"
          @click="browseMoveParent(null)"
        >
          {{ $t('driveRoot') }}
        </button>
        <div
          v-for="crumb in moveDialog.breadcrumbs"
          :key="`move-crumb-${crumb.id}`"
          class="inline-flex items-center gap-1"
        >
          <span class="text-gray-400">/</span>
          <button
            type="button"
            class="max-w-[8rem] truncate rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
            :disabled="moveDialog.loading"
            @click="browseMoveParent(crumb.id)"
          >
            {{ crumb.name }}
          </button>
        </div>
      </div>
      <div class="max-h-48 space-y-0.5 overflow-y-auto rounded-lg border border-gray-200 p-1">
        <button
          v-for="folder in moveDialog.folders"
          :key="`move-folder-${folder.id}`"
          type="button"
          class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-gray-100"
          :disabled="moveDialog.loading || isMoveTargetDisabled(folder.id)"
          @click="browseMoveParent(folder.id)"
        >
          <i :class="[folder.icon || 'fas fa-folder', 'text-yellow-400']" />
          <span class="truncate">{{ folder.name }}</span>
        </button>
        <div
          v-if="!moveDialog.loading && moveDialog.folders.length === 0"
          class="px-2 py-3 text-center text-sm text-gray-500"
        >
          {{ $t('noData') }}
        </div>
      </div>
      <template #footer>
        <PrimaryButton :is-light="true" :onclick="closeMoveDialog">
          {{ $t('cancel') }}
        </PrimaryButton>
        <PrimaryButton
          :onclick="confirmMoveHere"
          :disabled="moveDialog.loading || isMoveTargetDisabled(moveDialog.browseParentId)"
        >
          {{ $t('moveHere') }}
        </PrimaryButton>
      </template>
    </CenteredModalDialog>

    <CenteredModalDialog
      :show-form="shareDialog.visible"
      :title="$t('shareAccess')"
      :onclose="closeShareDialog"
      panel-class="max-w-lg"
    >
      <div
        v-if="shareDialog.resourceName"
        class="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-muted)] dark:text-[var(--text-secondary)]"
      >
        <i
          :class="[
            shareDialog.resourceType === 'folder' ? 'fas fa-folder text-yellow-500' : 'fas fa-file text-gray-400',
            'shrink-0',
          ]"
        />
        <span class="min-w-0 truncate font-medium">{{ shareDialog.resourceName }}</span>
      </div>
      <div class="space-y-4">
        <div>
          <label>{{ $t('shareRecipient') }}</label>
          <div class="mt-1.5 grid grid-cols-2 gap-2">
            <button
              type="button"
              :class="shareSubjectTypeButtonClass('user')"
              @click="setShareSubjectType('user')"
            >
              <i class="fas fa-user" />
              {{ $t('user') }}
            </button>
            <button
              type="button"
              :class="shareSubjectTypeButtonClass('role')"
              @click="setShareSubjectType('role')"
            >
              <i class="fas fa-user-shield" />
              {{ $t('role') }}
            </button>
          </div>
        </div>
        <div class="rounded-lg border border-gray-200 p-3 dark:border-[var(--border-subtle)]">
          <UserSearch
            v-if="shareDialog.subjectType === 'user'"
            :selected-user="shareDialog.selectedUser"
            :show-label="true"
            :label="$t('user')"
            @update:selected-user="shareDialog.selectedUser = $event"
          />
          <RoleSearch
            v-else
            :selected-role="shareDialog.selectedRole"
            :show-label="true"
            :label="$t('role')"
            @update:selected-role="shareDialog.selectedRole = $event"
          />
        </div>
        <div>
          <label>{{ $t('permissions') }}</label>
          <select
            v-model="shareDialog.ability"
            class="mt-1.5 w-full"
          >
            <option value="view">
              {{ $t('view') }}
            </option>
            <option value="upload">
              {{ $t('create') }}
            </option>
            <option value="rename">
              {{ $t('edit') }}
            </option>
            <option value="delete">
              {{ $t('delete') }}
            </option>
            <option value="share">
              {{ $t('share') }}
            </option>
          </select>
        </div>
        <div>
          <label>{{ $t('shareEffect') }}</label>
          <div class="mt-1.5 grid grid-cols-2 gap-2">
            <button
              type="button"
              :class="shareEffectButtonClass('allow')"
              @click="shareDialog.effect = 'allow'"
            >
              <i class="fas fa-check-circle" />
              {{ $t('allow') }}
            </button>
            <button
              type="button"
              :class="shareEffectButtonClass('deny')"
              @click="shareDialog.effect = 'deny'"
            >
              <i class="fas fa-ban" />
              {{ $t('deny') }}
            </button>
          </div>
        </div>
      </div>
      <template #footer>
        <PrimaryButton :is-light="true" :onclick="closeShareDialog">
          {{ $t('cancel') }}
        </PrimaryButton>
        <PrimaryButton :onclick="savePermission">
          {{ $t('save') }}
        </PrimaryButton>
      </template>
    </CenteredModalDialog>

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
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import CenteredModalDialog from '@/views/components/app/dialog/CenteredModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import UserSearch from '@/views/components/app/search/UserSearch.vue';
import RoleSearch from '@/views/components/app/search/RoleSearch.vue';

const DRIVE_FILE_DRAG_TYPE = 'application/x-birhasap-drive-file-id';

export default {
  name: 'DrivesPage',
  components: {
    SideModalDialog,
    CenteredModalDialog,
    PrimaryButton,
    TableControlsBar,
    AlertDialog,
    BatchButton,
    UserSearch,
    RoleSearch,
  },
  mixins: [notificationMixin, getApiErrorMessageMixin, batchActionsMixin],
  data() {
    return {
      controller: DriveController,
      deletePermission: 'drive_delete',
      showStatusSelect: false,
      loading: false,
      uploading: false,
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
        icon: 'fas fa-folder',
      },
      shareDialog: {
        visible: false,
        resourceType: 'folder',
        resourceId: null,
        resourceName: '',
        subjectType: 'user',
        selectedUser: null,
        selectedRole: null,
        ability: 'view',
        effect: 'allow',
      },
      activeMenuKey: null,
      detailsDialog: {
        visible: false,
        type: null,
        item: null,
      },
      isPageDragOver: false,
      dragEnterCounter: 0,
      dragOverFolderId: null,
      draggingFileId: null,
      moveDialog: {
        visible: false,
        fileIds: [],
        browseParentId: null,
        folders: [],
        breadcrumbs: [],
        loading: false,
      },
      filePreviewUrls: {},
      uploadProgress: {
        percent: 0,
        filesCount: 0,
      },
      itemDeleteDialog: {
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
        const input = this.$refs.selectAllFilesInput;
        if (input) {
          input.indeterminate = value;
        }
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
    fileIconClass(file) {
      return DriveController.getFileIconClass(file);
    },
    async fetchItems() {
      this.loading = true;
      this.selectedIds = [];
      try {
        const data = await DriveController.getItems(this.parentId);
        this.folders = data.folders || [];
        this.files = data.files || [];
        this.breadcrumbs = data.breadcrumbs || [];
        await this.loadImagePreviews();
      } catch (error) {
        this.showNotification(this.$t('error'), this.getApiErrorMessage(error).join('\n') || this.$t('errorGettingData'), true);
      } finally {
        this.loading = false;
      }
    },
    currentCompanyId() {
      return this.$store.state.currentCompany?.id ?? null;
    },
    revokePreviewUrl(fileId) {
      const url = this.filePreviewUrls[fileId];
      if (url) {
        window.URL.revokeObjectURL(url);
      }
      delete this.filePreviewUrls[fileId];
    },
    revokeFilePreviewUrls() {
      Object.keys(this.filePreviewUrls).forEach((fileId) => {
        this.revokePreviewUrl(fileId);
      });
    },
    async loadImagePreviews() {
      const companyId = this.currentCompanyId();
      if (!companyId) {
        return;
      }
      const imageFiles = this.files.filter((file) => DriveController.isImageFile(file));
      const activeIds = new Set(imageFiles.map((file) => file.id));
      Object.keys(this.filePreviewUrls).forEach((fileId) => {
        if (!activeIds.has(Number(fileId))) {
          this.revokePreviewUrl(Number(fileId));
        }
      });
      await Promise.all(imageFiles.map(async (file) => {
        if (this.filePreviewUrls[file.id]) {
          return;
        }
        try {
          this.filePreviewUrls[file.id] = await DriveController.fetchFilePreviewUrl(file.id, companyId);
        } catch {
          this.revokePreviewUrl(file.id);
        }
      }));
    },
    async onFilePreviewError(fileId) {
      const companyId = this.currentCompanyId();
      this.revokePreviewUrl(fileId);
      if (companyId) {
        await clearDrivePreviewCache(companyId, fileId);
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
        icon: 'fas fa-folder',
      };
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
        icon: folder.icon || 'fas fa-folder',
      };
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
    isUnsupportedFileTypeError(error) {
      if (error?.code === 'UNSUPPORTED_FILE_TYPE') {
        return true;
      }
      const message = String(
        error?.response?.data?.error
        || error?.response?.data?.message
        || '',
      ).toLowerCase();
      return message.includes('unsupported file type')
        || message.includes('неподдерживаемый тип файла');
    },
    formatUnsupportedFileTypeMessage(rejectedFiles) {
      const lines = (rejectedFiles || []).map((file) => {
        const typeLabel = file.extension ? `.${file.extension}` : this.$t('unknownFileType');
        return this.$t('unsupportedFileTypeLine', { name: file.name, type: typeLabel });
      });
      if (lines.length === 0) {
        return this.$t('unsupportedFileType');
      }
      if (lines.length === 1) {
        return `${this.$t('unsupportedFileType')}: ${lines[0]}`;
      }
      return `${this.$t('unsupportedFileType')}:\n${lines.join('\n')}`;
    },
    getUnsupportedFileTypeMessage(error) {
      if (error?.rejectedFiles?.length) {
        return this.formatUnsupportedFileTypeMessage(error.rejectedFiles);
      }
      const apiMessage = error?.response?.data?.error || error?.response?.data?.message;
      if (apiMessage) {
        return apiMessage;
      }
      return this.$t('unsupportedFileType');
    },
    showError(error, fallbackKey = 'errorSavingData') {
      const message = this.isUnsupportedFileTypeError(error)
        ? this.getUnsupportedFileTypeMessage(error)
        : this.getApiErrorMessage(error).join('\n') || this.$t(fallbackKey);
      this.showNotification(this.$t('error'), message, true);
    },
    closeFolderDialog() {
      this.folderDialog.visible = false;
    },
    async saveFolder() {
      if (!this.folderDialog.name) {
        this.showNotification(this.$t('error'), this.$t('validationError'), true);
        return;
      }
      try {
        if (this.folderDialog.resourceType === 'file') {
          const fileName = DriveController.buildFileName(
            this.folderDialog.name,
            this.folderDialog.fileExtension,
          );
          await DriveController.renameFile(this.folderDialog.id, {
            name: fileName,
          });
        } else if (this.folderDialog.mode === 'create') {
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
    canUploadFiles() {
      return this.$store.getters.hasPermission('drive_create') && !this.uploading;
    },
    isInternalFileDrag(event) {
      return Array.from(event?.dataTransfer?.types || []).includes(DRIVE_FILE_DRAG_TYPE);
    },
    isOsFileDrag(event) {
      return Array.from(event?.dataTransfer?.types || []).includes('Files');
    },
    isUploadDrag(event) {
      return !this.draggingFileId && !this.isInternalFileDrag(event) && this.isOsFileDrag(event);
    },
    getDraggedFileId(event) {
      const raw = event?.dataTransfer?.getData(DRIVE_FILE_DRAG_TYPE);
      const parsed = Number.parseInt(String(raw ?? ''), 10);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        return null;
      }
      return parsed;
    },
    extractDroppedFiles(event) {
      return Array.from(event?.dataTransfer?.files || []).filter((file) => file && file.name);
    },
    resetDragState() {
      this.dragEnterCounter = 0;
      this.isPageDragOver = false;
      this.dragOverFolderId = null;
    },
    onPageDragEnter(event) {
      if (!this.canUploadFiles() || !this.isUploadDrag(event)) {
        return;
      }
      this.dragEnterCounter += 1;
      this.isPageDragOver = true;
    },
    onPageDragOver(event) {
      if (!this.canUploadFiles() || !this.isUploadDrag(event)) {
        return;
      }
      event.dataTransfer.dropEffect = 'copy';
      this.isPageDragOver = true;
    },
    onPageDragLeave(event) {
      if (!this.isUploadDrag(event)) {
        return;
      }
      this.dragEnterCounter = Math.max(0, this.dragEnterCounter - 1);
      if (this.dragEnterCounter === 0) {
        this.isPageDragOver = false;
      }
    },
    async onPageDrop(event) {
      this.resetDragState();
      if (!this.canUploadFiles() || this.isInternalFileDrag(event) || this.getDraggedFileId(event)) {
        return;
      }
      const files = this.extractDroppedFiles(event);
      if (files.length === 0) {
        return;
      }
      try {
        await this.performUpload(files, this.parentId);
        await this.fetchItems();
      } catch (error) {
        this.showError(error);
      }
    },
    async onFilesInputChange(event, isFolder) {
      const files = Array.from(event.target.files || []);
      event.target.value = '';
      if (files.length === 0) {
        return;
      }
      const filePaths = isFolder
        ? files.map((file) => String(file.webkitRelativePath || file.name || ''))
        : [];
      try {
        await this.performUpload(files, this.parentId, filePaths);
        await this.fetchItems();
      } catch (error) {
        this.showError(error);
      }
    },
    async performUpload(files, folderId = null, filePaths = []) {
      const allowedFiles = DriveController.filterAllowedUploadFiles(files);
      this.uploading = true;
      this.uploadProgress.filesCount = allowedFiles.length;
      this.uploadProgress.percent = 0;
      try {
        await DriveController.uploadFiles(allowedFiles, folderId, filePaths, {
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
    onFileDragStart(event, file) {
      if (!this.$store.getters.hasPermission('drive_update')) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.setData(DRIVE_FILE_DRAG_TYPE, String(file.id));
      event.dataTransfer.effectAllowed = 'move';
      this.draggingFileId = file.id;
    },
    onFileDragEnd() {
      this.draggingFileId = null;
      this.dragOverFolderId = null;
      this.resetDragState();
    },
    onFolderDragOver(event, folderId) {
      if (this.isInternalFileDrag(event)) {
        if (!this.$store.getters.hasPermission('drive_update')) {
          return;
        }
        event.dataTransfer.dropEffect = 'move';
        this.dragOverFolderId = folderId;
        return;
      }
      if (!this.canUploadFiles() || !this.isOsFileDrag(event)) {
        return;
      }
      event.dataTransfer.dropEffect = 'copy';
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
      event.stopPropagation();
      const draggedFileId = this.getDraggedFileId(event);
      if (draggedFileId) {
        this.resetDragState();
        this.onFileDragEnd();
        try {
          await this.performBatchMoveFiles([draggedFileId], folderId);
        } catch (error) {
          this.showNotification(this.$t('error'), this.getApiErrorMessage(error).join('\n') || this.$t('errorSavingData'), true);
        }
        return;
      }
      this.resetDragState();
      if (!this.canUploadFiles()) {
        return;
      }
      const files = this.extractDroppedFiles(event);
      if (files.length === 0) {
        return;
      }
      try {
        await this.performUpload(files, folderId);
        await this.fetchItems();
      } catch (error) {
        this.showError(error);
      }
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
        const data = await DriveController.getItems(this.moveDialog.browseParentId);
        this.moveDialog.folders = data.folders || [];
        this.moveDialog.breadcrumbs = data.breadcrumbs || [];
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
        this.showError(error);
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
      for (const fileId of idsToMove) {
        await DriveController.moveFile(fileId, targetId);
      }
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
      const companyId = this.currentCompanyId();
      const ids = [...(this.idsToDelete || [])];
      if (!companyId || ids.length === 0) {
        return;
      }
      await Promise.all(ids.map((id) => clearDrivePreviewCache(companyId, id)));
    },
    async deleteFile(id) {
      try {
        await DriveController.deleteFile(id, this.currentCompanyId());
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
      this.shareDialog.subjectType = 'user';
      this.shareDialog.selectedUser = null;
      this.shareDialog.selectedRole = null;
      this.shareDialog.ability = 'view';
      this.shareDialog.effect = 'allow';
    },
    onShareSubjectTypeChange() {
      this.shareDialog.selectedUser = null;
      this.shareDialog.selectedRole = null;
    },
    setShareSubjectType(type) {
      if (this.shareDialog.subjectType === type) {
        return;
      }
      this.shareDialog.subjectType = type;
      this.onShareSubjectTypeChange();
    },
    shareSubjectTypeButtonClass(type) {
      const active = this.shareDialog.subjectType === type;
      return [
        'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'border-[var(--label-accent)] bg-[color-mix(in_srgb,var(--label-accent)_12%,transparent)] text-[var(--label-accent)]'
          : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-[var(--border-subtle)] dark:text-[var(--text-secondary)] dark:hover:bg-[var(--surface-muted)]',
      ];
    },
    shareEffectButtonClass(effect) {
      const active = this.shareDialog.effect === effect;
      if (effect === 'allow') {
        return [
          'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
          active
            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
            : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-[var(--border-subtle)] dark:text-[var(--text-secondary)] dark:hover:bg-[var(--surface-muted)]',
        ];
      }
      return [
        'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'border-red-500 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-950/40 dark:text-red-400'
          : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-[var(--border-subtle)] dark:text-[var(--text-secondary)] dark:hover:bg-[var(--surface-muted)]',
      ];
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
    async savePermission() {
      const subjectId = this.shareDialog.subjectType === 'user'
        ? this.shareDialog.selectedUser?.id
        : this.shareDialog.selectedRole?.id;
      if (!subjectId) {
        this.showNotification(this.$t('error'), this.$t('validationError'), true);
        return;
      }
      try {
        await DriveController.setPermission({
          resource_type: this.shareDialog.resourceType,
          resource_id: this.shareDialog.resourceId,
          subject_type: this.shareDialog.subjectType,
          subject_id: subjectId,
          ability: this.shareDialog.ability,
          effect: this.shareDialog.effect,
        });
        this.closeShareDialog();
        this.showNotification(this.$t('success'), this.$t('savedSuccessfully'), false);
      } catch (error) {
        this.showNotification(this.$t('error'), this.getApiErrorMessage(error).join('\n') || this.$t('errorSavingData'), true);
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

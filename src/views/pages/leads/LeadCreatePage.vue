<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="app-form-scroll-container">
      <div>
        <label>{{ $t('timelineFieldByType.lead.title') }}</label>
        <input
          v-model="title"
          type="text"
          class="w-full border rounded p-2"
          :disabled="saveLoading"
        >
      </div>
      <div>
        <ClientSearch
          :selected-client="selectedClient"
          :required="true"
          :disabled="saveLoading"
          :allow-deselect="true"
          @update:selectedClient="selectedClient = $event"
        />
      </div>
      <div>
        <UserSearch
          :selected-user="selectedResponsible"
          :show-label="true"
          :allow-deselect="true"
          :disabled="saveLoading"
          :label="$t('timelineFieldByType.lead.responsible_id')"
          @update:selected-user="selectedResponsible = $event"
        />
      </div>
      <div>
        <label class="required">{{ $t('status') }}</label>
        <select
          v-model.number="statusId"
          class="w-full border rounded p-2"
          :disabled="saveLoading"
        >
          <option
            v-for="s in statuses"
            :key="s.id"
            :value="s.id"
          >
            {{ s.name }}
          </option>
        </select>
      </div>
      <div>
        <label>{{ $t('source') }}</label>
        <select
          v-model.number="leadSourceId"
          class="w-full border rounded p-2"
          :disabled="saveLoading"
        >
          <option :value="null">
            {{ $t('no') }}
          </option>
          <option
            v-for="src in sources"
            :key="src.id"
            :value="src.id"
          >
            {{ src.name }}
          </option>
        </select>
      </div>
      <div>
        <label>{{ $t('comment') }}</label>
        <textarea
          v-model="comment"
          rows="4"
          class="w-full border rounded p-2"
          :disabled="saveLoading"
        />
      </div>
      <div>
        <FileUploader
          ref="fileUploader"
          :files="getFormattedFiles()"
          :uploading="fileUploading"
          :disabled="saveLoading"
          :deleting="deletingFiles"
          @file-change="handleFileChange"
          @delete-file="showDeleteFileDialog"
        />
      </div>
    </div>

    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center justify-between gap-4 md:flex-nowrap">
        <div class="flex flex-wrap items-center gap-2 space-x-2">
          <PrimaryButton
            icon="fas fa-save"
            :onclick="submit"
            :is-loading="saveLoading"
            :disabled="!canSave"
            :aria-label="$t('save')"
          />
          <PrimaryButton
            v-if="editingItem?.id && ($store.getters.hasPermission('leads_delete_all') || $store.getters.hasPermission('leads_delete_own'))"
            :onclick="showDeleteDialog"
            icon="fas fa-trash"
            :is-danger="true"
            :is-loading="deleteLoading"
            :aria-label="$t('delete')"
          />
        </div>
      </div>
    </teleport>

    <AlertDialog
      :dialog="deleteDialog"
      :descr="$t('confirmDelete')"
      :confirm-text="$t('delete')"
      :leave-text="$t('cancel')"
      @confirm="confirmDelete"
      @leave="closeDeleteDialog"
    />
    <AlertDialog
      :dialog="closeConfirmDialog"
      :descr="$t('unsavedChanges')"
      :confirm-text="$t('closeWithoutSaving')"
      :leave-text="$t('stay')"
      @confirm="confirmClose"
      @leave="cancelClose"
    />
    <AlertDialog
      :dialog="deleteFileDialog"
      :descr="deleteFileDialogDescr"
      :confirm-text="$t('deleteFile')"
      :leave-text="$t('cancel')"
      :confirm-loading="deletingFiles"
      @confirm="confirmDeleteFile"
      @leave="closeDeleteFileDialog"
    />
  </div>
</template>

<script>
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import UserSearch from '@/views/components/app/search/UserSearch.vue';
import FileUploader from '@/views/components/app/forms/FileUploader.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import LeadController from '@/api/LeadController';
import LeadSourceController from '@/api/LeadSourceController';
import ClientController from '@/api/ClientController';
import LeadDto from '@/dto/lead/LeadDto';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import { getCurrentServerDateObject } from '@/utils/dateUtils';

export default {
  name: 'LeadCreatePage',
  components: { ClientSearch, UserSearch, FileUploader, PrimaryButton, AlertDialog },
  mixins: [getApiErrorMessageMixin, notificationMixin, sideModalFooterPortal],
  props: {
    editingItem: {
      type: Object,
      default: null,
    },
    statuses: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
  data() {
    return {
      title: '',
      selectedClient: null,
      selectedResponsible: null,
      statusId: null,
      leadSourceId: null,
      comment: '',
      sources: [],
      serverFilePaths: [],
      pendingFiles: [],
      saveLoading: false,
      deleteLoading: false,
      deleteDialog: false,
      closeConfirmDialog: false,
      deleteFileDialog: false,
      deleteFileTarget: null,
      fileUploading: false,
      deletingFiles: false,
      initialFormSnapshot: null,
    };
  },
  computed: {
    canSave() {
      return Boolean(this.selectedClient?.id) && this.statusId != null;
    },
    deleteFileDialogDescr() {
      const path = this.deleteFileTarget;
      if (!path || path.startsWith('pending_')) {
        return this.$t('deleteFileConfirm');
      }
      const name = String(path).split('/').pop() || path;
      return `${this.$t('deleteFileConfirm')} '${name}'`;
    },
  },
  watch: {
    editingItem: {
      immediate: true,
      async handler(v) {
        await this.resetFromItem(v);
        this.$nextTick(() => {
          this.captureInitialFormSnapshot();
        });
      },
    },
  },
  async mounted() {
    await this.loadSources();
    this.$nextTick(() => {
      this.captureInitialFormSnapshot();
    });
  },
  methods: {
    captureInitialFormSnapshot() {
      this.initialFormSnapshot = this.serializeFormState();
    },
    serializeFormState() {
      return JSON.stringify({
        title: this.title,
        clientId: this.selectedClient?.id ?? null,
        responsibleId: this.selectedResponsible?.id ?? null,
        statusId: this.statusId,
        leadSourceId: this.leadSourceId,
        comment: this.comment,
        serverFiles: [...this.serverFilePaths].sort().join('|'),
        pending: this.pendingFiles.map((f) => f.name).join('|'),
      });
    },
    hasUnsavedChanges() {
      if (this.initialFormSnapshot == null) {
        return false;
      }
      return this.serializeFormState() !== this.initialFormSnapshot;
    },
    handleCloseRequest() {
      if (this.saveLoading || this.deleteLoading || this.fileUploading || this.deletingFiles) {
        return;
      }
      if (this.hasUnsavedChanges()) {
        this.closeConfirmDialog = true;
      } else {
        this.$emit('close-request');
      }
    },
    confirmClose() {
      this.closeConfirmDialog = false;
      this.$emit('close-request');
    },
    cancelClose() {
      this.closeConfirmDialog = false;
    },
    showDeleteDialog() {
      this.deleteDialog = true;
    },
    closeDeleteDialog() {
      this.deleteDialog = false;
    },
    async loadSources() {
      try {
        this.sources = await LeadSourceController.getAllItems();
      } catch {
        this.sources = [];
      }
    },
    async resetFromItem(item) {
      this.comment = '';
      this.leadSourceId = null;
      this.title = '';
      this.selectedResponsible = null;
      this.serverFilePaths = [];
      this.pendingFiles = [];
      if (!item?.id) {
        this.selectedClient = null;
        const first = this.statuses?.[0];
        this.statusId = first?.id ?? null;
        const u = this.$store.state.user;
        this.selectedResponsible =
          u && u.id
            ? {
                id: u.id,
                name: u.name,
                surname: u.surname,
                photo: u.photo,
              }
            : null;
        return;
      }
      this.title = item.title != null ? String(item.title) : '';
      this.statusId = item.statusId ?? item.status_id ?? null;
      this.leadSourceId = item.leadSourceId ?? item.lead_source_id ?? null;
      this.comment = item.comment ?? '';
      const rid = item.responsibleId ?? item.responsible_id ?? null;
      if (rid && item.responsible && typeof item.responsible === 'object') {
        this.selectedResponsible = {
          id: item.responsible.id,
          name: item.responsible.name,
          surname: item.responsible.surname,
          photo: item.responsible.photo,
        };
      } else if (rid) {
        this.selectedResponsible = { id: rid };
      }
      const rawFiles = item.files;
      if (Array.isArray(rawFiles)) {
        this.serverFilePaths = rawFiles
          .map((f) => (typeof f === 'string' ? f : f?.path))
          .filter(Boolean);
      }
      if (item.client?.id) {
        try {
          this.selectedClient = await ClientController.getItem(item.client.id);
        } catch {
          this.selectedClient = item.client;
        }
      } else if (item.clientId) {
        try {
          this.selectedClient = await ClientController.getItem(item.clientId);
        } catch {
          this.selectedClient = null;
        }
      } else {
        this.selectedClient = null;
      }
    },
    buildPayload() {
      const trimmed = (this.title || '').trim();
      return new LeadDto({
        client_id: this.selectedClient?.id,
        title: trimmed === '' ? null : trimmed,
        responsible_id: this.selectedResponsible?.id ?? null,
        status_id: this.statusId,
        lead_source_id: this.leadSourceId,
        comment: this.comment?.trim() ? this.comment.trim() : null,
      }).toApiPayload();
    },
    getFormattedFiles() {
      const server = (this.serverFilePaths || []).map((path) => {
        const name = path.split('/').pop() || path;
        return {
          name,
          url: `/storage/${path}`,
          icon: this.getFileIconFromName(name),
          path,
          size: null,
          mimeType: null,
          uploadedAt: null,
          formattedSize: '',
          formattedUploadDate: '',
        };
      });
      if (this.pendingFiles?.length) {
        const pending = this.pendingFiles.map((file, index) => ({
          name: file.name,
          url: URL.createObjectURL(file),
          icon: this.getFileIcon(file),
          path: `pending_${index}`,
          size: file.size,
          mimeType: file.type,
          uploadedAt: getCurrentServerDateObject().toISOString(),
          formattedSize: this.formatFileSize(file.size),
          formattedUploadDate: getCurrentServerDateObject().toLocaleString(),
          isPending: true,
        }));
        return [...server, ...pending];
      }
      return server;
    },
    getFileIconFromName(name) {
      return this.getFileIcon({ name });
    },
    getFileIcon(file) {
      const raw = file?.name ?? '';
      const ext = String(raw).split('.').pop().toLowerCase();
      if (['pdf'].includes(ext)) return 'far fa-file-pdf';
      if (['doc', 'docx'].includes(ext)) return 'far fa-file-word';
      if (['xls', 'xlsx'].includes(ext)) return 'far fa-file-excel';
      if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg'].includes(ext)) return 'far fa-file-image';
      if (['zip', 'rar', '7z'].includes(ext)) return 'far fa-file-archive';
      if (['txt', 'md'].includes(ext)) return 'far fa-file-alt';
      return 'far fa-file';
    },
    formatFileSize(bytes) {
      if (!bytes) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
    },
    async handleFileChange(files) {
      if (!files?.length) {
        return;
      }
      const fileArray = Array.from(files);
      if (!this.editingItem?.id) {
        this.pendingFiles = [...this.pendingFiles, ...fileArray];
        return;
      }
      this.fileUploading = true;
      try {
        const lead = await LeadController.uploadFiles(this.editingItem.id, fileArray);
        if (lead && Array.isArray(lead.files)) {
          this.serverFilePaths = [...lead.files];
        }
      } catch (e) {
        this.showNotification(this.$t('error'), this.getApiErrorMessage(e), true);
      } finally {
        this.fileUploading = false;
      }
    },
    showDeleteFileDialog(filePath) {
      if (!filePath) {
        return;
      }
      if (String(filePath).startsWith('pending_')) {
        const index = parseInt(String(filePath).replace('pending_', ''), 10);
        if (!Number.isNaN(index)) {
          this.pendingFiles.splice(index, 1);
        }
        return;
      }
      if (!this.editingItem?.id) {
        return;
      }
      this.deleteFileTarget = filePath;
      this.deleteFileDialog = true;
    },
    closeDeleteFileDialog() {
      this.deleteFileDialog = false;
      this.deleteFileTarget = null;
    },
    async confirmDeleteFile() {
      const path = this.deleteFileTarget;
      this.deleteFileDialog = false;
      this.deleteFileTarget = null;
      if (!path || !this.editingItem?.id) {
        return;
      }
      this.deletingFiles = true;
      try {
        const next = this.serverFilePaths.filter((p) => p !== path);
        await LeadController.updateItem(this.editingItem.id, new LeadDto({ files: next }));
        this.serverFilePaths = next;
      } catch (e) {
        this.showNotification(this.$t('error'), this.getApiErrorMessage(e), true);
      } finally {
        this.deletingFiles = false;
      }
    },
    async submit() {
      if (!this.canSave) {
        this.showNotification(this.$t('error'), this.$t('allRequiredFieldsMustBeFilled'), true);
        return;
      }
      if (this.fileUploading) {
        this.showNotification(this.$t('error'), this.$t('waitForFileUpload'), true);
        return;
      }
      this.saveLoading = true;
      try {
        const payload = this.buildPayload();
        if (this.editingItem?.id) {
          await LeadController.updateItem(this.editingItem.id, payload);
        } else {
          const envelope = await LeadController.storeItem(payload);
          const newId = envelope?.data?.id;
          if (newId && this.pendingFiles.length) {
            const lead = await LeadController.uploadFiles(newId, this.pendingFiles);
            this.pendingFiles = [];
            if (lead && Array.isArray(lead.files)) {
              this.serverFilePaths = [...lead.files];
            }
          }
        }
        this.captureInitialFormSnapshot();
        this.$emit('saved');
      } catch (e) {
        this.$emit('saved-error', e);
        this.showNotification(this.$t('error'), this.getApiErrorMessage(e), true);
      } finally {
        this.saveLoading = false;
      }
    },
    async confirmDelete() {
      this.closeDeleteDialog();
      if (!this.editingItem?.id) {
        return;
      }
      this.deleteLoading = true;
      try {
        await LeadController.deleteItem(this.editingItem.id);
        this.$emit('deleted');
      } catch (e) {
        this.$emit('deleted-error', e);
        this.showNotification(this.$t('error'), this.getApiErrorMessage(e), true);
      } finally {
        this.deleteLoading = false;
      }
    },
  },
};
</script>

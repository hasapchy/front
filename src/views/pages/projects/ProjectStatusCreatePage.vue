<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
      <div>
        <label class="required">{{ $t('statusName') }}</label>
        <input v-model="name" type="text">
      </div>
      <div class="mt-4">
        <label>{{ $t('statusColor') }}</label>
        <div class="flex items-center space-x-2">
          <input v-model="color" type="color" class="w-12 h-8 border rounded">
          <input v-model="color" type="text" class="flex-1" placeholder="#6c757d">
        </div>
      </div>
      <div class="mt-4">
        <label>{{ $t('leadKanbanOutcome') }}</label>
        <select v-model="kanbanOutcome" class="w-full">
          <option value="">
            {{ $t('no') }}
          </option>
          <option value="success">
            {{ $t('leadKanbanOutcomeSuccess') }}
          </option>
          <option value="failure">
            {{ $t('leadKanbanOutcomeFailure') }}
          </option>
        </select>
      </div>
      <div class="mt-4">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm text-gray-900 dark:text-[var(--text-primary)]">{{ $t('showInProjectSelect') }}</span>
          <ToggleSwitch
            v-model="isVisible"
            :aria-label="$t('showInProjectSelect')"
          />
        </div>
        <p class="mt-2 text-sm text-gray-600 dark:text-[var(--text-secondary)]">
          {{ $t('showInProjectSelectDescription') }}
        </p>
      </div>
    </div>
    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
          :is-loading="deleteLoading" icon="fas fa-times"
          :disabled="!$store.getters.hasPermission('project_statuses_delete')" />
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('project_statuses_update')) ||
          (editingItemId == null && !$store.getters.hasPermission('project_statuses_create'))"
          :aria-label="$t('save')" />
      </div>
    </teleport>
  </div>
  <AlertDialog :dialog="deleteDialog" :descr="$t('deleteProjectStatus')" :confirm-text="$t('deleteProjectStatus')"
    :leave-text="$t('cancel')" @confirm="deleteItem" @leave="closeDeleteDialog" />
  <AlertDialog :dialog="closeConfirmDialog" :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')"
    :leave-text="$t('stay')" @confirm="confirmClose" @leave="cancelClose" />
</template>

<script>
import ProjectStatusController from '@/api/ProjectStatusController';
import ProjectStatusDto from '@/dto/project/ProjectStatusDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from "@/mixins/crudFormMixin";
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import ToggleSwitch from '@/views/components/app/forms/ToggleSwitch.vue';

export default {
  components: { PrimaryButton, AlertDialog, ToggleSwitch },
  mixins: [getApiErrorMessage, crudFormMixin, sideModalFooterPortal],
  props: {
    editingItem: { type: ProjectStatusDto, required: false, default: null }
  },
  emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
  data() {
    return {
      name: this.editingItem ? this.editingItem.name : '',
      color: this.editingItem ? this.editingItem.color : '#6c757d',
      isVisible: this.editingItem?.isVisible ?? true,
      kanbanOutcome: this.editingItem?.kanbanOutcome ?? '',
    }
  },
  mounted() {
    this.$nextTick(async () => {
      this.saveInitialState();
    });
  },
  methods: {
    getFormState() {
      return {
        name: this.name,
        color: this.color,
        isVisible: this.isVisible,
        kanbanOutcome: this.kanbanOutcome,
      };
    },
    prepareSave() {
      return {
        name: this.name,
        color: this.color,
        isVisible: this.isVisible,
        kanbanOutcome: this.kanbanOutcome === '' ? null : this.kanbanOutcome,
      };
    },
    async performSave(data) {
      if (this.editingItemId != null) {
        return await ProjectStatusController.updateItem(this.editingItemId, data);
      } else {
        return await ProjectStatusController.storeItem(data);
      }
    },
    async performDelete() {
      const resp = await ProjectStatusController.deleteItem(this.editingItemId);
      if (!resp.message) {
        throw new Error('Failed to delete project status');
      }
      return resp;
    },
    onSaveSuccess(response) {
      if (response && response.message) {
        this.clearForm();
      }
    },
    clearForm() {
      this.name = '';
      this.color = '#6c757d';
      this.isVisible = true;
      this.kanbanOutcome = '';
      if (this.resetFormChanges) {
        this.resetFormChanges();
      }
    },
    onEditingItemChanged(newEditingItem) {
      this.name = newEditingItem.name;
      this.color = newEditingItem.color || '#6c757d';
      this.isVisible = newEditingItem.isVisible ?? true;
      this.kanbanOutcome = newEditingItem.kanbanOutcome ?? '';
    }
  }
}
</script>

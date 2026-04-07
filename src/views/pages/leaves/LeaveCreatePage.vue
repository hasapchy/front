<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
      <div>
        <label class="required">{{ $t('leaveType') }}</label>
        <select
          v-model="leaveTypeId"
          required
        >
          <option value="">
            {{ $t('selectLeaveType') }}
          </option>
          <option
            v-for="leaveType in allLeaveTypes"
            :key="leaveType.id"
            :value="leaveType.id"
          >
            {{ translateLeaveType(leaveType.name, $t) }}
          </option>
        </select>
      </div>
      <div class="mt-4">
        <UserSearch
          :selected-user="selectedUser"
          :required="true"
          @update:selected-user="selectedUser = $event"
        />
      </div>
      <div class="mt-4">
        <label class="required">{{ $t('dateFrom') }}</label>
        <input
          v-model="dateFrom"
          type="datetime-local"
          required
        >
      </div>
      <div class="mt-4">
        <label class="required">{{ $t('dateTo') }}</label>
        <input
          v-model="dateTo"
          type="datetime-local"
          required
          :min="dateFrom"
        >
      </div>
      <div class="mt-4">
        <label>{{ $t('comment') }}</label>
        <textarea
          v-model="comment"
          class="w-full border rounded p-2"
          rows="3"
        />
      </div>
    </div>
    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton
          v-if="editingItem != null"
          :onclick="showDeleteDialog"
          :is-danger="true"
          :is-loading="deleteLoading"
          icon="fas fa-trash"
          :disabled="!$store.getters.hasPermission('leaves_delete_all')"
          :aria-label="$t('delete')"
        />
        <PrimaryButton
          icon="fas fa-save"
          :onclick="save"
          :is-loading="saveLoading"
          :aria-label="$t('save')"
          :disabled="!leaveTypeId || !userId || !dateFrom || !dateTo ||
            (editingItemId != null && !$store.getters.hasPermission('leaves_update_all')) ||
            (editingItemId == null && !$store.getters.hasPermission('leaves_create_all'))"
        />
      </div>
    </teleport>
  </div>
  <AlertDialog
    :dialog="deleteDialog"
    :descr="$t('confirmDelete')"
    :confirm-text="$t('delete')"
    :leave-text="$t('cancel')"
    @confirm="deleteItem"
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
</template>

<script>
import LeaveController from '@/api/LeaveController';
import UsersController from '@/api/UsersController';
import LeaveDto from '@/dto/leave/LeaveDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import UserSearch from '@/views/components/app/search/UserSearch.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from "@/mixins/crudFormMixin";
import { translateLeaveType } from '@/utils/translationUtils';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';

export default {
    components: { PrimaryButton, AlertDialog, UserSearch },
    mixins: [getApiErrorMessage, crudFormMixin, sideModalFooterPortal],
    props: {
        editingItem: { type: LeaveDto, required: false, default: null }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    data() {
        return {
            leaveTypeId: this.editingItem ? this.editingItem.leaveTypeId : '',
            selectedUser: this.editingItem && this.editingItem.userId 
                ? (this.editingItem.user || { id: this.editingItem.userId }) 
                : null,
            dateFrom: this.editingItem ? this.editingItem.dateFromForInput : '',
            dateTo: this.editingItem ? this.editingItem.dateToForInput : '',
            comment: this.editingItem ? (this.editingItem.comment ) : '',
            allLeaveTypes: [],
        }
    },
    computed: {
        userId() {
            return this.selectedUser?.id ;
        }
    },
    watch: {
        editingItem: {
            async handler(newEditingItem) {
                if (newEditingItem) {
                    this.leaveTypeId = newEditingItem.leaveTypeId ;
                    
                    if (newEditingItem.user && newEditingItem.userId) {
                        this.selectedUser = newEditingItem.user;
                    } else if (newEditingItem.userId) {
                        await this.loadUser(newEditingItem.userId);
                    } else {
                        this.selectedUser = null;
                    }
                    
                    this.dateFrom = newEditingItem.dateFromForInput ;
                    this.dateTo = newEditingItem.dateToForInput ;
                    this.comment = newEditingItem.comment ;
                    this.editingItemId = newEditingItem.id || null;
                } else {
                    this.leaveTypeId = '';
                    this.selectedUser = null;
                    this.dateFrom = '';
                    this.dateTo = '';
                    this.comment = '';
                    this.editingItemId = null;
                }
                this.$nextTick(() => {
                    this.saveInitialState();
                });
            },
            deep: true,
            immediate: true
        }
    },
    mounted() {
        this.$nextTick(async () => {
            await this.fetchAllLeaveTypes();
            if (this.editingItem && this.editingItem.userId && !this.editingItem.user) {
                await this.loadUser(this.editingItem.userId);
            }
            this.saveInitialState();
        });
    },
    methods: {
        translateLeaveType,
        getFormState() {
            return {
                leaveTypeId: this.leaveTypeId,
                userId: this.userId,
                dateFrom: this.dateFrom,
                dateTo: this.dateTo,
                comment: this.comment
            };
        },
        async fetchAllLeaveTypes() {
            try {
                await this.$store.dispatch('loadLeaveTypes');
                this.allLeaveTypes = this.$store.getters.leaveTypes || [];
            } catch (error) {
                console.error('Ошибка загрузки типов отпусков:', error);
                this.allLeaveTypes = [];
            }
        },
        async loadUser(userId) {
            if (!userId) return;
            
            try {
                const users = this.$store.getters.usersForCurrentCompany || [];
                let user = users.find(u => u.id === userId);
                
                if (!user) {
                    user = await UsersController.getItem(userId);
                }
                
                if (user) {
                    this.selectedUser = user;
                }
            } catch (error) {
                console.error('Ошибка загрузки пользователя:', error);
                this.selectedUser = { id: userId };
            }
        },
        prepareSave() {
            return {
                leaveTypeId: this.leaveTypeId,
                userId: this.userId,
                dateFrom: this.dateFrom,
                dateTo: this.dateTo,
                comment: this.comment || null
            };
        },
        async save() {
            if (!this.leaveTypeId || !this.userId || !this.dateFrom || !this.dateTo) {
                this.emitSavedError(this.$t('allRequiredFieldsMustBeFilled'));
                return;
            }
            if (new Date(this.dateTo) < new Date(this.dateFrom)) {
                this.emitSavedError(this.$t('dateToMustBeAfterDateFrom'));
                return;
            }
            return crudFormMixin.methods.save.call(this);
        },
        async performSave(data) {
            if (this.editingItemId != null) {
                return await LeaveController.updateItem(this.editingItemId, data);
            } else {
                return await LeaveController.storeItem(data);
            }
        },
        async performDelete() {
            const resp = await LeaveController.deleteItem(this.editingItemId);
            if (!resp.message) {
                throw new Error('Failed to delete leave');
            }
            return resp;
        },
        onSaveSuccess(response) {
            if (response && (response.message || response.item)) {
                this.clearForm();
            }
        },
        clearForm() {
            this.leaveTypeId = '';
            this.selectedUser = null;
            this.dateFrom = '';
            this.dateTo = '';
            this.comment = '';
            this.fetchAllLeaveTypes();
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
    }
}
</script>

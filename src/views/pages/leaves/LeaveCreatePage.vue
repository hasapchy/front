<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editLeave') : $t('createLeave') }}</h2>
        <div>
            <label class="required">{{ $t('leaveType') || 'Тип отпуска' }}</label>
            <select v-model="leaveTypeId" required>
                <option value="">{{ $t('selectLeaveType') || 'Выберите тип отпуска' }}</option>
                                        <option v-for="leaveType in allLeaveTypes" :key="leaveType.id" :value="leaveType.id">
                                            {{ translateLeaveType(leaveType.name, $t) }}
                                        </option>
            </select>
        </div>
        <div class="mt-4">
            <UserSearch v-model:selectedUser="selectedUser" :required="true" />
        </div>
        <div class="mt-4">
            <label class="required">{{ $t('dateFrom') || 'Дата начала' }}</label>
            <input type="datetime-local" v-model="dateFrom" required />
        </div>
        <div class="mt-4">
            <label class="required">{{ $t('dateTo') || 'Дата окончания' }}</label>
            <input type="datetime-local" v-model="dateTo" required :min="dateFrom" />
        </div>
        <div class="mt-4">
            <label>{{ $t('comment') || 'Комментарий' }}</label>
            <textarea v-model="comment" class="w-full border rounded p-2" rows="3"></textarea>
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-trash"
            :disabled="!$store.getters.hasPermission('leaves_delete_all')">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" 
            :disabled="!leaveTypeId || !userId || !dateFrom || !dateTo || 
            (editingItemId != null && !$store.getters.hasPermission('leaves_update_all')) ||
            (editingItemId == null && !$store.getters.hasPermission('leaves_create_all'))">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('confirmDelete')" :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
</template>

<script>
import LeaveController from '@/api/LeaveController';
import LeaveTypeController from '@/api/LeaveTypeController';
import LeaveDto from '@/dto/leave/LeaveDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import UserSearch from '@/views/components/app/search/UserSearch.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import crudFormMixin from "@/mixins/crudFormMixin";
import { translateLeaveType } from '@/utils/translationUtils';

export default {
    mixins: [getApiErrorMessage, formChangesMixin, crudFormMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { PrimaryButton, AlertDialog, UserSearch },
    props: {
        editingItem: { type: LeaveDto, required: false, default: null }
    },
    data() {
        return {
            leaveTypeId: this.editingItem ? this.editingItem.leaveTypeId : '',
            selectedUser: this.editingItem && this.editingItem.userId ? { id: this.editingItem.userId } : null,
            dateFrom: this.editingItem ? this.editingItem.dateFromForInput : '',
            dateTo: this.editingItem ? this.editingItem.dateToForInput : '',
            comment: this.editingItem ? (this.editingItem.comment || '') : '',
            allLeaveTypes: [],
        }
    },
    computed: {
        userId() {
            return this.selectedUser?.id || '';
        }
    },
    mounted() {
        this.$nextTick(async () => {
            await this.fetchAllLeaveTypes();
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
                this.allLeaveTypes = await LeaveTypeController.getListItems();
            } catch (error) {
                console.error('Ошибка загрузки типов отпусков:', error);
                this.allLeaveTypes = [];
            }
        },
        prepareSave() {
            return {
                leave_type_id: this.leaveTypeId,
                user_id: this.userId,
                date_from: this.dateFrom,
                date_to: this.dateTo,
                comment: this.comment || null
            };
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
        onEditingItemChanged(newEditingItem) {
            this.leaveTypeId = newEditingItem.leaveTypeId || '';
            this.selectedUser = newEditingItem.userId ? { id: newEditingItem.userId } : null;
            this.dateFrom = newEditingItem.dateFromForInput || '';
            this.dateTo = newEditingItem.dateToForInput || '';
            this.comment = newEditingItem.comment || '';
        }
    }
}
</script>


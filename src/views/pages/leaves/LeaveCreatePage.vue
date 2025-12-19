<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editLeave') : $t('createLeave') }}</h2>
        <div>
            <label class="required">{{ $t('leaveType') || 'Тип отпуска' }}</label>
            <select v-model="leaveTypeId" required>
                <option value="">{{ $t('selectLeaveType') || 'Выберите тип отпуска' }}</option>
                <option v-for="leaveType in allLeaveTypes" :key="leaveType.id" :value="leaveType.id">
                    {{ leaveType.name }}
                </option>
            </select>
        </div>
        <div class="mt-4">
            <label class="required">{{ $t('user') || 'Сотрудник' }}</label>
            <select v-model="userId" required>
                <option value="">{{ $t('selectUser') || 'Выберите сотрудника' }}</option>
                <option v-for="user in users" :key="user.id" :value="user.id">
                    {{ user.name }} {{ user.surname || '' }}
                </option>
            </select>
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
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";

export default {
    mixins: [getApiErrorMessage, formChangesMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { PrimaryButton, AlertDialog },
    props: {
        editingItem: { type: LeaveDto, required: false, default: null }
    },
    data() {
        return {
            leaveTypeId: this.editingItem ? this.editingItem.leaveTypeId : '',
            userId: this.editingItem ? this.editingItem.userId : '',
            dateFrom: this.editingItem ? this.editingItem.dateFromForInput : '',
            dateTo: this.editingItem ? this.editingItem.dateToForInput : '',
            comment: this.editingItem ? (this.editingItem.comment || '') : '',
            editingItemId: this.editingItem ? this.editingItem.id : null,
            allLeaveTypes: [],
            users: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false
        }
    },
    mounted() {
        this.$nextTick(async () => {
            await Promise.all([
                this.fetchAllLeaveTypes(),
                this.fetchUsers()
            ]);
            this.saveInitialState();
        });
    },
    methods: {
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
        async fetchUsers() {
            if (this.$store.getters.usersForCurrentCompany && this.$store.getters.usersForCurrentCompany.length > 0) {
                this.users = this.$store.getters.usersForCurrentCompany;
                return;
            }
            await this.$store.dispatch('loadUsers');
            this.users = this.$store.getters.usersForCurrentCompany;
        },
        async save() {
            if (!this.leaveTypeId || !this.userId || !this.dateFrom || !this.dateTo) {
                this.$emit('saved-error', this.$t('allRequiredFieldsMustBeFilled') || 'Все обязательные поля должны быть заполнены');
                return;
            }

            if (new Date(this.dateTo) < new Date(this.dateFrom)) {
                this.$emit('saved-error', this.$t('dateToMustBeAfterDateFrom') || 'Дата окончания должна быть после даты начала');
                return;
            }

            this.saveLoading = true;
            try {
                const payload = {
                    leave_type_id: this.leaveTypeId,
                    user_id: this.userId,
                    date_from: this.dateFrom,
                    date_to: this.dateTo,
                    comment: this.comment || null
                };

                let resp;
                if (this.editingItemId != null) {
                    resp = await LeaveController.updateItem(this.editingItemId, payload);
                } else {
                    resp = await LeaveController.storeItem(payload);
                }
                if (resp.message || resp.item) {
                    this.$emit('saved');
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('saved-error', this.getApiErrorMessage(error));
            }
            this.saveLoading = false;
        },
        async deleteItem() {
            this.closeDeleteDialog();
            if (!this.editingItemId) return;
            this.deleteLoading = true;
            try {
                const resp = await LeaveController.deleteItem(this.editingItemId);
                if (resp.message) {
                    this.$emit('deleted');
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('deleted-error', this.getApiErrorMessage(error));
            }
            this.deleteLoading = false;
        },
        clearForm() {
            this.leaveTypeId = '';
            this.userId = '';
            this.dateFrom = '';
            this.dateTo = '';
            this.comment = '';
            this.editingItemId = null;
            this.fetchAllLeaveTypes();
            this.fetchUsers();
            this.resetFormChanges();
        },
        showDeleteDialog() { this.deleteDialog = true; },
        closeDeleteDialog() { this.deleteDialog = false; }
    },
    watch: {
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.leaveTypeId = newEditingItem.leaveTypeId || '';
                    this.userId = newEditingItem.userId || '';
                    this.dateFrom = newEditingItem.dateFromForInput || '';
                    this.dateTo = newEditingItem.dateToForInput || '';
                    this.comment = newEditingItem.comment || '';
                    this.editingItemId = newEditingItem.id || null;
                } else {
                    this.leaveTypeId = '';
                    this.userId = '';
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
    }
}
</script>


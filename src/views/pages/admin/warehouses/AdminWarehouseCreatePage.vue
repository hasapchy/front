<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ warehouse ? $t('editWarehouse') : $t('createWarehouse') }}</h2>
        <div>
            <label>{{ $t('name') }}</label>
            <input type="text" v-model="name">
        </div>

        <div class="mt-4">
            <label class="inline-flex items-center gap-1 mb-1">
                <span>{{ $t('assignUsers') }}</span>
                <FieldHint
                    :text="$t('warehouseVisibleToEmployeesHint') || 'Сотрудники, которые видят этот склад и могут с ним работать. Должен быть выбран хотя бы один пользователь.'"
                    placement="top" />
            </label>
            <UserSearch v-model:selectedUsers="selectedUsers" :multiple="true" :filterUsers="userHasWarehouseAccess"
                :showLabel="false" />
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-trash"
            :disabled="!$store.getters.hasPermission('warehouses_delete')">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="!selectedUsers?.length || (editingItem != null && !$store.getters.hasPermission('warehouses_update')) ||
            (editingItem == null && !$store.getters.hasPermission('warehouses_create'))" :aria-label="$t('save')">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog" :descr="$t('deleteWarehouse')"
        :confirm-text="$t('deleteWarehouse')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose" :descr="$t('unsavedChanges')"
        :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
</template>


<script>
import UsersController from '@/api/UsersController';
import WarehouseController from '@/api/WarehouseController';
import WarehouseDto from '@/dto/warehouse/WarehouseDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import UserSearch from '@/views/components/app/search/UserSearch.vue';
import FieldHint from '@/views/components/app/forms/FieldHint.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import crudFormMixin from "@/mixins/crudFormMixin";
export default {
    mixins: [getApiErrorMessage, formChangesMixin, crudFormMixin],
    components: {
        PrimaryButton,
        AlertDialog,
        UserSearch,
        FieldHint,
    },
    props: {
        warehouse: {
            type: WarehouseDto,
            required: false,
            default: null
        }
    },
    data() {
        return {
            name: this.warehouse ? this.warehouse.name : '',
            selectedUsers: this.warehouse ? this.warehouse.getUserIds() : [],
            warehouseId: this.warehouse ? this.warehouse.id : null,
            editingItem: this.warehouse,
            users: [],
        }
    },
    created() {
        if (this.warehouse) {
            this.editingItem = this.warehouse;
        }
    },
    async mounted() {
        await this.fetchUsers();
        this.saveInitialState();
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    computed: {
        assignableUsers() {
            if (!Array.isArray(this.users)) {
                return [];
            }
            return this.users.filter(this.userHasWarehouseAccess);
        }
    },
    methods: {
        getFormState() {
            return {
                name: this.name,
                selectedUsers: [...this.selectedUsers]
            };
        },
        async fetchUsers() {
            if (this.$store.getters.usersForCurrentCompany?.length) {
                this.users = this.$store.getters.usersForCurrentCompany;
                this.filterSelectedUsers();
                return;
            }
            await this.$store.dispatch('loadUsers');
            this.users = this.$store.getters.usersForCurrentCompany;
            this.filterSelectedUsers();
        },
        userHasWarehouseAccess(user) {
            if (!user || !Array.isArray(user.permissions)) {
                return false;
            }
            return user.permissions.some(permission => permission === 'warehouses_view' || permission === 'warehouses_view_all' || permission.startsWith('warehouses_view_'));
        },
        filterSelectedUsers() {
            if (!Array.isArray(this.users) || !this.users.length) {
                return;
            }
            const availableIds = new Set(this.assignableUsers.map(user => user.id.toString()));
            const filtered = this.selectedUsers.filter(id => availableIds.has(id.toString()));
            if (filtered.length !== this.selectedUsers.length) {
                this.selectedUsers = filtered;
            }
        },
        prepareSave() {
            return {
                name: this.name,
                users: this.selectedUsers
            };
        },
        async performSave(data) {
            if (this.editingItemId != null) {
                return await WarehouseController.updateItem(this.editingItemId, data);
            } else {
                return await WarehouseController.storeItem(data);
            }
        },
        async performDelete() {
            const resp = await WarehouseController.deleteItem(this.editingItemId);
            if (!resp.message) {
                throw new Error('Failed to delete warehouse');
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
            this.selectedUsers = [];
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            if (newEditingItem) {
                this.name = newEditingItem.name || '';
                this.selectedUsers = newEditingItem.getUserIds() || [];
                this.warehouseId = newEditingItem.id || null;
            }
        }
    },
    watch: {
        warehouse: {
            handler(newWarehouse) {
                this.editingItem = newWarehouse;
            },
            deep: true,
            immediate: true
        }
    }

}

</script>
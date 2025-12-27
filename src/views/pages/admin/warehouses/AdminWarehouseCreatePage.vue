<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ warehouse ? $t('editWarehouse') : $t('createWarehouse') }}</h2>
        <div>
            <label>{{ $t('name') }}</label>
            <input type="text" v-model="name">
        </div>

        <div class="mt-4">
            <label>{{ $t('assignUsers') }}</label>
            <UserSearch
                v-model:selectedUsers="selectedUsers"
                :multiple="true"
                :filterUsers="userHasWarehouseAccess"
                :showLabel="false"
            />
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-trash"
            :disabled="!$store.getters.hasPermission('warehouses_delete')">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="!selectedUsers || selectedUsers.length === 0 || (editingItem != null && !$store.getters.hasPermission('warehouses_update')) ||
            (editingItem == null && !$store.getters.hasPermission('warehouses_create'))">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('deleteWarehouse')" :confirm-text="$t('deleteWarehouse')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
</template>


<script>
import UsersController from '@/api/UsersController';
import WarehouseController from '@/api/WarehouseController';
import WarehouseDto from '@/dto/warehouse/WarehouseDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import UserSearch from '@/views/components/app/search/UserSearch.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
export default {
    mixins: [getApiErrorMessage, formChangesMixin],
    components: {
        PrimaryButton,
        AlertDialog,
        UserSearch
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
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false
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
            if (this.$store.getters.usersForCurrentCompany && this.$store.getters.usersForCurrentCompany.length > 0) {
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
            if (!Array.isArray(this.users) || this.users.length === 0) {
                return;
            }
            const availableIds = new Set(this.assignableUsers.map(user => user.id.toString()));
            const filtered = this.selectedUsers.filter(id => availableIds.has(id.toString()));
            if (filtered.length !== this.selectedUsers.length) {
                this.selectedUsers = filtered;
            }
        },
        async save() {
            if (!this.selectedUsers || this.selectedUsers.length === 0) {
                this.$emit('saved-error', this.$t('warehouseMustHaveAtLeastOneUser'));
                return;
            }

            this.saveLoading = true;
            try {
                if (this.editingItem?.id != null) {
                    var resp = await WarehouseController.updateItem(
                        this.editingItem.id,
                        {
                            name: this.name,
                            users: this.selectedUsers
                        });
                } else {
                    var resp = await WarehouseController.storeItem({
                        name: this.name,
                        users: this.selectedUsers
                    });
                }
                if (resp.message) {
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
            if (this.editingItem?.id == null) {
                return;
            }
            this.deleteLoading = true;
            try {
                var resp = await WarehouseController.deleteItem(
                    this.editingItem.id);
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
            this.name = '';
            this.selectedUsers = [];
            this.resetFormChanges();
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        },

    },
    watch: {
        warehouse: {
            handler(newWarehouse) {
                if (newWarehouse) {
                    this.name = newWarehouse.name || '';
                    this.selectedUsers = newWarehouse.getUserIds() || [];
                    this.warehouseId = newWarehouse.id || null;
                    this.editingItem = newWarehouse;
                } else {
                    this.name = '';
                    this.selectedUsers = [];
                    this.warehouseId = null;
                    this.editingItem = null;
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
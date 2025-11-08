<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ warehouse ? $t('editWarehouse') : $t('createWarehouse') }}</h2>
        <div>
            <label>{{ $t('name') }}</label>
            <input type="text" v-model="name">
        </div>

        <div class="mt-4">
            <label>{{ $t('assignUsers') }}</label>
            <div v-if="users != null && users.length != 0" class="flex flex-wrap gap-2">
                <label v-for="user in users" :key="user.id"
                    class="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded">
                    <input type="checkbox" :value="user.id" v-model="selectedUsers" :id="'user-' + user.id">
                    <span>{{ user.name }}</span>
                </label>
            </div>
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-trash"
            :disabled="!$store.getters.hasPermission('warehouses_delete')">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItem != null && !$store.getters.hasPermission('warehouses_update')) ||
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
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
export default {
    mixins: [getApiErrorMessage, formChangesMixin],
    components: {
        PrimaryButton,
        AlertDialog
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
    mounted() {
        this.$nextTick(async () => {
            await this.fetchUsers();
            
            this.saveInitialState();
        });
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    methods: {
        getFormState() {
            return {
                name: this.name,
                selectedUsers: [...this.selectedUsers]
            };
        },
        async fetchUsers() {
            // ✅ Используем данные из store (кэш!)
            await this.$store.dispatch('loadUsers');
            // ✅ Используем геттер usersForCurrentCompany - автоматически фильтрует по текущей компании
            this.users = this.$store.getters.usersForCurrentCompany;
        },
        async save() {
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
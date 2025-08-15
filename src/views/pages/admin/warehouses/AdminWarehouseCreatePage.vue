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
            :is-loading="deleteLoading" icon="fas fa-remove"
            :disabled="!$store.getters.hasPermission('warehouses_delete')">
            {{ $t('delete') }}
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('warehouses_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('warehouses_create'))">
            {{ $t('save') }}
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
            selectedUsers: this.warehouse ? this.warehouse.users.map(user => user.id.toString()) : [],
            warehouseId: this.warehouse ? this.warehouse.id : null,
            users: [],
            selectedUsers: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false
        }
    },
    created() {
        this.fetchUsers();
    },
    mounted() {
        // Сохраняем начальное состояние после монтирования компонента
        this.$nextTick(() => {
            this.saveInitialState();
        });
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    methods: {
        // Переопределяем метод getFormState из миксина
        getFormState() {
            return {
                name: this.name,
                selectedUsers: [...this.selectedUsers]
            };
        },
        async fetchUsers() {
            this.users = await UsersController.getAllUsers();
        },
        async save() {
            this.saveLoading = true;
            try {
                if (this.warehouse?.id != null) {
                    var resp = await WarehouseController.updateWarehouse(
                        this.warehouse.id,
                        {
                            name: this.name,
                            users: this.selectedUsers
                        });
                } else {
                    var resp = await WarehouseController.storeWarehouse({
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
            if (this.warehouse?.id == null) {
                return;
            }
            this.deleteLoading = true;
            try {
                var resp = await WarehouseController.deleteWarehouse(
                    this.warehouse.id);
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
            this.resetFormChanges(); // Сбрасываем состояние изменений
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
                    this.selectedUsers = Array.isArray(newWarehouse.users)
                        ? newWarehouse.users
                        : [];
                    this.warehouseId = newWarehouse.id || null;
                } else {
                    this.name = '';
                    this.selectedUsers = [];
                    this.warehouseId = null;
                }
                // Сохраняем новое начальное состояние
                this.$nextTick(() => {
                    this.saveInitialState();
                });
            },
            deep: true,
            immediate: true
        }
    }
    // save() {
    //     this.$emit('save');
    // },
    // delete(id) {
    //     this.$emit('delete', id);
    // }
}

</script>
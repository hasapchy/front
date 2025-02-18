<template>
    <h2 class="text-lg font-bold mb-4">Склад</h2>
    <div>
        <label>Название</label>
        <input type="text" v-model="name" >
    </div>

    <div class="mt-4">
        <label>Назначить пользователей</label>
        <div v-if="users != null && users.length != 0" class="flex flex-wrap gap-2">
            <label v-for="user, index in users" :key="user.id" class="flex items-center space-x-2">
                <input type="checkbox" :value="user.id" v-model="selectedUsers" :id="'user-' + user.id">
                <span>{{ user.name }}</span>
            </label>
        </div>
    </div>

    <div class="mt-4 flex space-x-2">
        <PrimaryButton v-if="warehouse != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-remove">Удалить</PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">Сохранить</PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="'Подтвердите удаление склада'" :confirm-text="'Удалить склад'" :leave-text="'Отмена'" />
</template>


<script>
import UsersController from '@/api/UsersController';
import WarehouseController from '@/api/WarehouseController';
import WarehouseDto from '@/dto/warehouse/WarehouseDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
export default {
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
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error'],
    methods: {
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
                this.$emit('saved-error', error);
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
                this.$emit('deleted-error', error);
            }
            this.deleteLoading = false;
        },
        clearForm() {
            this.name = '';
            this.selectedUsers = [];
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        }

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
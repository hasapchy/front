<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">Категория</h2>
        <div>
            <label class="required">Название</label>
            <input type="text" v-model="name">
        </div>

        <div class="mt-4">
            <label>Назначить пользователей</label>
            <div v-if="users != null && users.length != 0" class="flex flex-wrap gap-2">
                <label v-for="user, index in users" :key="user.id"
                    class="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded">
                    <input type="checkbox" :value="user.id" v-model="selectedUsers" :id="'user-' + user.id">
                    <span class="text-black">{{ user.name }}</span>
                </label>
            </div>
        </div>
        <div class=" mt-4 mb-2">
            <label class="block mb-1">Родительская категория</label>
            <select v-model="selectedParentCategoryId">
                <option value="">Нет</option>
                <option v-if="allCategories.length" v-for="parent in allCategories" :value="parent.id">{{ parent.name }}
                </option>
            </select>
        </div>
    </div>
    <!-- {{ editingItem.id }} -->
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-remove">Удалить</PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">Сохранить</PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="'Подтвердите удаление категории'" :confirm-text="'Удалить категорию'" :leave-text="'Отмена'" />
</template>


<script>
import CategoryController from '@/api/CategoryController';
import UsersController from '@/api/UsersController';
import CategoryDto from '@/dto/category/CategoryDto';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';

export default {
    mixins: [getApiErrorMessage],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error'],
    components: { PrimaryButton, AlertDialog },
    props: {
        editingItem: { type: CategoryDto, required: false, default: null }
    },
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            selectedUsers: this.editingItem ? this.editingItem.users.map(user => user.id.toString()) : [],
            selectedParentCategoryId: this.editingItem ? this.editingItem.parentId : "",
            editingItemId: this.editingItem ? this.editingItem.id : null,
            users: [],
            allCategories: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false
        }
    },
    created() {
        this.fetchUsers();
        this.fetchAllCategories();
    },
    methods: {
        async fetchUsers() {
            this.users = await UsersController.getAllUsers();
        },
        async fetchAllCategories() {
            this.allCategories = await CategoryController.getAllItems();
        },
        async save() {
            this.saveLoading = true;
            try {
                if (this.editingItemId != null) {
                    var resp = await CategoryController.updateItem(
                        this.editingItemId,
                        {
                            name: this.name,
                            parent_id: this.selectedParentCategoryId,
                            users: this.selectedUsers,
                        });
                } else {
                    var resp = await CategoryController.storeItem({
                        name: this.name,
                        parent_id: this.selectedParentCategoryId,
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
            if (this.editingItemId == null) {
                return;
            }
            this.deleteLoading = true;
            try {
                var resp = await CategoryController.deleteItem(
                    this.editingItemId);
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
            this.selectedParentCategoryId = '';
            this.editingItemId = null;
            this.fetchAllCategories();
            this.fetchUsers();
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        },
    },
    watch: {
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.name = newEditingItem.name || '';
                    this.selectedUsers = Array.isArray(newEditingItem.users)
                        ? newEditingItem.users
                        : [];
                    this.selectedParentCategoryId = newEditingItem.parentId || '';
                    this.editingItemId = newEditingItem.id || null;
                } else {
                    this.name = '';
                    this.selectedUsers = [];
                    this.editingItemId = null;
                }
            },
            deep: true,
            immediate: true
        }
    }
}

</script>
<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editCategory') : $t('createCategory') }}</h2>
        <div>
                          <label class="required">{{ $t('name') }}</label>
            <input type="text" v-model="name">
        </div>

        <div class="mt-4">
            <label>{{ $t('assignUsers') }}</label>
            <div v-if="users != null && users.length != 0" class="flex flex-wrap gap-2">
                <template v-for="user in users" :key="user.id">
                    <label class="flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded">
                        <input type="checkbox" :value="user.id" v-model="selectedUsers" :id="'user-' + user.id">
                        <span class="text-black">{{ user.name }}</span>
                    </label>
                </template>
            </div>
        </div>
        <div class=" mt-4 mb-2">
            <label class="block mb-1">{{ $t('parentCategory') }}</label>
            <select v-model="selectedParentCategoryId" v-if="allCategories.length">
                <option value="">{{ $t('no') }}</option>
                <option v-for="parent in allCategories" :key="parent.id" :value="parent.id">{{ parent.name }}
                </option>
            </select>
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-trash"
            :disabled="!$store.getters.hasPermission('categories_delete')">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('categories_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('categories_create'))">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('confirmDelete')" :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
</template>


<script>
import CategoryController from '@/api/CategoryController';
import UsersController from '@/api/UsersController';
import CategoryDto from '@/dto/category/CategoryDto';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";

import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';

export default {
    mixins: [getApiErrorMessage, formChangesMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { PrimaryButton, AlertDialog },
    props: {
        editingItem: { type: CategoryDto, required: false, default: null }
    },
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            selectedUsers: this.editingItem ? this.editingItem.getUserIds() : [],
            selectedParentCategoryId: this.editingItem ? this.editingItem.parentId : "",
            editingItemId: this.editingItem ? this.editingItem.id : null,
            users: [],
            allCategories: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false
        }
    },
    mounted() {
        this.$nextTick(async () => {
            await Promise.all([
                this.fetchUsers(),
                this.fetchAllCategories()
            ]);
            
            this.saveInitialState();
        });
    },
    methods: {
        getFormState() {
            return {
                name: this.name,
                selectedUsers: [...this.selectedUsers],
                selectedParentCategoryId: this.selectedParentCategoryId
            };
        },
        async fetchUsers() {
            // ✅ Используем данные из store (кэш!)
            await this.$store.dispatch('loadUsers');
            this.users = this.$store.getters.users;
        },
        async fetchAllCategories() {
            // ✅ Используем данные из store (кэш!)
            await this.$store.dispatch('loadCategories');
            this.allCategories = this.$store.getters.categories;
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
            this.resetFormChanges();
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        }
    },
    watch: {
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.name = newEditingItem.name || '';
                    this.selectedUsers = newEditingItem.getUserIds() || [];
                    this.selectedParentCategoryId = newEditingItem.parentId || '';
                    this.editingItemId = newEditingItem.id || null;
                } else {
                    this.name = '';
                    this.selectedUsers = [];
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
<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editCategory') : $t('createCategory') }}</h2>
        <div>
                          <label class="required">{{ $t('name') }}</label>
            <input type="text" v-model="name">
        </div>

        <div class="mt-4">
            <label>{{ $t('assignUsers') }}</label>
            <CheckboxFilter
                v-if="assignableUsers.length"
                v-model="selectedUsers"
                :options="userOptions"
                :placeholder="'all'"
            />
        </div>
        <div class=" mt-4 mb-2">
            <label class="block mb-1">{{ $t('parentCategory') }}</label>
            <select v-model="selectedParentCategoryId" v-if="allCategories.length">
                <option value="">{{ $t('no') }}</option>
                <option v-for="parent in availableParentCategories" :key="parent.id" :value="parent.id">{{ parent.name }}
                </option>
            </select>
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-trash"
            :disabled="!$store.getters.hasPermission('categories_delete_all')">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="!selectedUsers || selectedUsers.length === 0 || (editingItemId != null && !$store.getters.hasPermission('categories_update_all')) ||
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
import CheckboxFilter from '@/views/components/app/forms/CheckboxFilter.vue';

export default {
    mixins: [getApiErrorMessage, formChangesMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { PrimaryButton, AlertDialog, CheckboxFilter },
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
    computed: {
        // Исключаем текущую редактируемую категорию из списка возможных родителей
        availableParentCategories() {
            if (!this.editingItemId) {
                // Если создаем новую категорию, показываем все категории
                return this.allCategories;
            }
            // Если редактируем существующую категорию, исключаем её саму
            return this.allCategories.filter(category => category.id != this.editingItemId);
        },
        assignableUsers() {
            if (!Array.isArray(this.users)) {
                return [];
            }
            return this.users.filter(this.userHasCategoryAccess);
        },
        userOptions() {
            return this.assignableUsers.map(user => {
                const fullName = [user.name, user.surname].filter(Boolean).join(' ').trim() || user.name;
                const position = user.position ? ` (${user.position})` : '';
                return {
                    value: user.id.toString(),
                    label: `${fullName}${position}`
                };
            });
        }
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
            if (this.$store.getters.usersForCurrentCompany && this.$store.getters.usersForCurrentCompany.length > 0) {
                this.users = this.$store.getters.usersForCurrentCompany;
                this.filterSelectedUsers();
                return;
            }
            await this.$store.dispatch('loadUsers');
            this.users = this.$store.getters.usersForCurrentCompany;
            this.filterSelectedUsers();
        },
        userHasCategoryAccess(user) {
            if (!user || !Array.isArray(user.permissions)) {
                return false;
            }
            return user.permissions.some(permission => permission === 'categories_view_all' || permission.startsWith('categories_view_'));
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
        async fetchAllCategories() {
            if (this.$store.getters.categories && this.$store.getters.categories.length > 0) {
                this.allCategories = this.$store.getters.categories;
                return;
            }
            await this.$store.dispatch('loadCategories');
            this.allCategories = this.$store.getters.categories;
        },
        async save() {
            if (!this.selectedUsers || this.selectedUsers.length === 0) {
                this.$emit('saved-error', this.$t('categoryMustHaveAtLeastOneUser'));
                return;
            }

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
                    this.editingItemId = newEditingItem.id || null;
                    
                    // Проверяем, что родительская категория не является самой собой
                    const parentId = newEditingItem.parentId || '';
                    if (parentId == this.editingItemId) {
                        // Если категория ссылается сама на себя, сбрасываем родительскую категорию
                        this.selectedParentCategoryId = '';
                    } else {
                        this.selectedParentCategoryId = parentId;
                    }
                } else {
                    this.name = '';
                    this.selectedUsers = [];
                    this.selectedParentCategoryId = '';
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
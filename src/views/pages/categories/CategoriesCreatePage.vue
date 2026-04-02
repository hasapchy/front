<template>
  <div class="flex flex-col h-full">
    <div class="flex flex-col overflow-auto flex-1 p-4">
      <div>
        <label class="required">{{ $t('name') }}</label>
        <input
          v-model="name"
          type="text"
        >
      </div>

      <div class="mt-4">
        <label>{{ $t('assignUsers') }}</label>
        <UserSearch
          :selected-users="selectedUsers"
          :multiple="true"
          :filter-users="userHasCategoryAccess"
          :show-label="false"
          @update:selected-users="selectedUsers = $event"
        />
      </div>
      <div class="mt-4 mb-2">
        <label class="block mb-1">{{ $t('parentCategory') }}</label>
        <select
          v-if="allCategories.length"
          v-model="selectedParentCategoryId"
        >
          <option value="">
            {{ $t('no') }}
          </option>
          <option
            v-for="parent in availableParentCategories"
            :key="parent.id"
            :value="parent.id"
          >
            {{ parent.name }}
          </option>
        </select>
      </div>
    </div>
    <div class="p-4 flex space-x-2 bg-[#edf4fb]">
      <PrimaryButton
        v-if="editingItem != null"
        :onclick="showDeleteDialog"
        :is-danger="true"
        :is-loading="deleteLoading"
        icon="fas fa-trash"
        :disabled="!$store.getters.hasPermission('categories_delete_all')"
      />
      <PrimaryButton
        icon="fas fa-save"
        :onclick="save"
        :is-loading="saveLoading"
        :disabled="!selectedUsers?.length || (editingItemId != null && !$store.getters.hasPermission('categories_update_all')) ||
          (editingItemId == null && !$store.getters.hasPermission('categories_create'))"
        :aria-label="$t('save')"
      />
    </div>
    <AlertDialog
      :dialog="deleteDialog"
      :descr="$t('confirmDelete')"
      :confirm-text="$t('delete')"
      :leave-text="$t('cancel')"
      @confirm="deleteItem"
      @leave="closeDeleteDialog"
    />
    <AlertDialog
      :dialog="closeConfirmDialog"
      :descr="$t('unsavedChanges')"
      :confirm-text="$t('closeWithoutSaving')"
      :leave-text="$t('stay')"
      @confirm="confirmClose"
      @leave="cancelClose"
    />
  </div>
</template>


<script>
import CategoryController from '@/api/CategoryController';
import UsersController from '@/api/UsersController';
import CategoryDto from '@/dto/category/CategoryDto';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from "@/mixins/crudFormMixin";

import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import UserSearch from '@/views/components/app/search/UserSearch.vue';

export default {
    components: { PrimaryButton, AlertDialog, UserSearch },
    mixins: [getApiErrorMessage, crudFormMixin],
    props: {
        editingItem: { type: CategoryDto, required: false, default: null }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            selectedUsers: this.editingItem ? this.editingItem.getUserIds() : [],
            selectedParentCategoryId: this.editingItem ? this.editingItem.parentId : "",
            users: [],
            allCategories: [],
        }
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
            if (this.$store.getters.usersForCurrentCompany?.length) {
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
            if (!Array.isArray(this.users) || !this.users.length) {
                return;
            }
            const availableIds = new Set(this.assignableUsers.map(user => user.id.toString()));
            const filtered = this.selectedUsers.filter(id => availableIds.has(id.toString()));
            if (filtered.length !== this.selectedUsers.length) {
                this.selectedUsers = filtered;
            }
        },
        async fetchAllCategories() {
            if (this.$store.getters.categories?.length) {
                this.allCategories = this.$store.getters.categories;
                return;
            }
            await this.$store.dispatch('loadCategories');
            this.allCategories = this.$store.getters.categories;
        },
        prepareSave() {
            return {
                name: this.name,
                parentId: this.selectedParentCategoryId,
                users: this.selectedUsers,
            };
        },
        async performSave(data) {
            if (this.editingItemId != null) {
                return await CategoryController.updateItem(this.editingItemId, data);
            } else {
                return await CategoryController.storeItem(data);
            }
        },
        async performDelete() {
            const resp = await CategoryController.deleteItem(this.editingItemId);
            if (!resp.message) {
                throw new Error('Failed to delete category');
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
            this.selectedParentCategoryId = '';
            this.fetchAllCategories();
            this.fetchUsers();
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            this.name = newEditingItem.name ;
            this.selectedUsers = newEditingItem.getUserIds() || [];
            
            const parentId = newEditingItem.parentId ;
            if (parentId == this.editingItemId) {
                this.selectedParentCategoryId = '';
            } else {
                this.selectedParentCategoryId = parentId;
            }
        }
    }
}

</script>
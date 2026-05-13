<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
    <div>
      <label>{{ $t('name') }}</label>
      <input
        v-model="name"
        type="text"
      >
    </div>

    <div class="mt-4">
      <label class="inline-flex items-center gap-1 mb-1">
        <span>{{ $t('assignUsers') }}</span>
        <FieldHint
          :text="$t('warehouseVisibleToEmployeesHint')"
          placement="top"
        />
      </label>
      <UserSearch
        :selected-users="selectedUsers"
        :multiple="true"
        :filter-users="userHasWarehouseAccess"
        :locked-user-ids="lockedUserIds"
        :show-label="false"
        @update:selected-users="selectedUsers = $event"
      />
    </div>
    </div>
    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton
          v-if="editingItem != null"
          :onclick="showDeleteDialog"
          :is-danger="true"
          :is-loading="deleteLoading"
          icon="fas fa-trash"
          :disabled="!$store.getters.hasPermission('warehouses_delete')"
        />
        <PrimaryButton
          icon="fas fa-save"
          :onclick="save"
          :is-loading="saveLoading"
          :disabled="!selectedUsers?.length || (editingItem != null && !$store.getters.hasPermission('warehouses_update')) ||
            (editingItem == null && !$store.getters.hasPermission('warehouses_create'))"
          :aria-label="$t('save')"
        />
      </div>
    </teleport>
  </div>
  <AlertDialog
    :dialog="deleteDialog"
    :descr="$t('deleteWarehouse')"
    :confirm-text="$t('deleteWarehouse')"
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
</template>


<script>
import WarehouseController from '@/api/WarehouseController';
import WarehouseDto from '@/dto/warehouse/WarehouseDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import UserSearch from '@/views/components/app/search/UserSearch.vue';
import FieldHint from '@/views/components/app/forms/FieldHint.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from "@/mixins/crudFormMixin";
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
export default {
    components: {
        PrimaryButton,
        AlertDialog,
        UserSearch,
        FieldHint,
    },
    mixins: [getApiErrorMessage, crudFormMixin, sideModalFooterPortal],
    props: {
        warehouse: {
            type: WarehouseDto,
            required: false,
            default: null
        }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    data() {
        return {
            name: this.warehouse ? this.warehouse.name : '',
            selectedUsers: this.warehouse ? this.warehouse.getUserIds() : [],
            editingItem: this.warehouse,
            users: [],
        }
    },
    computed: {
        assignableUsers() {
            if (!Array.isArray(this.users)) {
                return [];
            }
            return this.users.filter(this.userHasWarehouseAccess);
        },
        lockedUserIds() {
            const user = this.$store.getters.user || this.$store.state.user;
            return user && user.isAdmin !== true && Number(user.is_admin) !== 1 ? [user.id] : [];
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
            this.ensureCurrentUserSelected();
        },
        ensureCurrentUserSelected() {
            const userId = this.lockedUserIds[0];
            if (!userId) return;
            const selected = Array.isArray(this.selectedUsers) ? this.selectedUsers.map(id => Number(id)) : [];
            if (!selected.includes(Number(userId))) {
                this.selectedUsers = [...selected, Number(userId)];
            }
        },
        prepareSave() {
            this.ensureCurrentUserSelected();
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
            this.ensureCurrentUserSelected();
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            if (newEditingItem) {
                this.name = newEditingItem.name ;
                this.selectedUsers = newEditingItem.getUserIds() || [];
                this.ensureCurrentUserSelected();
            }
        }
    }

}

</script>
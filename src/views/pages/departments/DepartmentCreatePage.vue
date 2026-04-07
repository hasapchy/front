<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
    <div>
      <label class="required">{{ $t('title') }}</label>
      <input
        v-model="title"
        type="text"
        required
        placeholder="Введите название отдела"
      >
    </div>
    <div class="mt-4">
      <label>{{ $t('description') }}</label>
      <textarea
        v-model="description"
        class="w-full border rounded p-2"
        rows="3"
        placeholder="Описание деятельности отдела"
      />
    </div>
    <div class="mt-4">
      <label>{{ $t('parentDepartment') }}</label>
      <select v-model="parentIdValue">
        <option :value="null">
          Без родительского отдела
        </option>
        <option
          v-for="opt in departmentOptions"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
    </div>
    <div class="mt-4">
      <label>{{ $t('head') }}</label>
      <select v-model="headId">
        <option :value="null">
          Не назначен
        </option>
        <option
          v-for="opt in userOptions"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
    </div>
    <div class="mt-4">
      <label>{{ $t('deputyHead') }}</label>
      <select v-model="deputyHeadId">
        <option :value="null">
          Не назначен
        </option>
        <option
          v-for="opt in userOptions"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
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
          :disabled="!$store.getters.hasPermission('departments_delete_all')"
          :aria-label="$t('delete')"
        />
        <PrimaryButton
          icon="fas fa-save"
          :onclick="save"
          :is-loading="saveLoading"
          :aria-label="$t('save')"
          :disabled="!title ||
            (editingItemId != null && !$store.getters.hasPermission('departments_update_all')) ||
            (editingItemId == null && !$store.getters.hasPermission('departments_create'))"
        />
      </div>
    </teleport>
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
</template>

<script>
import DepartmentController from '@/api/DepartmentController';
import UsersController from '@/api/UsersController';
import { DepartmentDto } from '@/dto/departments/DepartmentDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';

export default {
    name: 'DepartmentCreatePage',
    components: { PrimaryButton, AlertDialog },
    mixins: [getApiErrorMessage, crudFormMixin, sideModalFooterPortal],
    props: {
        editingItem: { type: DepartmentDto, required: false, default: null },
        parentId: { type: [Number, String], default: null }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    data() {
        return {
            title: this.editingItem ? this.editingItem.title : '',
            description: this.editingItem ? this.editingItem.description : '',
            parentIdValue: this.editingItem ? this.editingItem.parentId : (this.parentId || null),
            headId: this.editingItem ? this.editingItem.headId : null,
            deputyHeadId: this.editingItem ? this.editingItem.deputyHeadId : null,
            users: [],
            departments: [],
        }
    },
    computed: {
        userOptions() {
            return this.users.map(u => ({
                value: u.id,
                label: u.surname ? `${u.name} ${u.surname}` : u.name 
            }));
        },
        departmentOptions() {
            return this.departments
                .filter(d => !this.editingItemId || d.id !== this.editingItemId)
                .map(d => ({
                    value: d.id,
                    label: d.title
                }));
        }
    },
    watch: {
        editingItem: {
            handler(newItem) {
                setTimeout(() => {
                    if (newItem) {
                        this.title = newItem.title ;
                        this.description = newItem.description ;
                        this.parentIdValue = newItem.parentId || null;
                        this.headId = newItem.headId || null;
                        this.deputyHeadId = newItem.deputyHeadId || null;
                    } else {
                        this.title = '';
                        this.description = '';
                        this.parentIdValue = this.parentId || null;
                        this.headId = null;
                        this.deputyHeadId = null;
                    }
                    this.$nextTick(() => {
                        this.saveInitialState();
                    });
                }, 50);
            },
            deep: true,
            immediate: true
        },
        parentId: {
            handler(newParentId) {
                if (!this.editingItem) {
                    setTimeout(() => {
                        this.parentIdValue = newParentId || null;
                        this.$nextTick(() => {
                            this.saveInitialState();
                        });
                    }, 50);
                }
            },
            immediate: true
        }
    },
    mounted() {
        this.$nextTick(async () => {
            await Promise.all([
                this.fetchUsers(),
                this.fetchDepartments()
            ]);
            this.saveInitialState();
        });
    },
    methods: {
        getFormState() {
            return {
                title: this.title,
                description: this.description,
                parentIdValue: this.parentIdValue,
                headId: this.headId,
                deputyHeadId: this.deputyHeadId
            };
        },
        async fetchUsers() {
            try {
                this.users = await UsersController.getListItems();
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        },
        async fetchDepartments() {
            try {
                this.departments = await DepartmentController.getAllItems();
            } catch (error) {
                console.error('Error fetching departments:', error);
            }
        },
        prepareSave() {
            return {
                title: this.title,
                description: this.description,
                parentId: this.parentIdValue,
                headId: this.headId,
                deputyHeadId: this.deputyHeadId,
                companyId: this.$store.getters.currentCompany?.id
            };
        },
        async performSave(data) {
            if (this.editingItemId != null) {
                return await DepartmentController.updateItem(this.editingItemId, data);
            }
            return await DepartmentController.storeItem(data);
        },
        async performDelete() {
            const resp = await DepartmentController.deleteItem(this.editingItemId);
            if (!resp.message && !resp.success) {
                throw new Error('Failed to delete');
            }
            return resp;
        },
        async save() {
            if (!this.validateRequiredFields([
                { value: this.title, message: this.$t('allRequiredFieldsMustBeFilled') }
            ])) {
                return;
            }
            return crudFormMixin.methods.save.call(this);
        },
    }
};
</script>

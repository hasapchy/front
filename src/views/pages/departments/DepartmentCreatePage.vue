<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editDepartment') : $t('addDepartment') }}</h2>
        <div>
            <label class="required">{{ $t('title') || 'Название' }}</label>
            <input type="text" v-model="title" required placeholder="Введите название отдела" />
        </div>
        <div class="mt-4">
            <label>{{ $t('description') || 'Описание' }}</label>
            <textarea v-model="description" class="w-full border rounded p-2" rows="3" placeholder="Описание деятельности отдела"></textarea>
        </div>
        <div class="mt-4">
            <label>{{ $t('parentDepartment') || 'Вышестоящий отдел' }}</label>
            <select v-model="parentIdValue">
                <option :value="null">Без родительского отдела</option>
                <option v-for="opt in departmentOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                </option>
            </select>
        </div>
        <div class="mt-4">
            <label>{{ $t('head') || 'Руководитель' }}</label>
            <select v-model="headId">
                <option :value="null">Не назначен</option>
                <option v-for="opt in userOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                </option>
            </select>
        </div>
        <div class="mt-4">
            <label>{{ $t('deputyHead') || 'Заместитель' }}</label>
            <select v-model="deputyHeadId">
                <option :value="null">Не назначен</option>
                <option v-for="opt in userOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                </option>
            </select>
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-trash"
            :disabled="!$store.getters.hasPermission('departments_delete_all')">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" 
            :disabled="!title || 
            (editingItemId != null && !$store.getters.hasPermission('departments_update_all')) ||
            (editingItemId == null && !$store.getters.hasPermission('departments_create'))">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('confirmDelete')" :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
</template>

<script>
import DepartmentController from '@/api/DepartmentController';
import UsersController from '@/api/UsersController';
import { DepartmentDto } from '@/dto/departments/DepartmentDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";

export default {
    name: 'DepartmentCreatePage',
    mixins: [getApiErrorMessage, formChangesMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { PrimaryButton, AlertDialog },
    props: {
        editingItem: { type: DepartmentDto, required: false, default: null },
        parentId: { type: [Number, String], default: null }
    },
    data() {
        return {
            title: this.editingItem ? this.editingItem.title : '',
            description: this.editingItem ? this.editingItem.description : '',
            parentIdValue: this.editingItem ? this.editingItem.parentId : (this.parentId || null),
            headId: this.editingItem ? this.editingItem.headId : null,
            deputyHeadId: this.editingItem ? this.editingItem.deputyHeadId : null,
            editingItemId: this.editingItem ? this.editingItem.id : null,
            users: [],
            departments: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false
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
    computed: {
        userOptions() {
            return this.users.map(u => ({
                value: u.id,
                label: u.surname ? `${u.name} ${u.surname}` : u.name || ''
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
        async save() {
            if (!this.title) {
                this.$emit('saved-error', this.$t('allRequiredFieldsMustBeFilled') || 'Все обязательные поля должны быть заполнены');
                return;
            }

            this.saveLoading = true;
            try {
                const payload = {
                    title: this.title,
                    description: this.description,
                    parent_id: this.parentIdValue,
                    head_id: this.headId,
                    deputy_head_id: this.deputyHeadId,
                    company_id: this.$store.getters.currentCompany?.id
                };

                let resp;
                if (this.editingItemId != null) {
                    resp = await DepartmentController.updateItem(this.editingItemId, payload);
                } else {
                    resp = await DepartmentController.storeItem(payload);
                }
                
                if (resp.message || resp.id || resp.department) {
                    this.$emit('saved');
                }
            } catch (error) {
                this.$emit('saved-error', this.getApiErrorMessage(error));
            }
            this.saveLoading = false;
        },
        async deleteItem() {
            this.closeDeleteDialog();
            if (!this.editingItemId) return;
            this.deleteLoading = true;
            try {
                const resp = await DepartmentController.deleteItem(this.editingItemId);
                if (resp.message || resp.success) {
                    this.$emit('deleted');
                }
            } catch (error) {
                this.$emit('deleted-error', this.getApiErrorMessage(error));
            }
            this.deleteLoading = false;
        },
        showDeleteDialog() { this.deleteDialog = true; },
        closeDeleteDialog() { this.deleteDialog = false; }
    },
    watch: {
        editingItem: {
            handler(newItem, oldItem) {
                // Добавляем небольшую задержку для корректной обработки изменений
                setTimeout(() => {
                    if (newItem) {
                        // Редактирование существующего отдела
                        this.title = newItem.title || '';
                        this.description = newItem.description || '';
                        this.parentIdValue = newItem.parentId || null;
                        this.headId = newItem.headId || null;
                        this.deputyHeadId = newItem.deputyHeadId || null;
                        this.editingItemId = newItem.id || null;
                    } else {
                        // editingItem стал null или undefined - создание нового отдела, сбрасываем форму
                        this.title = '';
                        this.description = '';
                        this.parentIdValue = this.parentId || null;
                        this.headId = null;
                        this.deputyHeadId = null;
                        this.editingItemId = null;
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
                // Обновляем parentIdValue только если создаем новый отдел (не редактируем)
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
    }
};
</script>

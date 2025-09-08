<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editUser') : $t('createUser') }}
        </h2>
        <TabBar :tabs="translatedTabs" :active-tab="currentTab" :tab-click="(t) => {
            changeTab(t);
        }
            " :key="`tabs-${$i18n.locale}`" />
        <div>
            <div v-show="currentTab === 'info'">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2 required">{{ $t('name') }}</label>
                    <input 
                        type="text" 
                        v-model="form.name" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2 required">{{ $t('email') }}</label>
                    <input 
                        type="email" 
                        v-model="form.email" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div class="mb-4" v-if="!editingItem">
                    <label class="block text-sm font-medium text-gray-700 mb-2 required">{{ $t('password') }}</label>
                    <div class="flex items-center space-x-2">
                        <input 
                            :type="showPassword ? 'text' : 'password'" 
                            v-model="form.password" 
                            :placeholder="$t('enterPassword')" 
                            class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <PrimaryButton :onclick="togglePasswordVisibility" :icon="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" class="px-2 py-1" />
                        <PrimaryButton :onclick="generatePassword" :icon="'fas fa-dice'" class="px-2 py-1" />
                    </div>
                </div>

                <div class="mb-4" v-if="!editingItem">
                    <label class="block text-sm font-medium text-gray-700 mb-2 required">{{ $t('confirmPassword') }}</label>
                    <div class="flex items-center space-x-2">
                        <input 
                            :type="showConfirmPassword ? 'text' : 'password'" 
                            v-model="form.confirmPassword" 
                            :placeholder="$t('confirmPassword')" 
                            class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <PrimaryButton :onclick="toggleConfirmPasswordVisibility" :icon="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" class="px-2 py-1" />
                    </div>
                </div>

                <div class="mb-4" v-if="editingItem">
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('newPassword') }}</label>
                    <div class="flex items-center space-x-2">
                        <input 
                            :type="showNewPassword ? 'text' : 'password'" 
                            v-model="form.newPassword" 
                            :placeholder="$t('enterNewPassword')" 
                            class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <PrimaryButton :onclick="toggleNewPasswordVisibility" :icon="showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" class="px-2 py-1" />
                        <PrimaryButton :onclick="generateNewPassword" :icon="'fas fa-dice'" class="px-2 py-1" />
                    </div>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('position') }}</label>
                    <input 
                        type="text" 
                        v-model="form.position" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('hireDate') }}</label>
                    <input 
                        type="date" 
                        v-model="form.hire_date" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('characteristics') }}</label>
                    <div class="flex items-center space-x-6">
                        <label class="flex items-center space-x-2">
                            <input 
                                type="checkbox" 
                                v-model="form.is_active" 
                                :true-value="true" 
                                :false-value="false"
                                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span class="text-sm text-gray-700">{{ $t('userStatus') }}</span>
                        </label>
                        <label class="flex items-center space-x-2">
                            <input 
                                type="checkbox" 
                                v-model="form.is_admin" 
                                :true-value="true" 
                                :false-value="false"
                                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span class="text-sm text-gray-700">{{ $t('isAdmin') }}</span>
                        </label>
                    </div>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('companies') }}</label>
                    <div class="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50">
                        <div v-for="company in companies" :key="company.id" class="flex items-center space-x-2 mb-2">
                            <input 
                                type="checkbox" 
                                :id="`company-${company.id}`"
                                :value="company.id" 
                                v-model="form.companies"
                                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label :for="`company-${company.id}`" class="text-sm text-gray-700 cursor-pointer">{{ company.name }}</label>
                        </div>
                    </div>
                </div>
            </div>
            <div v-show="currentTab === 'permissions'">
                <div class="mb-4">
                    <label class="font-semibold mb-2 block">{{ $t('userPermissions') }}</label>

                    <div class="mb-2">
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" v-model="selectAllChecked" @change="toggleSelectAll">
                            <span>{{ $t('selectAllPermissions') }}</span>
                        </label>
                    </div>

                    <div v-if="groupedPermissions">
                        <div v-for="(actions, group) in sortedGroupedPermissions" :key="group"
                            class="mb-2 border rounded p-2">
                            <div class="flex items-center justify-between mb-1">
                                <span class="font-semibold">
                                    {{ permissionGroupLabel(actions[0]?.name || group) }}
                                </span>
                                <label class="flex items-center space-x-1 text-sm">
                                    <input type="checkbox" :checked="isGroupChecked(group)"
                                        @change="toggleGroup(group)" />
                                    <span>{{ $t('all') }}</span>
                                </label>
                            </div>

                            <div class="flex flex-wrap gap-2 text-xs">
                                <label v-for="perm in sortedPermissions(actions)" :key="perm.name"
                                    class="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded text-[11px] whitespace-nowrap">
                                    <input type="checkbox" :value="perm.name" v-model="form.permissions" />
                                    <i :class="[permissionIcon(perm.name), permissionColor(perm.name)]" />
                                    <span>{{ permissionLabel(perm.name) }}</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-remove" :disabled="!$store.getters.hasPermission('users_delete')">
            {{ $t('delete') }}
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('users_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('users_create'))">
            {{ $t('save') }}
        </PrimaryButton>
    </div>

    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('confirmDelete')" :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import UsersController from '@/api/UsersController';
import CompaniesController from '@/api/CompaniesController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";

import {
    permissionIcon,
    permissionLabel,
    permissionColor,
    permissionGroupLabel,
    getPermissionPrefix,
} from '@/utils/PermissionUtils';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import AuthController from '@/api/AuthController';

export default {
    mixins: [getApiErrorMessage, formChangesMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { PrimaryButton, AlertDialog, TabBar },
    props: {
        editingItem: { type: Object, required: false, default: null },
    },
    data() {
        return {
            form: {
                name: '',
                email: '',
                password: '',
                confirmPassword: '',
                newPassword: '',
                position: '',
                hire_date: '',
            is_active: true,
            is_admin: false,
            companies: [],
            permissions: [],
            },
            editingItemId: null,
            allPermissions: [],
            companies: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            currentTab: 'info',
            showPassword: false,
            showConfirmPassword: false,
            showNewPassword: false,
            tabs: [
                { name: 'info', label: 'information' },
                { name: 'permissions', label: 'permissions' }
            ],
        };
    },
    computed: {
        translatedTabs() {
            return this.tabs.map(tab => ({
                ...tab,
                label: this.$t(tab.label)
            }));
        },
        groupedPermissions() {
            const groups = {};
            this.allPermissions.forEach((p) => {
                const parts = p.name.split('_');
                const prefix = parts.length >= 3 ? `${parts[0]}_${parts[1]}` : parts[0];
                if (!groups[prefix]) groups[prefix] = [];
                groups[prefix].push(p);
            });
            return groups;
        },
        sortedGroupedPermissions() {
            const sorted = {};
            Object.keys(this.groupedPermissions)
                .sort()
                .forEach((key) => {
                    sorted[key] = this.groupedPermissions[key];
                });
            return sorted;
        },
        selectAllChecked: {
            get() {
                return this.form.permissions.length === this.allPermissions.length;
            },
            set() { }
        }
    },
    mounted() {
        if (typeof window !== 'undefined') {
            window.i18n = this.$i18n;
        }
        
        this.$nextTick(async () => {
            await Promise.all([
                this.fetchPermissions(),
                this.fetchCompanies()
            ]);
            
            if (!this.editingItem) {
                this.clearForm();
            }
            
            this.saveInitialState();
        });
    },
    methods: {
        getFormState() {
            return {
                name: this.form.name,
                email: this.form.email,
                password: this.form.password,
                confirmPassword: this.form.confirmPassword,
                newPassword: this.form.newPassword,
                position: this.form.position,
                hire_date: this.form.hire_date,
                is_active: this.form.is_active,
                is_admin: this.form.is_admin,
                companies: [...this.form.companies],
                permissions: [...this.form.permissions]
            };
        },
        async fetchPermissions() {
            this.allPermissions = await UsersController.getAllPermissions();
        },
        async fetchCompanies() {
            try {
                const result = await CompaniesController.getItems();
                this.companies = result.items || result;
            } catch (error) {
                console.error('Error fetching companies:', error);
                this.companies = [];
            }
        },
        clearForm() {
            this.form.name = '';
            this.form.email = '';
            this.form.password = '';
            this.form.confirmPassword = '';
            this.form.newPassword = '';
            this.form.position = '';
            this.form.hire_date = '';
            this.form.is_active = true;
            this.form.is_admin = false;
            this.form.companies = [];
            this.form.permissions = [];
            this.editingItemId = null;
            this.showPassword = false;
            this.showConfirmPassword = false;
            this.showNewPassword = false;
            this.resetFormChanges();
        },
        isGroupChecked(group) {
            const groupPermissions = this.allPermissions
                .filter((p) => p.name.startsWith(`${group}_`));
            return groupPermissions.every((p) => this.form.permissions.includes(p.name));
        },
        toggleGroup(group) {
            const groupPermissions = this.allPermissions
                .filter((p) => p.name.startsWith(`${group}_`))
                .map((p) => p.name);
            const allChecked = this.isGroupChecked(group);
            if (allChecked) {
                this.form.permissions = this.form.permissions.filter(
                    (p) => !groupPermissions.includes(p)
                );
            } else {
                this.form.permissions = [...new Set([...this.form.permissions, ...groupPermissions])];
            }
        },
        toggleSelectAll() {
            if (this.selectAllChecked) {
                this.form.permissions = [];
            } else {
                this.form.permissions = this.allPermissions.map((p) => p.name);
            }
        },
        sortedPermissions(permissions) {
            return [...permissions].sort((a, b) => a.name.localeCompare(b.name));
        },
        permissionIcon,
        permissionLabel(name) {
            const action = name.split("_").at(-1);
            return this.$t(action) || action;
        },
        permissionColor,
        permissionGroupLabel(name) {
            const parts = name.split("_");
            const prefix = parts.length > 2 ? `${parts[0]}_${parts[1]}` : parts[0];
            return this.$t(prefix) || prefix;
        },
        getPermissionPrefix,
        async save() {
            if (!this.editingItemId && this.form.password !== this.form.confirmPassword) {
                this.$emit('saved-error', this.$t('passwordsDoNotMatch'));
                return;
            }
            
            this.saveLoading = true;
            try {
                let savedUser;

                if (this.editingItemId) {
                    const updateData = {
                        name: this.form.name,
                        email: this.form.email,
                        position: this.form.position,
                        hire_date: this.form.hire_date,
                        is_active: this.form.is_active,
                        is_admin: this.form.is_admin,
                        permissions: this.form.permissions
                    };
                    
                    if (this.form.newPassword) {
                        updateData.password = this.form.newPassword;
                    }
                    
                    savedUser = await UsersController.updateItem(this.editingItemId, updateData);
                } else {
                    savedUser = await UsersController.storeItem(this.form);
                }

                const currentUser = this.$store.state.user;
                if (savedUser.id === currentUser.id) {
                    const updatedUser = await AuthController.getUser();
                    this.$store.dispatch('setUser', updatedUser);
                    this.$store.dispatch('setPermissions', updatedUser.permissions);
                }

                this.$emit('saved');
            } catch (e) {
                this.$emit('saved-error', this.getApiErrorMessage(e));
            }
            this.saveLoading = false;
        },
        togglePasswordVisibility() {
            this.showPassword = !this.showPassword;
        },
        toggleConfirmPasswordVisibility() {
            this.showConfirmPassword = !this.showConfirmPassword;
        },
        toggleNewPasswordVisibility() {
            this.showNewPassword = !this.showNewPassword;
        },
        generatePassword() {
            const password = this.generateRandomPassword();
            this.form.password = password;
            this.form.confirmPassword = password;
        },
        generateNewPassword() {
            this.form.newPassword = this.generateRandomPassword();
        },
        generateRandomPassword() {
            const length = 12;
            const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
            let password = "";
            for (let i = 0; i < length; i++) {
                password += charset.charAt(Math.floor(Math.random() * charset.length));
            }
            return password;
        },
        changeTab(tab) {
            this.currentTab = tab;
        },
        async deleteItem() {
            this.closeDeleteDialog();
            if (!this.editingItemId) return;
            this.deleteLoading = true;
            try {
                await UsersController.deleteItem(this.editingItemId);
                this.$emit('deleted');
            } catch (e) {
                this.$emit('deleted-error', this.getApiErrorMessage(e));
            }
            this.deleteLoading = false;
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
            handler(newEditingItem, oldEditingItem) {
                if (newEditingItem) {
                    this.form.name = newEditingItem.name || '';
                    this.form.email = newEditingItem.email || '';
                    this.form.position = newEditingItem.position || '';
                    this.form.hire_date = newEditingItem.hireDate || '';
                    this.form.is_active = newEditingItem.isActive !== undefined ? newEditingItem.isActive : true;
                    this.form.is_admin = newEditingItem.isAdmin !== undefined ? newEditingItem.isAdmin : false;
                    this.form.companies = newEditingItem.companies?.map(c => c.id) || [];
                    this.form.permissions = newEditingItem.permissions || [];
                    this.editingItemId = newEditingItem.id || null;
                } else {
                    if (oldEditingItem !== undefined) {
                        this.clearForm();
                    }
                }
                this.$nextTick(() => {
                    this.saveInitialState();
                });
            },
            deep: true,
            immediate: true
        }
    }
};
</script>

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
                    <label class="required">{{ $t('name') }}</label>
                    <input type="text" v-model="form.name" />
                </div>

                <div class="mb-4">
                    <label class="required">{{ $t('email') }}</label>
                    <input type="email" v-model="form.email" />
                </div>

                <div class="mb-4" v-if="!editingItem">
                    <label class="required">{{ $t('password') }}</label>
                    <input type="password" v-model="form.password" />
                </div>

                <div class="mb-4">
                    <label>{{ $t('position') }}</label>
                    <input type="text" v-model="form.position" />
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
                position: '',
                permissions: [],
            },
            editingItemId: null,
            allPermissions: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            currentTab: 'info',
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
    created() {
        // Делаем i18n доступным глобально для PermissionUtils
        if (typeof window !== 'undefined') {
            window.i18n = this.$i18n;
        }
    },
    mounted() {
        // Сохраняем начальное состояние после загрузки всех данных
        this.$nextTick(async () => {
            // Ждем загрузки всех необходимых данных
            await this.fetchPermissions();
            
            // Теперь сохраняем начальное состояние
            this.saveInitialState();
        });
    },
    methods: {
                // Переопределяем метод getFormState из миксина
        getFormState() {
            return {
                name: this.form.name,
                email: this.form.email,
                password: this.form.password,
                position: this.form.position,
                permissions: [...this.form.permissions]
            };
        },
        async fetchPermissions() {
            this.allPermissions = await UsersController.getAllPermissions();
        },
        clearForm() {
            this.form.name = '';
            this.form.email = '';
            this.form.password = '';
            this.form.position = '';
            this.form.permissions = [];
            this.editingItemId = null;
            this.resetFormChanges(); // Сбрасываем состояние изменений
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
            this.saveLoading = true;
            try {
                let savedUser;

                if (this.editingItemId) {
                    savedUser = await UsersController.updateItem(this.editingItemId, this.form);
                } else {
                    savedUser = await UsersController.storeItem(this.form);
                }

                // 🔁 Если обновлённый пользователь — текущий, обновим store
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
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.form.name = newEditingItem.name || '';
                    this.form.email = newEditingItem.email || '';
                    this.form.position = newEditingItem.position || '';
                    this.form.permissions = newEditingItem.permissions || [];
                    this.editingItemId = newEditingItem.id || null;
                } else {
                    this.clearForm();
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
};
</script>

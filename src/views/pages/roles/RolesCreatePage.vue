<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editRole') : $t('createRole') }}</h2>

        <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2 required">{{ $t('roleName') }}</label>
            <input type="text" v-model="form.name"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required />
        </div>

        <div class="mb-4">
            <label class="font-semibold mb-2 block">{{ $t('permissions') }}</label>

            <div class="mb-2">
                <label class="flex items-center space-x-2">
                    <input type="checkbox" v-model="selectAllChecked" @change="toggleSelectAll">
                    <span>{{ $t('selectAllPermissions') }}</span>
                </label>
            </div>

            <div v-if="resourcesPermissions" class="max-h-96 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50">
                <div v-for="(resource, resourceKey) in sortedResources" :key="resourceKey"
                    class="mb-4 border-b pb-3 last:border-b-0">
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-semibold text-sm">
                            {{ getResourceLabel(resourceKey) }}
                        </span>
                        <label class="flex items-center space-x-1 text-xs">
                            <input type="checkbox" :checked="isResourceAllChecked(resourceKey)"
                                @change="toggleResourceAll(resourceKey)" />
                            <span>{{ $t('all') }}</span>
                        </label>
                    </div>

                    <div class="grid grid-cols-1 gap-2 text-xs">
                        <!-- Create (без выбора all/own) -->
                        <div v-if="resource.create" class="flex items-center gap-2">
                            <input type="checkbox" :value="resource.create.name" v-model="form.permissions"
                                class="rounded border-gray-300" />
                            <i :class="[permissionIcon(resource.create.name), permissionColor(resource.create.name)]" />
                            <span>{{ $t('create') }}</span>
                        </div>

                        <!-- View: All / Own (или только All для ресурсов без user_id) -->
                        <div v-if="resource.view" class="flex items-center gap-3 pl-4">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" 
                                    :value="resource.view.all.name" 
                                    :checked="form.permissions.includes(resource.view.all.name)"
                                    @change="togglePermissionScope($event, resource.view.all.name, resource.view.own?.name)"
                                    class="rounded border-gray-300" />
                                <i :class="[permissionIcon(resource.view.all.name), permissionColor(resource.view.all.name)]" />
                                <span>{{ $t('viewAll') }}</span>
                            </label>
                            <label v-if="resource.view.own && hasResourceUserId(resourceKey)" 
                                class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" 
                                    :value="resource.view.own.name" 
                                    :checked="form.permissions.includes(resource.view.own.name)"
                                    @change="togglePermissionScope($event, resource.view.own.name, resource.view.all.name)"
                                    class="rounded border-gray-300" />
                                <i :class="[permissionIcon(resource.view.own.name), permissionColor(resource.view.own.name)]" />
                                <span>{{ $t('viewOwn') }}</span>
                            </label>
                        </div>

                        <!-- Update: All / Own (или только All для ресурсов без user_id) -->
                        <div v-if="resource.update" class="flex items-center gap-3 pl-4">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" 
                                    :value="resource.update.all.name" 
                                    :checked="form.permissions.includes(resource.update.all.name)"
                                    @change="togglePermissionScope($event, resource.update.all.name, resource.update.own?.name)"
                                    class="rounded border-gray-300" />
                                <i :class="[permissionIcon(resource.update.all.name), permissionColor(resource.update.all.name)]" />
                                <span>{{ $t('updateAll') }}</span>
                            </label>
                            <label v-if="resource.update.own && hasResourceUserId(resourceKey)" 
                                class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" 
                                    :value="resource.update.own.name" 
                                    :checked="form.permissions.includes(resource.update.own.name)"
                                    @change="togglePermissionScope($event, resource.update.own.name, resource.update.all.name)"
                                    class="rounded border-gray-300" />
                                <i :class="[permissionIcon(resource.update.own.name), permissionColor(resource.update.own.name)]" />
                                <span>{{ $t('updateOwn') }}</span>
                            </label>
                        </div>

                        <!-- Delete: All / Own (или только All для ресурсов без user_id) -->
                        <div v-if="resource.delete" class="flex items-center gap-3 pl-4">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" 
                                    :value="resource.delete.all.name" 
                                    :checked="form.permissions.includes(resource.delete.all.name)"
                                    @change="togglePermissionScope($event, resource.delete.all.name, resource.delete.own?.name)"
                                    class="rounded border-gray-300" />
                                <i :class="[permissionIcon(resource.delete.all.name), permissionColor(resource.delete.all.name)]" />
                                <span>{{ $t('deleteAll') }}</span>
                            </label>
                            <label v-if="resource.delete.own && hasResourceUserId(resourceKey)" 
                                class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" 
                                    :value="resource.delete.own.name" 
                                    :checked="form.permissions.includes(resource.delete.own.name)"
                                    @change="togglePermissionScope($event, resource.delete.own.name, resource.delete.all.name)"
                                    class="rounded border-gray-300" />
                                <i :class="[permissionIcon(resource.delete.own.name), permissionColor(resource.delete.own.name)]" />
                                <span>{{ $t('deleteOwn') }}</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-trash" :disabled="!$store.getters.hasPermission('roles_delete_all')">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('roles_update_all')) ||
            (editingItemId == null && !$store.getters.hasPermission('roles_create'))">
        </PrimaryButton>
    </div>

    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog" :descr="$t('confirmDelete')"
        :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose" :descr="$t('unsavedChanges')"
        :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import RolesController from '@/api/RolesController';
import UsersController from '@/api/UsersController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";

import {
    permissionIcon,
    permissionColor,
} from '@/utils/PermissionUtils';

export default {
    mixins: [getApiErrorMessage, formChangesMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { PrimaryButton, AlertDialog },
    props: {
        editingItem: { type: Object, required: false, default: null },
    },
    data() {
        return {
            form: {
                name: '',
                permissions: [],
            },
            editingItemId: null,
            allPermissions: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
        };
    },
    computed: {
        // Ресурсы, у которых нет поля user_id (только "Все")
        resourcesWithoutUserId() {
            return [
                'categories',
                'products',
                'companies',
                'warehouses',
                'cash_registers',
                'order_statuses',
                'order_statuscategories',
                'transaction_categories',
                'project_statuses',
                'currency_history',
                'roles',
                // Добавьте другие ресурсы без user_id по необходимости
            ];
        },
        resourcesPermissions() {
            const resources = {};
            const scopeActions = ['view', 'update', 'delete'];

            this.allPermissions.forEach((perm) => {
                // Пропускаем старые разрешения без _all/_own и кастомные
                if (perm.name.startsWith('settings_') || perm.name.includes('_edit_')) {
                    return;
                }

                const parts = perm.name.split('_');
                if (parts.length < 2) return;

                // Определяем ресурс и действие
                let resourceKey, action, scope;

                if (parts[parts.length - 1] === 'all' || parts[parts.length - 1] === 'own') {
                    scope = parts.pop();
                    action = parts.pop();
                    resourceKey = parts.join('_');
                } else if (parts[parts.length - 1] === 'create') {
                    action = 'create';
                    resourceKey = parts.slice(0, -1).join('_');
                } else {
                    // Старое разрешение без _all/_own - пропускаем
                    return;
                }

                if (!resources[resourceKey]) {
                    resources[resourceKey] = {};
                }

                // Если ресурс не имеет user_id, используем только _all
                const hasUserId = !this.resourcesWithoutUserId.includes(resourceKey);

                if (scopeActions.includes(action)) {
                    if (!resources[resourceKey][action]) {
                        resources[resourceKey][action] = {};
                    }
                    // Если ресурс не имеет user_id, показываем только _all
                    if (hasUserId || scope === 'all') {
                        resources[resourceKey][action][scope] = perm;
                    }
                } else if (action === 'create') {
                    resources[resourceKey][action] = perm;
                }
            });

            return resources;
        },
        sortedResources() {
            const sorted = {};
            Object.keys(this.resourcesPermissions)
                .sort()
                .forEach((key) => {
                    sorted[key] = this.resourcesPermissions[key];
                });
            return sorted;
        },
        selectAllChecked: {
            get() {
                return this.form.permissions.length === this.allPermissions.filter(p => 
                    !p.name.startsWith('settings_') && !p.name.includes('_edit_')
                ).length;
            },
            set() { }
        }
    },
    mounted() {
        if (typeof window !== 'undefined') {
            window.i18n = this.$i18n;
        }

        this.$nextTick(async () => {
            await this.fetchPermissions();

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
                permissions: [...this.form.permissions],
            };
        },
        async fetchPermissions() {
            const allPermissions = await UsersController.getAllPermissions();
            this.allPermissions = allPermissions.filter(permission =>
                !permission.name.startsWith('system_settings_')
            );
        },
        clearForm() {
            this.form.name = '';
            this.form.permissions = [];
            this.editingItemId = null;
            this.resetFormChanges();
        },
        hasResourceUserId(resourceKey) {
            return !this.resourcesWithoutUserId.includes(resourceKey);
        },
        togglePermissionScope(event, selectedPermission, oppositePermission) {
            const isChecked = event.target.checked;
            
            if (isChecked) {
                // При выборе: убираем противоположное разрешение (приоритет выбранного)
                if (oppositePermission && this.form.permissions.includes(oppositePermission)) {
                    this.form.permissions = this.form.permissions.filter(p => p !== oppositePermission);
                }
                // Добавляем выбранное разрешение, если его еще нет
                if (!this.form.permissions.includes(selectedPermission)) {
                    this.form.permissions.push(selectedPermission);
                }
            } else {
                // При снятии: просто убираем разрешение (можно снять оба)
                this.form.permissions = this.form.permissions.filter(p => p !== selectedPermission);
            }
        },
        getResourceLabel(resourceKey) {
            // Используем $t из Vue компонента (более надежно)
            if (this.$t) {
                try {
                    const translation = this.$t(resourceKey);
                    if (translation && translation !== resourceKey) {
                        return translation;
                    }
                } catch (e) {
                    // Игнорируем ошибки перевода
                }
            }
            // Fallback: используем window.i18n если доступен
            if (typeof window !== 'undefined' && window.i18n && window.i18n.global && window.i18n.global.t) {
                try {
                    const translation = window.i18n.global.t(resourceKey);
                    if (translation && translation !== resourceKey) {
                        return translation;
                    }
                } catch (e) {
                    // Игнорируем ошибки перевода
                }
            }
            // Последний fallback: форматируем ключ
            return resourceKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        },
        isResourceAllChecked(resourceKey) {
            const resource = this.resourcesPermissions[resourceKey];
            if (!resource) return false;

            const hasUserId = this.hasResourceUserId(resourceKey);
            const requiredPerms = [];
            
            // Create всегда требуется
            if (resource.create) {
                if (!this.form.permissions.includes(resource.create.name)) return false;
            }
            
            // Для view, update, delete проверяем, что выбрано хотя бы _all (приоритет)
            if (resource.view) {
                if (!this.form.permissions.includes(resource.view.all?.name) && 
                    !this.form.permissions.includes(resource.view.own?.name)) {
                    return false;
                }
            }
            if (resource.update) {
                if (!this.form.permissions.includes(resource.update.all?.name) && 
                    !this.form.permissions.includes(resource.update.own?.name)) {
                    return false;
                }
            }
            if (resource.delete) {
                if (!this.form.permissions.includes(resource.delete.all?.name) && 
                    !this.form.permissions.includes(resource.delete.own?.name)) {
                    return false;
                }
            }

            return true;
        },
        toggleResourceAll(resourceKey) {
            const resource = this.resourcesPermissions[resourceKey];
            if (!resource) return;

            const hasUserId = this.hasResourceUserId(resourceKey);
            const allPerms = [];
            const permPairs = [];
            
            // Собираем все разрешения ресурса
            if (resource.create) allPerms.push(resource.create.name);
            
            if (resource.view) {
                allPerms.push(resource.view.all?.name);
                if (hasUserId && resource.view.own) {
                    allPerms.push(resource.view.own?.name);
                    permPairs.push({ all: resource.view.all?.name, own: resource.view.own?.name });
                }
            }
            if (resource.update) {
                allPerms.push(resource.update.all?.name);
                if (hasUserId && resource.update.own) {
                    allPerms.push(resource.update.own?.name);
                    permPairs.push({ all: resource.update.all?.name, own: resource.update.own?.name });
                }
            }
            if (resource.delete) {
                allPerms.push(resource.delete.all?.name);
                if (hasUserId && resource.delete.own) {
                    allPerms.push(resource.delete.own?.name);
                    permPairs.push({ all: resource.delete.all?.name, own: resource.delete.own?.name });
                }
            }

            const allChecked = this.isResourceAllChecked(resourceKey);
            
            if (allChecked) {
                // Убираем все разрешения ресурса
                this.form.permissions = this.form.permissions.filter(
                    p => !allPerms.filter(Boolean).includes(p)
                );
            } else {
                // Убираем _own разрешения, если они были выбраны
                permPairs.forEach(pair => {
                    if (this.form.permissions.includes(pair.own)) {
                        this.form.permissions = this.form.permissions.filter(p => p !== pair.own);
                    }
                });
                
                // Добавляем все разрешения (только _all, без _own)
                const permsToAdd = [];
                if (resource.create) permsToAdd.push(resource.create.name);
                if (resource.view?.all) permsToAdd.push(resource.view.all.name);
                if (resource.update?.all) permsToAdd.push(resource.update.all.name);
                if (resource.delete?.all) permsToAdd.push(resource.delete.all.name);
                
                permsToAdd.filter(Boolean).forEach(perm => {
                    if (!this.form.permissions.includes(perm)) {
                        this.form.permissions.push(perm);
                    }
                });
            }
        },
        toggleSelectAll() {
            if (this.selectAllChecked) {
                this.form.permissions = [];
            } else {
                const allPerms = this.allPermissions
                    .filter(p => !p.name.startsWith('settings_') && !p.name.includes('_edit_'))
                    .map(p => p.name);
                this.form.permissions = allPerms;
            }
        },
        permissionIcon,
        permissionColor,
        async save() {
            this.saveLoading = true;
            try {
                let savedRole;
                
                // Нормализуем разрешения перед сохранением (приоритет _all над _own)
                let permissions = Array.isArray(this.form.permissions) ? this.form.permissions : this.form.permissions.split(',');
                permissions = this.normalizePermissions(permissions);

                if (this.editingItemId) {
                    const updateData = {
                        name: this.form.name,
                        permissions: permissions,
                    };

                    savedRole = await RolesController.updateItem(this.editingItemId, updateData);
                } else {
                    const createData = {
                        name: this.form.name,
                        permissions: permissions,
                    };

                    savedRole = await RolesController.storeItem(createData);
                }

                this.$emit('saved');
            } catch (e) {
                this.$emit('saved-error', this.getApiErrorMessage(e));
            }
            this.saveLoading = false;
        },
        async deleteItem() {
            this.closeDeleteDialog();
            if (!this.editingItemId) return;
            this.deleteLoading = true;
            try {
                await RolesController.deleteItem(this.editingItemId);
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
        normalizePermissions(permissions) {
            // Убираем _own разрешения, если есть соответствующие _all (приоритет _all)
            const normalized = [...permissions];
            const allPerms = permissions.filter(p => p.endsWith('_all'));
            const ownPerms = permissions.filter(p => p.endsWith('_own'));
            
            // Для каждого _own проверяем, есть ли соответствующий _all
            ownPerms.forEach(ownPerm => {
                const allPerm = ownPerm.replace('_own', '_all');
                if (normalized.includes(allPerm)) {
                    // Если есть _all, убираем _own
                    const index = normalized.indexOf(ownPerm);
                    if (index > -1) {
                        normalized.splice(index, 1);
                    }
                }
            });
            
            return normalized;
        },
    },
    watch: {
        editingItem: {
            handler(newEditingItem, oldEditingItem) {
                if (newEditingItem) {
                    this.form.name = newEditingItem.name || '';
                    let permissions = newEditingItem.permissions?.map(p => typeof p === 'string' ? p : p.name) || [];
                    
                    // Нормализуем разрешения: если есть оба _all и _own, оставляем только _all (приоритет)
                    permissions = this.normalizePermissions(permissions);
                    
                    this.form.permissions = permissions;
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

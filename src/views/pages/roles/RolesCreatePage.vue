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

            <div v-if="resourcesPermissions" class="border border-gray-300 rounded-md p-3 bg-gray-50">
                <div v-for="(group, groupKey) in groupedResources" :key="groupKey" class="mb-4 last:mb-0">
                    <div class="mb-2 pb-2 border-b border-gray-400">
                        <div class="flex items-center justify-between">
                            <button 
                                type="button"
                                @click="toggleGroup(groupKey)"
                                class="flex items-center gap-2 font-bold  text-gray-800 hover:text-blue-600 transition-colors"
                            >
                                <i :class="['fas', expandedGroups[groupKey] ? 'fa-chevron-down' : 'fa-chevron-right', 'text-xs']"></i>
                                <span>{{ getResourceLabel(group.label) }}</span>
                            </button>
                            <label class="flex items-center space-x-1 text-xs">
                                <input 
                                    type="checkbox" 
                                    :checked="isGroupAllChecked(group.resources)"
                                    @change="toggleGroupAll(group.resources)"
                                />
                                <span>{{ $t('all') }}</span>
                            </label>
                        </div>
                    </div>
                    
                    <div v-show="expandedGroups[groupKey]" class="ml-4 space-y-4">
                        <div v-for="(resource, resourceKey) in group.resources" :key="resourceKey"
                            class="pb-3 border-b border-gray-200 last:border-b-0">
                            <div class="flex items-center justify-between mb-2">
                                <span class="font-semibold text-sm text-gray-700">
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
                        <div v-if="resource.view && resource.view.all" class="flex items-center gap-3 pl-4">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" 
                                    :value="resource.view.all.name" 
                                    :checked="form.permissions.includes(resource.view.all.name)"
                                    @change="togglePermissionScope($event, resource.view.all.name, resource.view.own?.name)"
                                    class="rounded border-gray-300" />
                                <i :class="[permissionIcon(resource.view.all.name), permissionColor(resource.view.all.name)]" />
                                <span>{{ getPermissionLabel('view', resourceKey) }}</span>
                            </label>
                            <label v-if="resource.view.own && hasResourceUserId(resourceKey)" 
                                class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" 
                                    :value="resource.view.own.name" 
                                    :checked="form.permissions.includes(resource.view.own.name)"
                                    @change="togglePermissionScope($event, resource.view.own.name, resource.view.all?.name)"
                                    class="rounded border-gray-300" />
                                <i :class="[permissionIcon(resource.view.own.name), permissionColor(resource.view.own.name)]" />
                                <span>{{ $t('viewOwn') }}</span>
                            </label>
                        </div>

                        <!-- Update: All / Own (или только All для ресурсов без user_id) -->
                        <div v-if="resource.update && resource.update.all" class="flex items-center gap-3 pl-4">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" 
                                    :value="resource.update.all.name" 
                                    :checked="form.permissions.includes(resource.update.all.name)"
                                    @change="togglePermissionScope($event, resource.update.all.name, resource.update.own?.name)"
                                    class="rounded border-gray-300" />
                                <i :class="[permissionIcon(resource.update.all.name), permissionColor(resource.update.all.name)]" />
                                <span>{{ getPermissionLabel('update', resourceKey) }}</span>
                            </label>
                            <label v-if="resource.update.own && hasResourceUserId(resourceKey)" 
                                class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" 
                                    :value="resource.update.own.name" 
                                    :checked="form.permissions.includes(resource.update.own.name)"
                                    @change="togglePermissionScope($event, resource.update.own.name, resource.update.all?.name)"
                                    class="rounded border-gray-300" />
                                <i :class="[permissionIcon(resource.update.own.name), permissionColor(resource.update.own.name)]" />
                                <span>{{ $t('updateOwn') }}</span>
                            </label>
                        </div>

                        <!-- Delete: All / Own (или только All для ресурсов без user_id) -->
                        <div v-if="resource.delete && resource.delete.all" class="flex items-center gap-3 pl-4">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" 
                                    :value="resource.delete.all.name" 
                                    :checked="form.permissions.includes(resource.delete.all.name)"
                                    @change="togglePermissionScope($event, resource.delete.all.name, resource.delete.own?.name)"
                                    class="rounded border-gray-300" />
                                <i :class="[permissionIcon(resource.delete.all.name), permissionColor(resource.delete.all.name)]" />
                                <span>{{ getPermissionLabel('delete', resourceKey) }}</span>
                            </label>
                            <label v-if="resource.delete.own && hasResourceUserId(resourceKey)" 
                                class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" 
                                    :value="resource.delete.own.name" 
                                    :checked="form.permissions.includes(resource.delete.own.name)"
                                    @change="togglePermissionScope($event, resource.delete.own.name, resource.delete.all?.name)"
                                    class="rounded border-gray-300" />
                                <i :class="[permissionIcon(resource.delete.own.name), permissionColor(resource.delete.own.name)]" />
                                <span>{{ $t('deleteOwn') }}</span>
                            </label>
                        </div>
                        
                        <!-- Custom permissions для ресурса -->
                        <div v-if="resource.customPermissions && resource.customPermissions.length > 0" class="mt-3 pt-3 border-t border-gray-200">
                            <div class="grid grid-cols-1 gap-2 text-xs">
                                <div v-for="perm in resource.customPermissions" :key="perm.name" class="flex items-center gap-2">
                                    <input type="checkbox" :value="perm.name" v-model="form.permissions"
                                        class="rounded border-gray-300" />
                                    <i :class="[permissionIcon(perm.name), permissionColor(perm.name)]" />
                                    <span>{{ getCustomPermissionLabel(perm.name) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                        </div>
                    </div>
                    
                    <!-- Custom permissions для групп -->
                    <div v-if="(groupKey === 'projects' || groupKey === 'clients' || groupKey === 'finance') && groupedResources[groupKey] && groupedResources[groupKey].customPermissions && groupedResources[groupKey].customPermissions.length > 0" class="ml-4 mt-4 pt-4 border-t border-gray-200">
                        <div class="grid grid-cols-1 gap-2 text-xs">
                            <div v-for="perm in groupedResources[groupKey].customPermissions" :key="perm.name" class="flex items-center gap-2">
                                <input type="checkbox" :value="perm.name" v-model="form.permissions"
                                    class="rounded border-gray-300" />
                                <i :class="[permissionIcon(perm.name), permissionColor(perm.name)]" />
                                <span>{{ getCustomPermissionLabel(perm.name) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="customPermissions.length > 0" class="mt-4 pt-4 border-t">
                    <div class="font-semibold text-sm mb-2">{{ $t('customPermissions') || 'Дополнительные права' }}</div>
                    <div class="grid grid-cols-1 gap-2 text-xs">
                        <div v-for="perm in customPermissions" :key="perm.name" class="flex items-center gap-2">
                            <input type="checkbox" :value="perm.name" v-model="form.permissions"
                                class="rounded border-gray-300" />
                            <i :class="[permissionIcon(perm.name), permissionColor(perm.name)]" />
                            <span>{{ getCustomPermissionLabel(perm.name) }}</span>
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
    PermissionParser,
    PERMISSIONS_CONFIG,
} from '@/permissions';

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
            expandedGroups: {},
        };
    },
    computed: {
        resourcesWithoutUserId() {
            return Object.keys(PERMISSIONS_CONFIG.resources)
                .filter(key => !PERMISSIONS_CONFIG.resources[key].has_user_id);
        },
        resourcesWithManyToMany() {
            return Object.keys(PERMISSIONS_CONFIG.resources)
                .filter(key => PERMISSIONS_CONFIG.resources[key].check_strategy === 'many_to_many');
        },
        permissionGroups() {
            return PERMISSIONS_CONFIG.groups;
        },
        resourcesPermissions() {
            if (!Array.isArray(this.allPermissions)) {
                return {};
            }

            const parsed = PermissionParser.parsePermissions(
                this.allPermissions.filter(p => p && p.name && PermissionParser.isStandard(p.name))
            );

            const resources = {};
            const config = PERMISSIONS_CONFIG.resources;

            Object.keys(parsed.resources).forEach(resourceKey => {
                const resourceConfig = config[resourceKey];
                if (!resourceConfig) return;

                const resource = parsed.resources[resourceKey];
                const hasUserId = resourceConfig.has_user_id;
                const scopeActions = resourceConfig.scope_actions || [];

                resources[resourceKey] = {};

                Object.keys(resource).forEach(action => {
                    if (scopeActions.includes(action)) {
                        resources[resourceKey][action] = {};
                        if (resource[action].all) {
                            resources[resourceKey][action].all = resource[action].all;
                        }
                        if (hasUserId && resource[action].own) {
                            resources[resourceKey][action].own = resource[action].own;
                        }
                    } else if (action === 'create') {
                        resources[resourceKey][action] = resource[action];
                    }
                });

                if (resourceConfig.custom_permissions) {
                    const customPerms = [];
                    Object.values(resourceConfig.custom_permissions).forEach(permName => {
                        const perm = this.allPermissions.find(p => p && p.name === permName);
                        if (perm) {
                            customPerms.push(perm);
                        }
                    });
                    if (customPerms.length > 0) {
                        resources[resourceKey].customPermissions = customPerms;
                    }
                }
            });

            return resources;
        },
        groupedResources() {
            const groups = {};
            
            Object.keys(this.permissionGroups).forEach(groupKey => {
                const group = this.permissionGroups[groupKey];
                const groupResources = {};
                
                group.resources.forEach(resourceKey => {
                    if (this.resourcesPermissions[resourceKey]) {
                        groupResources[resourceKey] = this.resourcesPermissions[resourceKey];
                    }
                });
                
                const customPerms = [];
                const groupCustomPerms = PERMISSIONS_CONFIG.group_custom_permissions[groupKey] || [];
                groupCustomPerms.forEach(permName => {
                    const permission = this.allPermissions.find(p => p && p.name === permName);
                    if (permission) {
                        customPerms.push(permission);
                    }
                });
                
                if (Object.keys(groupResources).length > 0 || customPerms.length > 0) {
                    groups[groupKey] = {
                        label: group.label,
                        resources: groupResources,
                        customPermissions: customPerms
                    };
                }
            });
            
            const ungrouped = {};
            Object.keys(this.resourcesPermissions).forEach(resourceKey => {
                let isGrouped = false;
                Object.values(this.permissionGroups).forEach(group => {
                    if (group.resources.includes(resourceKey)) {
                        isGrouped = true;
                    }
                });
                if (!isGrouped) {
                    ungrouped[resourceKey] = this.resourcesPermissions[resourceKey];
                }
            });
            
            if (Object.keys(ungrouped).length > 0) {
                groups.other = {
                    label: 'other',
                    resources: ungrouped
                };
            }
            
            // Сортируем группы по алфавиту на основе переведенных названий
            const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
                const labelA = this.getResourceLabel(groups[a].label) || groups[a].label;
                const labelB = this.getResourceLabel(groups[b].label) || groups[b].label;
                return labelA.localeCompare(labelB, this.$i18n.locale || 'ru');
            });
            
            const sortedGroups = {};
            sortedGroupKeys.forEach(key => {
                sortedGroups[key] = groups[key];
            });
            
            return sortedGroups;
        },
        customPermissions() {
            const excluded = new Set();
            
            Object.values(PERMISSIONS_CONFIG.group_custom_permissions).forEach(perms => {
                perms.forEach(perm => excluded.add(perm));
            });
            
            Object.values(PERMISSIONS_CONFIG.resources).forEach(config => {
                if (config.custom_permissions) {
                    Object.values(config.custom_permissions).forEach(perm => excluded.add(perm));
                }
            });

            return this.allPermissions.filter(perm => 
                perm && perm.name && PermissionParser.isCustom(perm.name) && !excluded.has(perm.name)
            );
        },
        selectAllChecked: {
            get() {
                if (!Array.isArray(this.allPermissions) || this.allPermissions.length === 0) {
                    return false;
                }
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
            try {
                const allPermissions = await UsersController.getAllPermissions();
                this.allPermissions = Array.isArray(allPermissions) 
                    ? allPermissions.filter(permission => 
                        permission && permission.name && !permission.name.startsWith('system_settings_')
                    )
                    : [];
                console.log(this.allPermissions);
            } catch (error) {
                console.error('Ошибка при загрузке прав:', error);
                this.allPermissions = [];
            }
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
        isResourceManyToMany(resourceKey) {
            return this.resourcesWithManyToMany.includes(resourceKey);
        },
        getPermissionLabel(action, resourceKey) {
            const isManyToMany = this.isResourceManyToMany(resourceKey);
            
            if (isManyToMany) {
                const labels = {
                    'view': this.$t('viewAvailable') || 'Просмотр доступных пользователю',
                    'update': this.$t('updateAvailable') || 'Редактирование доступных пользователю',
                    'delete': this.$t('deleteAvailable') || 'Удаление доступных пользователю',
                };
                return labels[action] || action;
            } else {
                const labels = {
                    'view': this.$t('viewAll') || 'Просмотр всех',
                    'update': this.$t('updateAll') || 'Редактирование всех',
                    'delete': this.$t('deleteAll') || 'Удаление всех',
                };
                return labels[action] || action;
            }
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
        getTranslation(key) {
            if (this.$t) {
                try {
                    const translation = this.$t(key);
                    if (translation && translation !== key) {
                        return translation;
                    }
                } catch (e) {
                }
            }
            if (typeof window !== 'undefined' && window.i18n?.global?.t) {
                try {
                    const translation = window.i18n.global.t(key);
                    if (translation && translation !== key) {
                        return translation;
                    }
                } catch (e) {
                }
            }
            return null;
        },
        formatLabel(text) {
            return text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        },
        getResourceLabel(resourceKey) {
            return this.getTranslation(resourceKey) || this.formatLabel(resourceKey);
        },
        getCustomPermissionLabel(permissionName) {
            if (!permissionName) {
                return '';
            }

            const defaultLabels = {
                'settings_edit_any_date': 'Редактирование любой даты',
                'settings_project_budget_view': 'Просмотр бюджета проекта',
                'settings_project_balance_view': 'Просмотр баланса проекта',
                'settings_project_files_view': 'Просмотр файлов проекта',
                'settings_project_contracts_view': 'Просмотр контрактов проекта',
                'settings_currencies_view': 'Просмотр валют',
                'settings_cash_balance_view': 'Просмотр баланса кассы',
                'settings_client_balance_view': 'Просмотр баланса клиентов',
                'settings_client_balance_adjustment': 'Корректировка баланса клиента',
                'products_create_temp': 'Создание временного товара',
                'transactions_view_sale': 'Просмотр транзакций из продаж',
                'transactions_view_order': 'Просмотр транзакций из заказов',
                'transactions_view_receipt': 'Просмотр транзакций из оприходований',
                'transactions_view_salary': 'Просмотр зарплатных транзакций',
                'transactions_view_other': 'Просмотр остальных транзакций',
                'mutual_settlements_view_individual': 'Просмотр взаиморасчетов с физ. лицами',
                'mutual_settlements_view_company': 'Просмотр взаиморасчетов с компаниями',
                'mutual_settlements_view_employee': 'Просмотр взаиморасчетов с сотрудниками',
                'mutual_settlements_view_investor': 'Просмотр взаиморасчетов с инвесторами',
            };

            const translation = this.getTranslation(permissionName);
            if (translation) {
                return translation;
            }

            return defaultLabels[permissionName] || this.formatLabel(permissionName);
        },
        isResourceAllChecked(resourceKey) {
            const resource = this.resourcesPermissions[resourceKey];
            if (!resource) return false;
            
            if (resource.create && !this.form.permissions.includes(resource.create.name)) {
                return false;
            }
            
            const scopeActions = ['view', 'update', 'delete'];
            for (const action of scopeActions) {
                if (resource[action]) {
                    const allName = resource[action].all?.name;
                    const ownName = resource[action].own?.name;
                    if (!this.form.permissions.includes(allName) && 
                        !this.form.permissions.includes(ownName)) {
                        return false;
                    }
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
            const scopeActions = ['view', 'update', 'delete'];
            
            if (resource.create) {
                allPerms.push(resource.create.name);
            }
            
            for (const action of scopeActions) {
                if (resource[action]?.all) {
                    allPerms.push(resource[action].all.name);
                    if (hasUserId && resource[action].own) {
                        allPerms.push(resource[action].own.name);
                        permPairs.push({ 
                            all: resource[action].all.name, 
                            own: resource[action].own.name 
                        });
                    }
                }
            }

            const allChecked = this.isResourceAllChecked(resourceKey);
            
            if (allChecked) {
                this.form.permissions = this.form.permissions.filter(
                    p => !allPerms.filter(Boolean).includes(p)
                );
            } else {
                permPairs.forEach(pair => {
                    if (this.form.permissions.includes(pair.own)) {
                        this.form.permissions = this.form.permissions.filter(p => p !== pair.own);
                    }
                });
                
                const permsToAdd = [];
                if (resource.create) permsToAdd.push(resource.create.name);
                for (const action of scopeActions) {
                    if (resource[action]?.all) {
                        permsToAdd.push(resource[action].all.name);
                    }
                }
                
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
                this.form.permissions = this.allPermissions
                    .filter(p => p && p.name)
                    .map(p => p.name);
            }
        },
        toggleGroup(groupKey) {
            this.expandedGroups[groupKey] = !this.expandedGroups[groupKey];
        },
        isGroupAllChecked(groupResources) {
            const resourceKeys = Object.keys(groupResources);
            if (resourceKeys.length === 0) return false;
            
            return resourceKeys.every(resourceKey => this.isResourceAllChecked(resourceKey));
        },
        toggleGroupAll(groupResources) {
            const resourceKeys = Object.keys(groupResources);
            if (resourceKeys.length === 0) return;
            
            const allChecked = this.isGroupAllChecked(groupResources);
            
            if (allChecked) {
                resourceKeys.forEach(resourceKey => {
                    const resource = groupResources[resourceKey];
                    if (!resource) return;
                    
                    const hasUserId = this.hasResourceUserId(resourceKey);
                    const allPerms = [];
                    const permPairs = [];
                    const scopeActions = ['view', 'update', 'delete'];
                    
                    if (resource.create) {
                        allPerms.push(resource.create.name);
                    }
                    
                    for (const action of scopeActions) {
                        if (resource[action]?.all) {
                            allPerms.push(resource[action].all.name);
                            if (hasUserId && resource[action].own) {
                                allPerms.push(resource[action].own.name);
                                permPairs.push({ 
                                    all: resource[action].all.name, 
                                    own: resource[action].own.name 
                                });
                            }
                        }
                    }
                    
                    this.form.permissions = this.form.permissions.filter(
                        p => !allPerms.filter(Boolean).includes(p)
                    );
                });
            } else {
                resourceKeys.forEach(resourceKey => {
                    const resource = groupResources[resourceKey];
                    if (!resource) return;
                    
                    const hasUserId = this.hasResourceUserId(resourceKey);
                    const permPairs = [];
                    const scopeActions = ['view', 'update', 'delete'];
                    
                    for (const action of scopeActions) {
                        if (resource[action]?.all && hasUserId && resource[action].own) {
                            permPairs.push({ 
                                all: resource[action].all.name, 
                                own: resource[action].own.name 
                            });
                        }
                    }
                    
                    permPairs.forEach(pair => {
                        if (this.form.permissions.includes(pair.own)) {
                            this.form.permissions = this.form.permissions.filter(p => p !== pair.own);
                        }
                    });
                    
                    const permsToAdd = [];
                    if (resource.create) permsToAdd.push(resource.create.name);
                    for (const action of scopeActions) {
                        if (resource[action]?.all) {
                            permsToAdd.push(resource[action].all.name);
                        }
                    }
                    
                    permsToAdd.filter(Boolean).forEach(perm => {
                        if (!this.form.permissions.includes(perm)) {
                            this.form.permissions.push(perm);
                        }
                    });
                });
            }
        },
        permissionIcon,
        permissionColor,
        validateForm() {
            if (!this.form.name || !this.form.name.trim()) {
                return { valid: false, error: 'Название роли обязательно' };
            }
            return { valid: true };
        },
        validatePermissions(permissions) {
            if (!Array.isArray(permissions)) {
                return [];
            }
            const validPermissionNames = new Set(
                this.allPermissions
                    .filter(p => p && p.name)
                    .map(p => p.name)
            );
            return permissions.filter(perm => 
                typeof perm === 'string' && 
                perm.trim() && 
                validPermissionNames.has(perm)
            );
        },
        async save() {
            this.saveLoading = true;
            try {
                const validation = this.validateForm();
                if (!validation.valid) {
                    this.$emit('saved-error', validation.error);
                    this.saveLoading = false;
                    return;
                }

                let permissions = Array.isArray(this.form.permissions) 
                    ? this.form.permissions 
                    : this.form.permissions.split(',');
                
                permissions = this.validatePermissions(permissions);

                const data = {
                    name: this.form.name.trim(),
                    permissions: permissions,
                };

                if (this.editingItemId) {
                    await RolesController.updateItem(this.editingItemId, data);
                } else {
                    await RolesController.storeItem(data);
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
    },
    watch: {
        groupedResources: {
            handler(newGroups) {
                if (newGroups && Object.keys(newGroups).length > 0) {
                    Object.keys(newGroups).forEach(groupKey => {
                        if (!(groupKey in this.expandedGroups)) {
                            this.expandedGroups[groupKey] = true;
                        }
                    });
                }
            },
            immediate: true,
            deep: true
        },
        editingItem: {
            handler(newEditingItem, oldEditingItem) {
                if (newEditingItem) {
                    this.form.name = (newEditingItem.name || '').trim();
                    let permissions = Array.isArray(newEditingItem.permissions)
                        ? newEditingItem.permissions.map(p => typeof p === 'string' ? p : (p?.name || ''))
                        : [];
                    
                    permissions = this.validatePermissions(permissions);
                    
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

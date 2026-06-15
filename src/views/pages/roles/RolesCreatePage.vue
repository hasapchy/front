<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2 required">{{ $t('roleName') }}</label>
        <input v-model="form.name" type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--nav-accent)]"
          required>
      </div>

      <div class="mb-4">
        <label class="font-semibold mb-2 block">{{ $t('permissions') }}</label>

        <div
          v-if="resourcesPermissions"
          class="flex flex-col gap-3 rounded-lg border border-gray-300 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
          <div class="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div class="relative min-w-0 flex-1">
              <i
                class="fas fa-search pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
              <input
                v-model.trim="permissionSearchQuery"
                type="search"
                :placeholder="$t('permissionsSearchPlaceholder')"
                class="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-8 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--nav-accent)] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
              <button
                v-if="permissionSearchQuery"
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                :aria-label="$t('clear')"
                @click="permissionSearchQuery = ''">
                <i class="fas fa-times text-xs" />
              </button>
            </div>
            <div
              v-if="permissionGroupTabKeys.length"
              class="flex w-full min-w-0 flex-col gap-1 lg:w-56 lg:shrink-0">
              <label
                for="permission-group-filter"
                class="text-xs font-medium text-gray-600 dark:text-gray-400 lg:sr-only">
                {{ $t('permissionsGroupFilter') }}
              </label>
              <select
                id="permission-group-filter"
                v-model="activePermissionGroup"
                class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--nav-accent)] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
                <option
                  v-for="option in permissionGroupFilterOptions"
                  :key="option.value"
                  :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
            <label
              class="flex shrink-0 items-center gap-2 text-sm text-gray-700 dark:text-gray-300 lg:ml-auto">
              <input type="checkbox" :checked="selectAllChecked" @change="toggleSelectAll">
              <span>{{ $t('selectAllPermissions') }}</span>
            </label>
          </div>

          <p
            v-if="isPermissionSearchActive && !hasVisiblePermissionGroups"
            class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            {{ $t('noPermissionsMatch') }}
          </p>

          <div
            v-for="(group, groupKey) in displayedPermissionGroups"
            :key="groupKey"
            class="space-y-3">
            <div
              class="flex items-center gap-2 border-b border-gray-300 pb-2 dark:border-gray-600"
              :class="showPermissionGroupTitles ? 'justify-between' : 'justify-end'">
              <span
                v-if="showPermissionGroupTitles"
                class="text-sm font-bold text-gray-800 dark:text-gray-100"
                v-html="highlightPermissionText(getResourceLabel(group.label))" />
              <label class="flex shrink-0 items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                <input type="checkbox" :checked="isGroupAllChecked(group)" @change="toggleGroupAll(group)">
                <span>{{ $t('all') }}</span>
              </label>
            </div>

            <div class="grid gap-3 lg:grid-cols-2">
              <div
                v-for="(resource, resourceKey) in group.resources"
                :key="resourceKey"
                class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800/60">
                <div class="mb-2 flex items-center justify-between gap-2">
                  <span
                    class="text-sm font-semibold text-gray-800 dark:text-gray-100"
                    v-html="highlightPermissionText(getResourceLabel(resourceKey))" />
                  <label class="flex shrink-0 items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                    <input
                      type="checkbox"
                      :checked="isResourceAllChecked(resourceKey)"
                      @change="toggleResourceAll(resourceKey)">
                    <span>{{ $t('all') }}</span>
                  </label>
                </div>

                <div class="flex flex-col gap-2 text-xs text-gray-700 dark:text-gray-300">
                  <div v-if="resource.create" class="flex items-center gap-2">
                    <input
                      v-model="form.permissions"
                      type="checkbox"
                      :value="resource.create.name"
                      class="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800">
                    <i :class="[permissionIcon(resource.create.name), permissionColor(resource.create.name)]" />
                    <span v-html="highlightPermissionText($t('create'))" />
                  </div>

                  <div v-if="resource.export" class="flex items-center gap-2">
                    <input
                      v-model="form.permissions"
                      type="checkbox"
                      :value="resource.export.name"
                      class="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800">
                    <i :class="[permissionIcon(resource.export.name), permissionColor(resource.export.name)]" />
                    <span v-html="highlightPermissionText($t('export'))" />
                  </div>

                  <div v-if="resource.view && resource.view.all" class="flex flex-wrap items-center gap-x-4 gap-y-2 pl-1">
                    <label class="app-option-label">
                      <input type="checkbox" :value="resource.view.all.name"
                        :checked="form.permissions.includes(resource.view.all.name)"
                        class="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                        @change="togglePermissionScope($event, resource.view.all.name, resource.view.own?.name)">
                      <i :class="[permissionIcon(resource.view.all.name), permissionColor(resource.view.all.name)]" />
                      <span v-html="highlightPermissionText(getPermissionLabel('view', resourceKey))" />
                    </label>
                    <label v-if="resource.view.own && hasResourceUserId(resourceKey)"
                      class="app-option-label">
                      <input type="checkbox" :value="resource.view.own.name"
                        :checked="form.permissions.includes(resource.view.own.name)"
                        class="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                        @change="togglePermissionScope($event, resource.view.own.name, resource.view.all?.name)">
                      <i :class="[permissionIcon(resource.view.own.name), permissionColor(resource.view.own.name)]" />
                      <span v-html="highlightPermissionText($t('viewOwn'))" />
                    </label>
                  </div>

                  <div v-if="resource.update && resource.update.all" class="flex flex-wrap items-center gap-x-4 gap-y-2 pl-1">
                    <label class="app-option-label">
                      <input type="checkbox" :value="resource.update.all.name"
                        :checked="form.permissions.includes(resource.update.all.name)"
                        class="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                        @change="togglePermissionScope($event, resource.update.all.name, resource.update.own?.name)">
                      <i
                        :class="[permissionIcon(resource.update.all.name), permissionColor(resource.update.all.name)]" />
                      <span v-html="highlightPermissionText(getPermissionLabel('update', resourceKey))" />
                    </label>
                    <label v-if="resource.update.own && hasResourceUserId(resourceKey)"
                      class="app-option-label">
                      <input type="checkbox" :value="resource.update.own.name"
                        :checked="form.permissions.includes(resource.update.own.name)"
                        class="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                        @change="togglePermissionScope($event, resource.update.own.name, resource.update.all?.name)">
                      <i
                        :class="[permissionIcon(resource.update.own.name), permissionColor(resource.update.own.name)]" />
                      <span v-html="highlightPermissionText($t('updateOwn'))" />
                    </label>
                  </div>

                  <div v-if="resource.delete && resource.delete.all" class="flex flex-wrap items-center gap-x-4 gap-y-2 pl-1">
                    <label class="app-option-label">
                      <input type="checkbox" :value="resource.delete.all.name"
                        :checked="form.permissions.includes(resource.delete.all.name)"
                        class="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                        @change="togglePermissionScope($event, resource.delete.all.name, resource.delete.own?.name)">
                      <i
                        :class="[permissionIcon(resource.delete.all.name), permissionColor(resource.delete.all.name)]" />
                      <span v-html="highlightPermissionText(getPermissionLabel('delete', resourceKey))" />
                    </label>
                    <label v-if="resource.delete.own && hasResourceUserId(resourceKey)"
                      class="app-option-label">
                      <input type="checkbox" :value="resource.delete.own.name"
                        :checked="form.permissions.includes(resource.delete.own.name)"
                        class="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                        @change="togglePermissionScope($event, resource.delete.own.name, resource.delete.all?.name)">
                      <i
                        :class="[permissionIcon(resource.delete.own.name), permissionColor(resource.delete.own.name)]" />
                      <span v-html="highlightPermissionText($t('deleteOwn'))" />
                    </label>
                  </div>

                  <div
                    v-if="resource.customPermissions?.length"
                    class="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                    <div class="grid grid-cols-1 gap-2 text-xs text-gray-700 dark:text-gray-300">
                      <div v-for="perm in resource.customPermissions" :key="perm.name" class="flex items-center gap-2">
                        <input
                          v-model="form.permissions"
                          type="checkbox"
                          :value="perm.name"
                          class="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800">
                        <i :class="[permissionIcon(perm.name), permissionColor(perm.name)]" />
                        <span v-html="highlightPermissionText(getCustomPermissionLabel(perm.name))" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="group.customPermissions?.length || (groupKey === 'clients' && hasClientBalanceViewPermission)"
              class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800/60">
              <div class="grid grid-cols-1 gap-2 text-xs text-gray-700 dark:text-gray-300 lg:grid-cols-2">
                  <div
                    v-for="perm in group.customPermissions"
                    :key="perm.name"
                    class="flex items-center gap-2"
                  >
                    <input
                      v-model="form.permissions"
                      type="checkbox"
                      :value="perm.name"
                      class="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800">
                    <i :class="[permissionIcon(perm.name), permissionColor(perm.name)]" />
                    <span v-html="highlightPermissionText(getCustomPermissionLabel(perm.name))" />
                  </div>
                  <div
                    v-if="groupKey === 'clients' && hasClientBalanceViewPermission"
                    class="ml-4 space-y-2 border-l border-gray-300 pl-3 dark:border-gray-600"
                  >
                    <label class="app-option-label">
                      <input
                        type="checkbox"
                        :checked="hasClientBalanceViewCashPermission"
                        class="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                        @change="toggleClientBalanceTypePermission('settings_client_balance_view_cash', $event.target.checked)"
                      >
                      <span v-html="highlightPermissionText(getCustomPermissionLabel('settings_client_balance_view_cash'))" />
                    </label>
                    <label class="app-option-label">
                      <input
                        type="checkbox"
                        :checked="hasClientBalanceViewNonCashPermission"
                        class="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                        @change="toggleClientBalanceTypePermission('settings_client_balance_view_non_cash', $event.target.checked)"
                      >
                      <span v-html="highlightPermissionText(getCustomPermissionLabel('settings_client_balance_view_non_cash'))" />
                    </label>
                  </div>
                </div>
              </div>
          </div>

          <div
            v-if="filteredCustomPermissions?.length"
            class="mt-1 border-t border-gray-300 pt-4 dark:border-gray-600">
            <div
              class="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100"
              v-html="highlightPermissionText($t('customPermissions'))" />
            <div class="grid grid-cols-1 gap-2 text-xs text-gray-700 dark:text-gray-300 lg:grid-cols-2">
              <div v-for="perm in filteredCustomPermissions" :key="perm.name" class="flex items-center gap-2">
                <input
                  v-model="form.permissions"
                  type="checkbox"
                  :value="perm.name"
                  class="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800">
                <i :class="[permissionIcon(perm.name), permissionColor(perm.name)]" />
                <span v-html="highlightPermissionText(getCustomPermissionLabel(perm.name))" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
          :is-loading="deleteLoading" icon="fas fa-trash"
          :disabled="!$store.getters.hasPermission('roles_delete_all')" />
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('roles_update_all')) ||
          (editingItemId == null && !$store.getters.hasPermission('roles_create'))" :aria-label="$t('save')" />
      </div>
    </teleport>
  </div>

  <AlertDialog :dialog="deleteDialog" :descr="$t('confirmDelete')" :confirm-text="$t('delete')"
    :leave-text="$t('cancel')" @confirm="deleteItem" @leave="closeDeleteDialog" />
  <AlertDialog :dialog="closeConfirmDialog" :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')"
    :leave-text="$t('stay')" @confirm="confirmClose" @leave="cancelClose" />
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import RolesController from '@/api/RolesController';
import UsersController from '@/api/UsersController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from "@/mixins/crudFormMixin";
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';

import {
  permissionIcon,
  permissionColor,
  PermissionParser,
  PERMISSIONS_CONFIG,
} from '@/permissions';
import {
  CLIENT_BALANCE_VIEW_PERM,
  CLIENT_BALANCE_VIEW_CASH_PERM,
  CLIENT_BALANCE_VIEW_NON_CASH_PERM,
  CLIENT_BALANCE_TYPE_PERMS,
} from '@/permissions/clientBalanceView';
import { highlightMatches } from '@/utils/searchUtils';

export default {
  components: { PrimaryButton, AlertDialog },
  mixins: [getApiErrorMessage, crudFormMixin, sideModalFooterPortal],
  props: {
    editingItem: { type: Object, required: false, default: null },
  },
  emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
  data() {
    return {
      form: {
        name: '',
        permissions: [],
      },
      allPermissions: [],
      permissionSearchQuery: '',
      activePermissionGroup: 'all',
    };
  },
  computed: {
    hasClientBalanceViewPermission() {
      return this.form.permissions.includes(CLIENT_BALANCE_VIEW_PERM);
    },
    hasClientBalanceViewCashPermission() {
      return this.form.permissions.includes(CLIENT_BALANCE_VIEW_CASH_PERM);
    },
    hasClientBalanceViewNonCashPermission() {
      return this.form.permissions.includes(CLIENT_BALANCE_VIEW_NON_CASH_PERM);
    },
    resourcesWithoutUserId() {
      return Object.keys(PERMISSIONS_CONFIG.resources)
        .filter(key => !PERMISSIONS_CONFIG.resources[key].has_creator_id);
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
        const hasUserId = resourceConfig.has_creator_id;
        const isManyToMany = resourceConfig.check_strategy === 'many_to_many';
        const scopeActions = resourceConfig.scope_actions || [];
        const allowedActions = resourceConfig.actions || [];

        resources[resourceKey] = {};

        Object.keys(resource).forEach(action => {
          if (scopeActions.includes(action)) {
            if (!allowedActions.includes(action)) {
              return;
            }
            resources[resourceKey][action] = {};
            if (resource[action].all) {
              resources[resourceKey][action].all = resource[action].all;
            }
            if ((hasUserId || isManyToMany) && resource[action].own) {
              resources[resourceKey][action].own = resource[action].own;
            }
          } else if (action === 'view' && resource[action]?.name && !resource[action].all && !resource[action].own) {
            resources[resourceKey].view = { all: resource[action] };
          } else if (action === 'create' && allowedActions.includes('create')) {
            resources[resourceKey][action] = resource[action];
          } else if (action === 'export' && allowedActions.includes('export')) {
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
          if (customPerms?.length) {
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
          if (CLIENT_BALANCE_TYPE_PERMS.includes(permName)) {
            return;
          }
          const permission = this.allPermissions.find(p => p && p.name === permName);
          if (permission) {
            customPerms.push(permission);
          }
        });

        if (Object.keys(groupResources).length || customPerms?.length) {
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

      if (Object.keys(ungrouped).length) {
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
    selectAllChecked() {
      if (!Array.isArray(this.allPermissions) || !this.allPermissions?.length) {
        return false;
      }
      return this.form.permissions.length === this.allPermissions.length;
    },
    isPermissionSearchActive() {
      return Boolean(this.permissionSearchQuery?.trim());
    },
    permissionGroupTabKeys() {
      return Object.keys(this.groupedResources);
    },
    permissionGroupFilterOptions() {
      const options = [
        {
          value: 'all',
          label: `${this.$t('all')} (${this.allGroupsSelectedCount}/${this.allGroupsTotalCount})`,
        },
      ];

      this.permissionGroupTabKeys.forEach((groupKey) => {
        const group = this.groupedResources[groupKey];
        if (!group) {
          return;
        }

        options.push({
          value: groupKey,
          label: `${this.getResourceLabel(group.label)} (${this.getGroupSelectedCount(groupKey)}/${this.getGroupTotalCount(groupKey)})`,
        });
      });

      return options;
    },
    filteredGroupedResources() {
      const query = this.permissionSearchQuery.trim().toLowerCase();
      if (!query) {
        return this.groupedResources;
      }

      const result = {};

      Object.entries(this.groupedResources).forEach(([groupKey, group]) => {
        const filteredResources = {};
        Object.entries(group.resources || {}).forEach(([resourceKey, resource]) => {
          if (this.resourceMatchesSearch(groupKey, resourceKey, resource, query)) {
            filteredResources[resourceKey] = resource;
          }
        });

        const groupLabel = this.getResourceLabel(group.label);
        const groupMatches = this.textMatchesSearch(groupLabel, query);
        const customPerms = (group.customPermissions || []).filter((perm) =>
          this.textMatchesSearch(this.getCustomPermissionLabel(perm.name), query)
        );

        if (Object.keys(filteredResources).length || customPerms.length || groupMatches) {
          result[groupKey] = {
            ...group,
            resources: groupMatches && !Object.keys(filteredResources).length
              ? group.resources
              : filteredResources,
            customPermissions: customPerms.length
              ? customPerms
              : (groupMatches ? group.customPermissions : []),
          };
        }
      });

      return result;
    },
    showPermissionGroupTitles() {
      return this.isPermissionSearchActive || this.activePermissionGroup === 'all';
    },
    allGroupsSelectedCount() {
      return this.permissionGroupTabKeys.reduce(
        (sum, groupKey) => sum + this.getGroupSelectedCount(groupKey),
        0
      );
    },
    allGroupsTotalCount() {
      return this.permissionGroupTabKeys.reduce(
        (sum, groupKey) => sum + this.getGroupTotalCount(groupKey),
        0
      );
    },
    displayedPermissionGroups() {
      const groups = this.filteredGroupedResources;
      const keys = Object.keys(groups);

      if (!keys.length) {
        return {};
      }

      if (this.activePermissionGroup === 'all') {
        return groups;
      }

      const activeKey = keys.includes(this.activePermissionGroup)
        ? this.activePermissionGroup
        : 'all';

      if (activeKey === 'all') {
        return groups;
      }

      if (!groups[activeKey]) {
        return groups;
      }

      return { [activeKey]: groups[activeKey] };
    },
    hasVisiblePermissionGroups() {
      return Object.keys(this.displayedPermissionGroups).length > 0;
    },
    filteredCustomPermissions() {
      if (!this.customPermissions?.length) {
        return [];
      }

      const query = this.permissionSearchQuery.trim().toLowerCase();
      if (!query) {
        return this.customPermissions;
      }

      return this.customPermissions.filter((perm) =>
        this.textMatchesSearch(this.getCustomPermissionLabel(perm.name), query)
      );
    },
  },
  watch: {
    permissionGroupTabKeys: {
      handler(keys) {
        if (!keys?.length) {
          this.activePermissionGroup = 'all';
          return;
        }
        if (
          this.activePermissionGroup !== 'all' &&
          !keys.includes(this.activePermissionGroup)
        ) {
          this.activePermissionGroup = 'all';
        }
      },
      immediate: true,
    },
    'form.permissions': {
      handler() {
        this.syncClientBalanceTypePermissions();
      },
      deep: true,
    },
  },
  mounted() {
    if (globalThis.window) {
      globalThis.window.i18n = this.$i18n;
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
    syncClientBalanceTypePermissions() {
      const perms = [...this.form.permissions];
      const hasView = perms.includes(CLIENT_BALANCE_VIEW_PERM);

      if (!hasView) {
        const filtered = perms.filter((name) => !CLIENT_BALANCE_TYPE_PERMS.includes(name));
        if (filtered.length !== perms.length) {
          this.form.permissions = filtered;
        }

        return;
      }

      const hasCash = perms.includes(CLIENT_BALANCE_VIEW_CASH_PERM);
      const hasNonCash = perms.includes(CLIENT_BALANCE_VIEW_NON_CASH_PERM);

      if (!hasCash && !hasNonCash) {
        this.form.permissions = [
          ...perms,
          CLIENT_BALANCE_VIEW_CASH_PERM,
          CLIENT_BALANCE_VIEW_NON_CASH_PERM,
        ];
      }
    },
    toggleClientBalanceTypePermission(permName, checked) {
      if (!this.hasClientBalanceViewPermission) {
        return;
      }

      const hasCash = this.form.permissions.includes(CLIENT_BALANCE_VIEW_CASH_PERM);
      const hasNonCash = this.form.permissions.includes(CLIENT_BALANCE_VIEW_NON_CASH_PERM);

      if (!checked) {
        const isCash = permName === CLIENT_BALANCE_VIEW_CASH_PERM;
        const otherActive = isCash ? hasNonCash : hasCash;
        if (!otherActive) {
          return;
        }
        this.form.permissions = this.form.permissions.filter((name) => name !== permName);

        return;
      }

      if (!this.form.permissions.includes(permName)) {
        this.form.permissions = [...this.form.permissions, permName];
      }
    },
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
            permission
            && permission.name
            && !permission.name.startsWith('system_settings_')
            && !(PERMISSIONS_CONFIG.removed_permissions || []).includes(permission.name)
          )
          : [];
      } catch (error) {
        console.error('Ошибка при загрузке прав:', error);
        this.allPermissions = [];
      }
    },
    clearForm() {
      this.form.name = '';
      this.form.permissions = [];
      this.resetFormChanges();
    },
    async onEditingItemChanged(newEditingItem) {
      if (!newEditingItem) {
        return;
      }
      await this.fetchPermissions();
      this.form.name = String(newEditingItem.name ?? '').trim();
      let permissions = Array.isArray(newEditingItem.permissions)
        ? newEditingItem.permissions.map(p => p?.name || p)
        : [];
      this.form.permissions = this.validatePermissions(permissions);
    },
    hasResourceUserId(resourceKey) {
      return !this.resourcesWithoutUserId.includes(resourceKey);
    },
    isResourceManyToMany(resourceKey) {
      return this.resourcesWithManyToMany.includes(resourceKey);
    },
    getPermissionLabel(action, resourceKey) {
      if (resourceKey === 'client_balances' && action === 'view') {
        return this.$t('clientBalancesTabView');
      }

      const isManyToMany = this.isResourceManyToMany(resourceKey);

      if (isManyToMany) {
        const labels = {
          'view': this.$t('viewAvailable'),
          'update': this.$t('updateAvailable'),
          'delete': this.$t('deleteAvailable')
        };
        return labels[action] || action;
      } else {
        const labels = {
          'view': this.$t('viewAll'),
          'update': this.$t('updateAll'),
          'delete': this.$t('deleteAll')
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
        const translation = this.$t(key);
        if (translation && translation !== key) {
          return translation;
        }
      }
      const globalT = globalThis.window?.i18n?.global?.t;
      if (globalT) {
        const translation = globalT(key);
        if (translation && translation !== key) {
          return translation;
        }
      }
      return null;
    },
    formatLabel(text) {
      return text.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    },
    getResourceLabel(resourceKey) {
      const translation = this.getTranslation(resourceKey);
      if (translation) {
        return translation;
      }

      const camelKey = String(resourceKey).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      const camelTranslation = this.getTranslation(camelKey);
      if (camelTranslation) {
        return camelTranslation;
      }

      return this.formatLabel(resourceKey);
    },
    textMatchesSearch(text, query) {
      return String(text || '').toLowerCase().includes(query);
    },
    highlightPermissionText(text) {
      const value = String(text ?? '');
      const query = this.permissionSearchQuery?.trim();

      if (!query) {
        return value;
      }

      return highlightMatches(value, query);
    },
    resourceMatchesSearch(groupKey, resourceKey, resource, query) {
      if (this.textMatchesSearch(this.getResourceLabel(resourceKey), query)) {
        return true;
      }

      const actionLabels = {
        create: this.$t('create'),
        export: this.$t('export'),
        view: this.getPermissionLabel('view', resourceKey),
        update: this.getPermissionLabel('update', resourceKey),
        delete: this.getPermissionLabel('delete', resourceKey),
      };

      for (const [action, label] of Object.entries(actionLabels)) {
        if (resource[action] && this.textMatchesSearch(label, query)) {
          return true;
        }
      }

      if (this.textMatchesSearch(this.$t('viewOwn'), query) && resource.view?.own) {
        return true;
      }
      if (this.textMatchesSearch(this.$t('updateOwn'), query) && resource.update?.own) {
        return true;
      }
      if (this.textMatchesSearch(this.$t('deleteOwn'), query) && resource.delete?.own) {
        return true;
      }

      if (resource.customPermissions?.some((perm) =>
        this.textMatchesSearch(this.getCustomPermissionLabel(perm.name), query)
      )) {
        return true;
      }

      if (groupKey === 'clients' && this.textMatchesSearch(this.getResourceLabel('clients'), query)) {
        return resourceKey === 'clients';
      }

      return false;
    },
    collectResourcePermissionNames(resourceKey) {
      const resource = this.resourcesPermissions[resourceKey];
      if (!resource) {
        return [];
      }

      const names = [];
      const hasUserId = this.hasResourceUserId(resourceKey);
      const scopeActions = ['view', 'update', 'delete'];

      if (resource.create?.name) {
        names.push(resource.create.name);
      }
      if (resource.export?.name) {
        names.push(resource.export.name);
      }
      if (resource.view?.all?.name && !resource.view?.own) {
        names.push(resource.view.all.name);
      }

      for (const action of scopeActions) {
        if (resource[action]?.all?.name) {
          names.push(resource[action].all.name);
        }
        if (hasUserId && resource[action]?.own?.name) {
          names.push(resource[action].own.name);
        }
      }

      if (resource.customPermissions?.length) {
        resource.customPermissions.forEach((perm) => names.push(perm.name));
      }

      return names.filter(Boolean);
    },
    collectGroupPermissionNames(groupKey) {
      const group = this.groupedResources[groupKey];
      if (!group) {
        return [];
      }

      const names = [];
      Object.keys(group.resources || {}).forEach((resourceKey) => {
        names.push(...this.collectResourcePermissionNames(resourceKey));
      });

      (group.customPermissions || []).forEach((perm) => names.push(perm.name));

      if (groupKey === 'clients' && this.hasClientBalanceViewPermission) {
        names.push(CLIENT_BALANCE_VIEW_CASH_PERM, CLIENT_BALANCE_VIEW_NON_CASH_PERM);
      }

      return [...new Set(names.filter(Boolean))];
    },
    getGroupTotalCount(groupKey) {
      return this.collectGroupPermissionNames(groupKey).length;
    },
    getGroupSelectedCount(groupKey) {
      const names = this.collectGroupPermissionNames(groupKey);
      return names.filter((name) => this.form.permissions.includes(name)).length;
    },
    getCustomPermissionLabel(permissionName) {
      if (!permissionName) {
        return '';
      }

      const defaultLabels = {
        'settings_edit_any_date': 'Редактирование любой даты',
        'settings_project_budget_view': 'Просмотр бюджета проекта',
        'settings_project_balance_view': 'Просмотр баланса проекта',
        'settings_currencies_view': 'Просмотр валют',
        'settings_cash_balance_view': 'Просмотр баланса кассы',
        'settings_client_balance_view': 'Просмотр баланса клиентов',
        'settings_client_balance_view_own': 'Просмотр своего баланса',
        'settings_client_balance_view_cash': 'Просмотр наличного баланса клиентов',
        'settings_client_balance_view_non_cash': 'Просмотр безналичного баланса клиентов',
        'settings_client_balance_adjustment': 'Корректировка баланса клиента',
        'settings_transaction_category_bindings_view': 'Просмотр привязок категорий транзакций компании',
        'settings_transaction_category_bindings_edit': 'Редактирование привязок категорий транзакций компании',
        'products_create_temp': 'Создание временного товара',
        'transactions_view_sale': 'Просмотр транзакций из продаж',
        'transactions_view_order': 'Просмотр транзакций из заказов',
        'transactions_view_receipt': 'Просмотр транзакций из оприходований',
        'transactions_view_purchase': 'Просмотр транзакций из закупок',
        'transactions_view_salary': 'Просмотр зарплатных транзакций',
        'transactions_view_other': 'Просмотр остальных транзакций',
        'mutual_settlements_view_individual': 'Просмотр взаиморасчетов с физ. лицами',
        'mutual_settlements_view_company': 'Просмотр взаиморасчетов с компаниями',
        'mutual_settlements_view_employee': 'Просмотр взаиморасчетов с сотрудниками',
        'mutual_settlements_view_investor': 'Просмотр взаиморасчетов с инвесторами',
        'employee_salaries_accrue': 'Начисление зарплат',
        'chats_write': 'Написание в чатах',
        'chats_write_general': 'Написание в общем чате',
        'chats_group_create': 'Создание групповых чатов',
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
      if (resource.export && !this.form.permissions.includes(resource.export.name)) {
        return false;
      }

      if (resource.view?.all && !resource.view?.own && !this.form.permissions.includes(resource.view.all.name)) {
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

      if (resource.customPermissions?.length) {
        for (const perm of resource.customPermissions) {
          if (!this.form.permissions.includes(perm.name)) {
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
      if (resource.export) {
        allPerms.push(resource.export.name);
      }

      if (resource.view?.all && !resource.view?.own) {
        allPerms.push(resource.view.all.name);
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

      if (resource.customPermissions?.length) {
        resource.customPermissions.forEach((perm) => allPerms.push(perm.name));
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
        if (resource.export) permsToAdd.push(resource.export.name);
        if (resource.view?.all && !resource.view?.own) {
          permsToAdd.push(resource.view.all.name);
        }
        for (const action of scopeActions) {
          if (resource[action]?.all) {
            permsToAdd.push(resource[action].all.name);
          }
        }

        if (resource.customPermissions?.length) {
          resource.customPermissions.forEach((perm) => permsToAdd.push(perm.name));
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
    isGroupAllChecked(group) {
      const groupResources = group?.resources ?? {};
      const resourceKeys = Object.keys(groupResources);
      const customPerms = group?.customPermissions ?? [];

      if (resourceKeys.length && !resourceKeys.every(resourceKey => this.isResourceAllChecked(resourceKey))) {
        return false;
      }

      if (!customPerms.length) {
        return resourceKeys.length > 0;
      }

      return customPerms.every(perm => this.form.permissions.includes(perm.name));
    },
    toggleGroupAll(group) {
      const groupResources = group?.resources ?? {};
      const resourceKeys = Object.keys(groupResources);
      const customPerms = (group?.customPermissions ?? []).map(perm => perm.name);

      if (resourceKeys.length === 0 && customPerms.length === 0) {
        return;
      }

      const allChecked = this.isGroupAllChecked(group);

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

        if (customPerms.length) {
          this.form.permissions = this.form.permissions.filter(p => !customPerms.includes(p));
        }
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
          if (resource.export) permsToAdd.push(resource.export.name);
          if (resource.view?.all && !resource.view?.own) {
            permsToAdd.push(resource.view.all.name);
          }
          for (const action of scopeActions) {
            if (resource[action]?.all) {
              permsToAdd.push(resource[action].all.name);
            }
          }
          if (resource.customPermissions?.length) {
            resource.customPermissions.forEach((perm) => permsToAdd.push(perm.name));
          }

          permsToAdd.filter(Boolean).forEach(perm => {
            if (!this.form.permissions.includes(perm)) {
              this.form.permissions.push(perm);
            }
          });
        });

        customPerms.forEach(perm => {
          if (!this.form.permissions.includes(perm)) {
            this.form.permissions.push(perm);
          }
        });
      }
    },
    permissionIcon,
    permissionColor,
    getValidationFields() {
      return [
        {
          key: 'name',
          value: this.form.name,
          message: this.$t('roleNameRequired'),
        },
      ];
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
        perm?.trim?.() &&
        validPermissionNames.has(perm)
      );
    },
    async save() {
      return crudFormMixin.methods.save.call(this);
    },
    prepareSave() {
      this.syncClientBalanceTypePermissions();
      const raw = this.form.permissions;
      const permissions = this.validatePermissions(Array.isArray(raw) ? raw : []);

      return {
        name: this.form.name.trim(),
        permissions: permissions,
      };
    },
    async performSave(data) {
      if (this.editingItemId) {
        return await RolesController.updateItem(this.editingItemId, data);
      } else {
        return await RolesController.storeItem(data);
      }
    },
    onSaveSuccess() {
    },
    onSaveError() {
    },
    async performDelete() {
      return await RolesController.deleteItem(this.editingItemId);
    },
    onDeleteSuccess() {
    },
    onDeleteError() {
    },
  }
};
</script>

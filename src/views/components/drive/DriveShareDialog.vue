<template>
  <CenteredModalDialog
    :show-form="visible"
    :title="$t('shareAccess')"
    :onclose="handleClose"
    panel-class="max-w-lg"
  >
    <div
      v-if="resourceName"
      class="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-muted)] dark:text-[var(--text-secondary)]"
    >
      <i
        v-if="resourceType === 'folder'"
        :class="[folderIconClass(resourceItem), 'shrink-0 text-lg']"
        :style="folderIconStyle(resourceItem)"
      />
      <i
        v-else
        :class="[fileIconClassForResource, 'shrink-0 text-lg']"
      />
      <span class="min-w-0 truncate font-medium">{{ resourceName }}</span>
    </div>
    <div class="space-y-4">
      <div v-if="resourceId">
        <label>{{ $t('driveExistingPermissions') }}</label>
        <div class="mt-1.5 max-h-32 overflow-y-auto rounded-lg border border-gray-200 dark:border-[var(--border-subtle)]">
          <div v-if="permissionsLoading" class="px-3 py-2 text-sm text-gray-500 dark:text-[var(--text-secondary)]">
            {{ $t('loading') }}
          </div>
          <ul v-else-if="sortedPermissionGroups.length" class="divide-y divide-gray-100 dark:divide-[var(--border-subtle)]">
            <li
              v-for="group in sortedPermissionGroups"
              :key="group.subject_id"
              class="flex items-center justify-between gap-3 px-3 py-2 text-sm text-gray-800 dark:text-[var(--text-primary)]"
            >
              <span class="min-w-0 truncate">
                {{ permissionSubjectLabel(group) }}
              </span>
              <div class="flex shrink-0 flex-nowrap items-center gap-1.5">
                <button
                  v-for="ability in group.abilities"
                  :key="`${group.subject_id}-${ability}`"
                  type="button"
                  class="rounded p-0.5 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-[var(--surface-muted)]"
                  :disabled="revokingKey === `${group.subject_id}-${ability}` || saving"
                  :title="revokeAbilityTitle(ability)"
                  @click="revokeAbility(group, ability)"
                >
                  <i
                    :class="[abilityIconClass(ability), abilityIconColor(ability), 'text-base']"
                  />
                </button>
              </div>
            </li>
          </ul>
          <div v-else class="px-3 py-2 text-sm text-gray-500 dark:text-[var(--text-secondary)]">
            {{ $t('noData') }}
          </div>
        </div>
      </div>
      <div class="rounded-lg border border-gray-200 p-3 dark:border-[var(--border-subtle)]">
        <UserSearch
          multiple
          :selected-users="selectedUsers"
          :show-label="true"
          :label="$t('shareRecipient')"
          @update:selected-users="selectedUsers = $event"
        />
        <div class="mt-3">
          <label>{{ $t('permissions') }}</label>
          <div
            class="mt-1.5 flex flex-wrap gap-2"
            role="group"
            :aria-label="$t('permissions')"
          >
            <button
              v-for="option in abilityOptions"
              :key="option.value"
              type="button"
              role="checkbox"
              :aria-checked="selectedAbilities.includes(option.value)"
              :title="option.label"
              class="flex h-10 w-10 items-center justify-center rounded-lg border transition-colors"
              :class="selectedAbilities.includes(option.value)
                ? 'border-[var(--label-accent)] bg-[color-mix(in_srgb,var(--label-accent)_12%,var(--surface-muted))] ring-2 ring-[color-mix(in_srgb,var(--label-accent)_35%,transparent)]'
                : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:hover:bg-[var(--surface-muted)]'"
              @click="toggleAbility(option.value)"
            >
              <i :class="[option.icon, option.color, 'text-base']" />
            </button>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <PrimaryButton :is-light="true" :onclick="handleClose">
        {{ $t('cancel') }}
      </PrimaryButton>
      <PrimaryButton :onclick="save" :disabled="saving">
        {{ $t('save') }}
      </PrimaryButton>
    </template>
  </CenteredModalDialog>
</template>

<script>
import CenteredModalDialog from '@/views/components/app/dialog/CenteredModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import UserSearch from '@/views/components/app/search/UserSearch.vue';
import DriveController from '@/api/DriveController';
import notificationMixin from '@/mixins/notificationMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import { driveFolderIconClass, driveFolderIconColor } from '@/constants/driveFolderIcons';
import {
  DRIVE_ABILITY_ICON_COLORS,
  DRIVE_ABILITY_ICONS,
  driveAbilityIconClass,
  driveAbilityIconColor,
  driveAbilityValuesForResourceType,
  expandDriveAbilitiesWithDependencies,
  filterAbilitiesForResourceType,
  normalizeDriveAbility,
  removeDriveAbility,
  sortDriveAbilities,
  stripDriveAbilitiesWithoutView,
} from '@/constants/driveAbilities';
import { getUserDisplayName } from '@/utils/displayUtils';

export default {
  name: 'DriveShareDialog',
  mixins: [notificationMixin, getApiErrorMessageMixin],
  components: {
    CenteredModalDialog,
    PrimaryButton,
    UserSearch,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    resourceType: {
      type: String,
      default: 'folder',
    },
    resourceName: {
      type: String,
      default: '',
    },
    resourceItem: {
      type: Object,
      default: null,
    },
    resourceId: {
      type: [Number, null],
      default: null,
    },
  },
  data() {
    return {
      permissionGroups: [],
      permissionsLoading: false,
      selectedUsers: [],
      selectedAbilities: ['view'],
      saving: false,
      revokingKey: null,
    };
  },
  computed: {
    abilityOptions() {
      return driveAbilityValuesForResourceType(this.resourceType).map((value) => ({
        value,
        label: this.abilityLabel(value),
        icon: DRIVE_ABILITY_ICONS[value],
        color: DRIVE_ABILITY_ICON_COLORS[value],
      }));
    },
    sortedPermissionGroups() {
      return this.permissionGroups.map((group) => ({
        ...group,
        abilities: sortDriveAbilities(group.abilities, this.resourceType),
      }));
    },
    fileIconClassForResource() {
      return DriveController.getFileIconClass({ name: this.resourceName });
    },
  },
  watch: {
    visible(value) {
      if (value) {
        this.resetForm();
        if (this.resourceId) {
          this.loadPermissions();
        }
        return;
      }
      this.permissionGroups = [];
    },
    resourceId(value) {
      if (this.visible && value) {
        this.loadPermissions();
      }
    },
    resourceType() {
      this.selectedAbilities = filterAbilitiesForResourceType(this.selectedAbilities, this.resourceType);
    },
    selectedUsers: {
      handler(users) {
        const subjectIds = this.normalizeSubjectIds(users);
        if (subjectIds.length !== 1) {
          return;
        }
        const group = this.permissionGroups.find(
          (item) => Number(item.subject_id) === subjectIds[0],
        );
        if (group) {
          this.selectedAbilities = sortDriveAbilities(group.abilities, this.resourceType);
        }
      },
      deep: true,
    },
  },
  emits: [
    'close',
    'saved',
  ],
  methods: {
    handleClose() {
      this.$emit('close');
    },
    resetForm() {
      this.selectedUsers = [];
      this.selectedAbilities = filterAbilitiesForResourceType(['view'], this.resourceType);
      this.saving = false;
      this.revokingKey = null;
    },
    normalizeSubjectIds(users) {
      return (Array.isArray(users) ? users : [])
        .map((user) => (typeof user === 'object' && user !== null ? user.id : user))
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0);
    },
    toggleAbility(ability) {
      if (this.selectedAbilities.includes(ability)) {
        if (ability === 'view') {
          this.selectedAbilities = [];
        } else {
          this.selectedAbilities = this.selectedAbilities.filter((item) => item !== ability);
        }
        if (!this.selectedAbilities.length) {
          this.selectedAbilities = ['view'];
        } else {
          this.selectedAbilities = stripDriveAbilitiesWithoutView(this.selectedAbilities, this.resourceType);
          if (!this.selectedAbilities.length) {
            this.selectedAbilities = ['view'];
          }
        }
        return;
      }
      this.selectedAbilities = expandDriveAbilitiesWithDependencies(
        [...this.selectedAbilities, ability],
        this.resourceType,
      );
    },
    revokeAbilityTitle(ability) {
      return `${this.abilityLabel(ability)} — ${this.$t('driveRevokeAbility')}`;
    },
    async revokeAbility(group, ability) {
      if (!this.resourceId || this.saving) {
        return;
      }
      const key = `${group.subject_id}-${ability}`;
      this.revokingKey = key;
      try {
        const nextAbilities = removeDriveAbility(group.abilities, ability, this.resourceType);
        const rows = await DriveController.syncPermissions({
          resource_type: this.resourceType,
          resource_id: this.resourceId,
          subject_id: group.subject_id,
          abilities: nextAbilities,
        });
        this.permissionGroups = Array.isArray(rows) ? rows : [];
        this.$emit('saved');
      } catch (error) {
        this.showNotification(
          this.$t('error'),
          this.getApiErrorMessage(error).join('\n') || this.$t('errorSavingData'),
          true,
        );
      } finally {
        this.revokingKey = null;
      }
    },
    async syncSubjectPermissions(subjectId, abilities) {
      return DriveController.syncPermissions({
        resource_type: this.resourceType,
        resource_id: this.resourceId,
        subject_id: subjectId,
        abilities: stripDriveAbilitiesWithoutView(
          expandDriveAbilitiesWithDependencies(abilities, this.resourceType),
          this.resourceType,
        ),
      });
    },
    async loadPermissions() {
      if (!this.resourceId || !this.resourceType) {
        this.permissionGroups = [];
        return;
      }
      this.permissionsLoading = true;
      try {
        const rows = await DriveController.listPermissions(this.resourceType, this.resourceId);
        this.permissionGroups = Array.isArray(rows) ? rows : [];
      } catch (error) {
        this.permissionGroups = [];
        this.showNotification(
          this.$t('error'),
          this.getApiErrorMessage(error).join('\n') || this.$t('errorGettingData'),
          true,
        );
      } finally {
        this.permissionsLoading = false;
      }
    },
    async save() {
      if (!this.selectedUsers.length) {
        this.showNotification(this.$t('error'), this.$t('driveShareUserRequired'), true);
        return;
      }
      const abilities = expandDriveAbilitiesWithDependencies(this.selectedAbilities, this.resourceType);
      if (!abilities.length) {
        this.showNotification(this.$t('error'), this.$t('driveShareAbilityRequired'), true);
        return;
      }
      if (!this.resourceId) {
        return;
      }
      this.saving = true;
      try {
        const subjectIds = this.normalizeSubjectIds(this.selectedUsers);

        if (!subjectIds.length) {
          this.showNotification(this.$t('error'), this.$t('driveShareUserRequired'), true);
          return;
        }

        await Promise.all(
          subjectIds.map((subjectId) => this.syncSubjectPermissions(subjectId, abilities)),
        );
        await this.loadPermissions();
        this.showNotification(this.$t('success'), this.$t('savedSuccessfully'), false);
        this.$emit('saved');
        this.handleClose();
      } catch (error) {
        this.showNotification(
          this.$t('error'),
          this.getApiErrorMessage(error).join('\n') || this.$t('errorSavingData'),
          true,
        );
      } finally {
        this.saving = false;
      }
    },
    permissionSubjectLabel(rule) {
      const name = getUserDisplayName(rule.subject);
      if (name) {
        return `#${rule.subject_id} · ${name}`;
      }
      return `#${rule.subject_id}`;
    },
    abilityLabel(ability) {
      const normalized = normalizeDriveAbility(ability);
      if (normalized === 'update') {
        return this.$t('edit');
      }
      return this.$t(normalized);
    },
    abilityIconClass: driveAbilityIconClass,
    abilityIconColor: driveAbilityIconColor,
    folderIconClass: driveFolderIconClass,
    folderIconStyle(folder) {
      return { color: driveFolderIconColor(folder) };
    },
  },
};
</script>

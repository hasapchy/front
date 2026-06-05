<template>
  <CenteredModalDialog
    :show-form="visible"
    :title="$t('shareAccess')"
    :onclose="$emit('close')"
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
        class="fas fa-file shrink-0 text-gray-400"
      />
      <span class="min-w-0 truncate font-medium">{{ resourceName }}</span>
    </div>
    <div class="space-y-4">
      <div v-if="resourceId">
        <label>{{ $t('driveExistingPermissions') }}</label>
        <div class="mt-1.5 max-h-32 overflow-y-auto rounded-lg border border-gray-200 dark:border-[var(--border-subtle)]">
          <div v-if="permissionsLoading" class="px-3 py-2 text-sm text-gray-500">
            {{ $t('loading') }}
          </div>
          <ul v-else-if="permissions.length" class="divide-y divide-gray-100 dark:divide-[var(--border-subtle)]">
            <li
              v-for="rule in permissions"
              :key="rule.id"
              class="flex items-center justify-between gap-2 px-3 py-2 text-sm"
            >
              <span class="min-w-0 truncate">
                {{ permissionSubjectLabel(rule) }} · {{ $t(rule.ability) }}
              </span>
              <span
                class="shrink-0 rounded px-1.5 py-0.5 text-xs font-medium"
                :class="rule.effect === 'allow' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'"
              >
                {{ rule.effect === 'allow' ? $t('allow') : $t('deny') }}
              </span>
            </li>
          </ul>
          <div v-else class="px-3 py-2 text-sm text-gray-500">
            {{ $t('noData') }}
          </div>
        </div>
      </div>
      <div>
        <label>{{ $t('shareRecipient') }}</label>
        <div class="mt-1.5 grid grid-cols-2 gap-2">
          <button
            type="button"
            :class="subjectTypeButtonClass('user')"
            @click="$emit('set-subject-type', 'user')"
          >
            <i class="fas fa-user" />
            {{ $t('user') }}
          </button>
          <button
            type="button"
            :class="subjectTypeButtonClass('role')"
            @click="$emit('set-subject-type', 'role')"
          >
            <i class="fas fa-user-shield" />
            {{ $t('role') }}
          </button>
        </div>
      </div>
      <div class="rounded-lg border border-gray-200 p-3 dark:border-[var(--border-subtle)]">
        <UserSearch
          v-if="subjectType === 'user'"
          :selected-user="selectedUser"
          :show-label="true"
          :label="$t('user')"
          @update:selected-user="$emit('update-selected-user', $event)"
        />
        <RoleSearch
          v-else
          :selected-role="selectedRole"
          :show-label="true"
          :label="$t('role')"
          @update:selected-role="$emit('update-selected-role', $event)"
        />
      </div>
      <div>
        <label>{{ $t('permissions') }}</label>
        <select
          :value="ability"
          class="mt-1.5 w-full"
          @change="$emit('update-ability', $event.target.value)"
        >
          <option value="view">
            {{ $t('view') }}
          </option>
          <option value="upload">
            {{ $t('create') }}
          </option>
          <option value="rename">
            {{ $t('edit') }}
          </option>
          <option value="delete">
            {{ $t('delete') }}
          </option>
          <option value="share">
            {{ $t('share') }}
          </option>
        </select>
      </div>
      <div>
        <label>{{ $t('shareEffect') }}</label>
        <div class="mt-1.5 grid grid-cols-2 gap-2">
          <button
            type="button"
            :class="effectButtonClass('allow')"
            @click="$emit('update-effect', 'allow')"
          >
            <i class="fas fa-check-circle" />
            {{ $t('allow') }}
          </button>
          <button
            type="button"
            :class="effectButtonClass('deny')"
            @click="$emit('update-effect', 'deny')"
          >
            <i class="fas fa-ban" />
            {{ $t('deny') }}
          </button>
        </div>
      </div>
    </div>
    <template #footer>
      <PrimaryButton :is-light="true" :onclick="() => $emit('close')">
        {{ $t('cancel') }}
      </PrimaryButton>
      <PrimaryButton :onclick="() => $emit('save')">
        {{ $t('save') }}
      </PrimaryButton>
    </template>
  </CenteredModalDialog>
</template>

<script>
import CenteredModalDialog from '@/views/components/app/dialog/CenteredModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import UserSearch from '@/views/components/app/search/UserSearch.vue';
import RoleSearch from '@/views/components/app/search/RoleSearch.vue';
import DriveController from '@/api/DriveController';
import notificationMixin from '@/mixins/notificationMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import { driveFolderIconClass, driveFolderIconColor } from '@/constants/driveFolderIcons';

export default {
  name: 'DriveShareDialog',
  mixins: [notificationMixin, getApiErrorMessageMixin],
  components: {
    CenteredModalDialog,
    PrimaryButton,
    UserSearch,
    RoleSearch,
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
    subjectType: {
      type: String,
      default: 'user',
    },
    selectedUser: {
      type: Object,
      default: null,
    },
    selectedRole: {
      type: Object,
      default: null,
    },
    ability: {
      type: String,
      default: 'view',
    },
    effect: {
      type: String,
      default: 'allow',
    },
    resourceId: {
      type: [Number, null],
      default: null,
    },
  },
  data() {
    return {
      permissions: [],
      permissionsLoading: false,
    };
  },
  watch: {
    visible(value) {
      if (value && this.resourceId) {
        this.loadPermissions();
      }
      if (!value) {
        this.permissions = [];
      }
    },
    resourceId(value) {
      if (this.visible && value) {
        this.loadPermissions();
      }
    },
  },
  emits: [
    'close',
    'save',
    'set-subject-type',
    'update-selected-user',
    'update-selected-role',
    'update-ability',
    'update-effect',
  ],
  methods: {
    async loadPermissions() {
      if (!this.resourceId || !this.resourceType) {
        this.permissions = [];
        return;
      }
      this.permissionsLoading = true;
      try {
        const rows = await DriveController.listPermissions(this.resourceType, this.resourceId);
        this.permissions = Array.isArray(rows) ? rows : [];
      } catch (error) {
        this.permissions = [];
        this.showNotification(
          this.$t('error'),
          this.getApiErrorMessage(error).join('\n') || this.$t('errorGettingData'),
          true,
        );
      } finally {
        this.permissionsLoading = false;
      }
    },
    permissionSubjectLabel(rule) {
      const type = rule.subject_type === 'role' ? this.$t('role') : this.$t('user');
      return `${type} #${rule.subject_id}`;
    },
    folderIconClass: driveFolderIconClass,
    folderIconStyle(folder) {
      return { color: driveFolderIconColor(folder) };
    },
    subjectTypeButtonClass(type) {
      const active = this.subjectType === type;
      return [
        'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'border-[var(--label-accent)] bg-[color-mix(in_srgb,var(--label-accent)_12%,transparent)] text-[var(--label-accent)]'
          : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-[var(--border-subtle)] dark:text-[var(--text-secondary)] dark:hover:bg-[var(--surface-muted)]',
      ];
    },
    effectButtonClass(effectValue) {
      const active = this.effect === effectValue;
      if (effectValue === 'allow') {
        return [
          'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
          active
            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
            : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-[var(--border-subtle)] dark:text-[var(--text-secondary)] dark:hover:bg-[var(--surface-muted)]',
        ];
      }
      return [
        'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'border-red-500 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-950/40 dark:text-red-400'
          : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-[var(--border-subtle)] dark:text-[var(--text-secondary)] dark:hover:bg-[var(--surface-muted)]',
      ];
    },
  },
};
</script>

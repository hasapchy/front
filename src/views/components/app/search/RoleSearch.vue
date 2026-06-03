<template>
  <AppFieldPicker
    :has-selection="selectedRole != null"
    :show-label="showLabel"
    :label="label || $t('role')"
    :required="required"
    :disabled="disabled"
    :allow-deselect="allowDeselect"
    :dropdown-open="showDropdown"
    :search-value="roleSearch"
    :placeholder="$t('roleName')"
    @update:search-value="roleSearch = $event"
    @focus="handleFocus"
    @blur="handleBlur"
    @deselect="deselectRole"
  >
    <template #dropdown>
      <li
        v-if="roleSearchLoading"
        class="app-field-picker__message"
      >
        {{ $t('loading') }}
      </li>
      <li
        v-else-if="roleSearch.length > 0 && roleSearch.length < searchMinLength"
        class="app-field-picker__message"
      >
        {{ $t('minimum3Characters') }}
      </li>
      <li
        v-else-if="roleSearch.length >= searchMinLength && dropdownRoles.length === 0"
        class="app-field-picker__message"
      >
        {{ $t('notFound') }}
      </li>
      <li
        v-for="role in dropdownRoles"
        :key="role.id"
        class="app-field-picker__option"
        @mousedown.prevent="selectRole(role)"
      >
        <div class="app-field-picker__option-row">
          <div class="app-field-picker__option-leading">
            <div
              class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)]"
            >
              <i class="fas fa-user-shield text-[var(--text-secondary)]" />
            </div>
            <div class="min-w-0">
              <div class="app-field-picker__option-primary">
                {{ role.name }}
              </div>
            </div>
          </div>
        </div>
      </li>
    </template>

    <template #selected>
      <div class="flex items-center gap-3">
        <div
          class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)]"
        >
          <i class="fas fa-user-shield text-[var(--text-secondary)]" />
        </div>
        <div class="min-w-0">
          <p class="app-field-picker__selected-line">
            {{ selectedRoleName }}
          </p>
        </div>
      </div>
    </template>
  </AppFieldPicker>
</template>

<script>
import RolesController from '@/api/RolesController';
import debounce from 'lodash.debounce';
import AppFieldPicker from '@/views/components/app/forms/AppFieldPicker.vue';

const SEARCH_MIN_LENGTH = 3;

export default {
  name: 'RoleSearch',
  components: { AppFieldPicker },
  props: {
    selectedRole: {
      type: [Object, Number],
      default: null,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    required: {
      type: Boolean,
      default: false,
    },
    showLabel: {
      type: Boolean,
      default: true,
    },
    allowDeselect: {
      type: Boolean,
      default: true,
    },
    label: {
      type: String,
      default: '',
    },
  },
  emits: ['update:selectedRole'],
  data() {
    return {
      roleSearch: '',
      roleSearchLoading: false,
      roleResults: [],
      lastRoles: [],
      searchAbortController: null,
      showDropdown: false,
      searchMinLength: SEARCH_MIN_LENGTH,
    };
  },
  computed: {
    selectedRoleObject() {
      if (this.selectedRole && typeof this.selectedRole === 'object') {
        return this.selectedRole;
      }
      const roleId = Number(this.selectedRole);
      if (!roleId) {
        return null;
      }
      const fromStore = (this.$store.getters.roles || []).find((role) => Number(role.id) === roleId);
      if (fromStore) {
        return fromStore;
      }
      return this.lastRoles.find((role) => Number(role.id) === roleId)
        || this.roleResults.find((role) => Number(role.id) === roleId)
        || null;
    },
    selectedRoleName() {
      return this.selectedRoleObject?.name || '';
    },
    dropdownRoles() {
      if (this.roleSearch.length === 0) {
        return this.lastRoles;
      }
      if (this.roleSearch.length < this.searchMinLength) {
        return [];
      }
      return this.roleResults;
    },
  },
  async created() {
    await this.fetchLastRoles();
    const roleId = Number(this.selectedRole?.id ?? this.selectedRole) || null;
    if (!roleId) {
      return;
    }
    if (this.selectedRoleObject?.name) {
      return;
    }
    try {
      this.$emit('update:selectedRole', await RolesController.getItem(roleId));
    } catch {
      void 0;
    }
  },
  methods: {
    async fetchLastRoles() {
      try {
        let roles = this.$store.getters.roles;
        if (!roles?.length) {
          await this.$store.dispatch('loadRoles');
          roles = this.$store.getters.roles;
        }
        this.lastRoles = Array.isArray(roles) ? roles.slice(0, 10) : [];
      } catch {
        try {
          const roles = await RolesController.getListItems();
          this.lastRoles = Array.isArray(roles) ? roles.slice(0, 10) : [];
        } catch {
          this.lastRoles = [];
        }
      }
    },
    searchRoles: debounce(async function searchRolesDebounced() {
      if (this.roleSearch.length < this.searchMinLength) {
        this.roleResults = [];
        return;
      }
      if (this.searchAbortController) {
        this.searchAbortController.abort();
      }
      this.searchAbortController = new AbortController();
      const { signal } = this.searchAbortController;
      this.roleSearchLoading = true;
      try {
        const page = await RolesController.getItems(1, 30, this.roleSearch);
        if (signal.aborted) {
          return;
        }
        this.roleResults = page?.items || [];
      } catch (error) {
        if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
          return;
        }
        this.roleResults = [];
      } finally {
        if (!signal.aborted) {
          this.roleSearchLoading = false;
        }
      }
    }, 400),
    selectRole(role) {
      this.showDropdown = false;
      this.roleSearch = '';
      this.roleResults = [];
      this.$emit('update:selectedRole', role);
    },
    deselectRole() {
      this.$emit('update:selectedRole', null);
    },
    async handleFocus() {
      this.showDropdown = true;
      if (this.lastRoles.length === 0) {
        await this.fetchLastRoles();
      }
    },
    handleBlur() {
      requestAnimationFrame(() => {
        this.showDropdown = false;
      });
    },
  },
  watch: {
    roleSearch: {
      handler: 'searchRoles',
      immediate: true,
    },
    '$store.state.roles': {
      handler(roles) {
        if (Array.isArray(roles) && roles.length > 0) {
          this.lastRoles = roles.slice(0, 10);
          const roleId = Number(this.selectedRole?.id ?? this.selectedRole);
          if (roleId) {
            const updated = roles.find((role) => Number(role.id) === roleId);
            if (updated) {
              this.$emit('update:selectedRole', updated);
            }
          }
        }
      },
      immediate: true,
      deep: true,
    },
  },
};
</script>

<style scoped>
.appear-enter-active,
.appear-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.appear-enter-from,
.appear-leave-to {
  transform: scaleY(0);
  opacity: 0;
  transform-origin: top;
}

.appear-enter-to,
.appear-leave-from {
  transform: scaleY(1);
  opacity: 1;
  transform-origin: top;
}
</style>

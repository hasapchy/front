<template>
  <AppFieldPicker
    :has-selection="selectedRole != null"
    :show-label="showLabel"
    :label="label"
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
        v-if="roles.length === 0"
        class="app-field-picker__message"
      >
        {{ $t('noRolesAvailable') }}
      </li>
      <li
        v-else-if="roleSearch.length > 0 && filteredRoles.length === 0"
        class="app-field-picker__message"
      >
        {{ $t('notFound') }}
      </li>
      <AppFieldPickerOption
        v-for="role in filteredRoles"
        :key="role.id"
        :primary="role.name"
        @select="selectRole(role)"
      />
    </template>
    <template #selected>
      <p class="app-field-picker__selected-line">
        {{ selectedRole?.name }}
      </p>
    </template>
  </AppFieldPicker>
</template>

<script>
import AppFieldPicker from '@/views/components/app/forms/AppFieldPicker.vue';
import AppFieldPickerOption from '@/views/components/app/forms/AppFieldPickerOption.vue';

export default {
  name: 'CompanyRolePicker',
  components: { AppFieldPicker, AppFieldPickerOption },
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    roles: {
      type: Array,
      default: () => [],
    },
    label: {
      type: String,
      default: '',
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
  },
  emits: ['update:modelValue'],
  data() {
    return {
      roleSearch: '',
      showDropdown: false,
    };
  },
  computed: {
    selectedRole() {
      const value = String(this.modelValue || '').trim();
      if (!value) {
        return null;
      }
      return this.roles.find((role) => role.name === value) || { name: value, permissions: [] };
    },
    filteredRoles() {
      const query = String(this.roleSearch || '').trim().toLowerCase();
      if (!query) {
        return this.roles;
      }
      return this.roles.filter((role) => String(role.name || '').toLowerCase().includes(query));
    },
  },
  methods: {
    selectRole(role) {
      this.showDropdown = false;
      this.roleSearch = '';
      this.$emit('update:modelValue', role?.name || '');
    },
    deselectRole() {
      this.$emit('update:modelValue', '');
    },
    handleFocus() {
      this.showDropdown = true;
    },
    handleBlur() {
      requestAnimationFrame(() => {
        this.showDropdown = false;
      });
    },
  },
};
</script>

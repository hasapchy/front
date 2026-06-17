<template>
  <AppFieldPicker
    multiple
    :show-label="showLabel"
    :label="label || $t('departments')"
    :required="required"
    :disabled="disabled"
    :allow-deselect="allowDeselect"
    :dropdown-open="showDropdown"
    :search-value="departmentSearch"
    :placeholder="$t('departments')"
    @update:search-value="departmentSearch = $event"
    @focus="handleFocus"
    @blur="handleBlur"
    @deselect="clearSelection"
  >
    <template #multiple>
      <div class="relative">
        <div
          class="flex w-full min-h-10 cursor-text flex-wrap items-center gap-1.5 rounded-md border-2 border-[var(--input-border)] bg-[var(--input-bg)] p-2 transition-all duration-200 ease-in-out focus-within:border-[var(--label-accent)] focus-within:shadow-[0_0_0_2px_color-mix(in_srgb,var(--label-accent)_22%,transparent)]"
          @click="focusInput"
        >
          <div
            v-for="department in selectedDepartments"
            :key="department.id"
            class="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--label-accent)_28%,var(--border-subtle))] bg-[color-mix(in_srgb,var(--label-accent)_12%,var(--surface-muted))] px-2 py-0.5 text-xs text-[var(--label-accent)]"
          >
            <i class="fas fa-sitemap text-[10px]" />
            <span class="max-w-[180px] truncate whitespace-nowrap">{{ department.title }}</span>
            <button
              v-if="allowDeselect"
              type="button"
              class="ml-0.5 flex-shrink-0 text-sm leading-none text-[var(--color-danger)] hover:text-[var(--color-danger-hover)] dark:text-[var(--color-danger)] dark:hover:text-[var(--color-danger)]"
              :disabled="disabled"
              @mousedown.prevent.stop="removeDepartment(department)"
            >
              ×
            </button>
          </div>
          <input
            ref="searchInput"
            v-model="departmentSearch"
            type="text"
            :placeholder="selectedDepartments.length === 0 ? $t('departments') : ''"
            class="m-0 min-w-0 border-0 bg-transparent p-0 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-0 focus:ring-0 !shadow-none focus:!shadow-none"
            :class="selectedDepartments.length === 0 ? 'min-w-[120px] flex-1' : ''"
            :style="inputInlineStyle"
            :disabled="disabled"
            @focus="handleFocus"
            @blur="handleBlur"
          >
        </div>
        <transition name="appear">
          <ul
            v-show="showDropdown"
            class="app-field-picker__dropdown"
            @mousedown.prevent
          >
            <li
              v-if="departments.length === 0"
              class="app-field-picker__message"
            >
              {{ $t('noDepartmentsAvailable') }}
            </li>
            <li
              v-else-if="departmentSearch.length > 0 && filteredDepartments.length === 0"
              class="app-field-picker__message"
            >
              {{ $t('notFound') }}
            </li>
            <li
              v-for="department in filteredDepartments"
              :key="department.id"
              class="app-field-picker__option"
              :class="{ 'app-field-picker__option--selected': isDepartmentSelected(department.id) }"
              @mousedown.prevent="toggleDepartment(department)"
            >
              <div class="app-field-picker__option-row">
                <div class="app-field-picker__option-leading">
                  <div
                    class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                    :class="isDepartmentSelected(department.id)
                      ? 'bg-[color-mix(in_srgb,var(--label-accent)_18%,var(--surface-muted))] text-[var(--label-accent)]'
                      : 'bg-[var(--surface-muted)] text-[var(--text-secondary)]'"
                  >
                    <i class="fas fa-sitemap text-sm" />
                  </div>
                  <div class="min-w-0">
                    <div class="app-field-picker__option-primary">
                      {{ department.title }}
                    </div>
                    <div
                      v-if="department.description"
                      class="app-field-picker__option-sub"
                    >
                      {{ department.description }}
                    </div>
                  </div>
                </div>
                <span
                  v-if="departmentUsersLabel(department)"
                  class="app-field-picker__option-meta app-field-picker__option-meta--accent"
                >
                  {{ departmentUsersLabel(department) }}
                </span>
              </div>
            </li>
          </ul>
        </transition>
      </div>
    </template>
  </AppFieldPicker>
</template>

<script>
import AppFieldPicker from '@/views/components/app/forms/AppFieldPicker.vue';

export default {
  name: 'DepartmentSearch',
  components: { AppFieldPicker },
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
    departments: {
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
      departmentSearch: '',
      showDropdown: false,
    };
  },
  computed: {
    selectedIds() {
      if (!Array.isArray(this.modelValue)) {
        return [];
      }
      return this.modelValue.map((id) => Number(id)).filter((id) => id > 0);
    },
    selectedDepartments() {
      return this.selectedIds
        .map((id) => this.departments.find((department) => Number(department.id) === id))
        .filter(Boolean);
    },
    filteredDepartments() {
      const query = String(this.departmentSearch || '').trim().toLowerCase();
      if (!query) {
        return this.departments;
      }
      return this.departments.filter((department) => {
        const title = String(department.title || '').toLowerCase();
        const description = String(department.description || '').toLowerCase();
        return title.includes(query) || description.includes(query);
      });
    },
    inputInlineStyle() {
      if (this.selectedDepartments.length === 0) {
        return { border: 'none' };
      }
      if (this.departmentSearch) {
        return { minWidth: '120px', flex: '1 1 auto', border: 'none' };
      }
      return { width: '2px', minWidth: '2px', padding: 0, opacity: 0, border: 'none' };
    },
  },
  methods: {
    departmentUsersLabel(department) {
      const count = Number(department?.users_count);
      if (!Number.isFinite(count) || count <= 0) {
        return '';
      }
      return `${count} ${this.$t('employees')}`;
    },
    isDepartmentSelected(departmentId) {
      return this.selectedIds.includes(Number(departmentId));
    },
    emitSelection(nextIds) {
      this.$emit('update:modelValue', nextIds);
    },
    toggleDepartment(department) {
      if (this.disabled || !department?.id) {
        return;
      }
      const id = Number(department.id);
      const next = this.isDepartmentSelected(id)
        ? this.selectedIds.filter((item) => item !== id)
        : [...this.selectedIds, id];
      this.emitSelection(next);
    },
    removeDepartment(department) {
      if (this.disabled || !department?.id) {
        return;
      }
      const id = Number(department.id);
      this.emitSelection(this.selectedIds.filter((item) => item !== id));
    },
    clearSelection() {
      this.emitSelection([]);
    },
    focusInput() {
      this.$refs.searchInput?.focus();
    },
    handleFocus() {
      this.showDropdown = true;
    },
    handleBlur() {
      requestAnimationFrame(() => {
        this.showDropdown = false;
        this.departmentSearch = '';
      });
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

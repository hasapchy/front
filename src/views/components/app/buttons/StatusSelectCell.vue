<template>
  <div
    ref="dropdownRef"
    class="relative status-dropdown inline-block"
    @dblclick.stop
  >
    <div
      :class="[
        'px-2 py-2 rounded flex items-center gap-1.5',
        compactTrigger ? 'justify-center min-w-[32px]' : 'justify-between min-w-[120px]',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        selectedStatus?.cellClass,
      ]"
      :style="selectedStyle"
      :title="compactTrigger && selectedStatus ? getStatusName(selectedStatus) : undefined"
      @click.stop="toggleDropdown"
    >
      <i
        v-if="selectedStatus?.icon"
        :class="[selectedStatus.icon, triggerIconClass]"
        class="shrink-0"
      />
      <span
        v-if="!compactTrigger"
        class="truncate text-[12px] text-white"
      >
        {{ selectedStatus ? getStatusName(selectedStatus) : (placeholder || $t('selectStatus')) }}
      </span>
      <i
        v-if="!disabled"
        class="fas fa-chevron-down text-xs shrink-0"
        :class="selectedStatus?.chevronClass || 'text-white ml-2'"
      />
    </div>

    <ul
      v-if="isOpen"
      ref="dropdownMenu"
      class="fixed z-50 max-h-64 w-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.45)]"
      :style="dropdownStyle"
      @click.stop
    >
      <template v-for="group in sortedStatuses">
        <li
          v-for="s in group.items"
          :key="`${group.category?.id ?? 'default'}-${s.id}`"
          :class="[
            'flex cursor-pointer items-center border-l-4 px-4 py-3 transition-all duration-200',
            s.id === value
              ? 'border-blue-500 bg-blue-50 font-semibold text-blue-700 dark:border-[var(--label-accent)] dark:bg-[var(--surface-muted)] dark:text-[var(--label-accent)]'
              : 'border-transparent hover:border-blue-400 hover:bg-blue-50 dark:border-transparent dark:hover:border-[var(--label-accent)] dark:hover:bg-[var(--surface-muted)]'
          ]"
          @click.stop="selectStatus(s.id)"
        >
          <i
            v-if="s.icon"
            :class="s.icon"
            class="mr-3 flex-shrink-0 text-gray-500 dark:text-[var(--text-secondary)]"
          />
          <div
            :class="[
              'mr-3 h-3 w-3 flex-shrink-0 rounded-full',
              s.id === value ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-[var(--label-accent)] dark:ring-offset-[var(--surface-muted)]' : ''
            ]"
            :style="{ backgroundColor: getColorStyle(s) }"
          />
          <span
            :class="[
              'text-sm font-medium',
              s.id === value ? 'text-blue-700 dark:text-[var(--label-accent)]' : 'text-gray-700 dark:text-[var(--text-primary)]'
            ]"
          >
            {{ getStatusName(s) }}
          </span>
        </li>
      </template>
    </ul>
  </div>
</template>

<script>
import { translateOrderStatus, translateTaskStatus } from '@/utils/translationUtils';
import { enrichStatusesForSelect } from '@/utils/statusSelectIcons';

export default {
  props: {
    value: {
      type: [String, Number, Boolean],
      default: null,
    },
    statuses: {
      type: Array,
      default: () => [],
    },
    onChange: Function,
    placeholder: {
      type: String,
      default: null,
    },
    plainNames: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    showTriggerLabel: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isOpen: false,
      dropdownStyle: {},
    };
  },
  computed: {
    normalizedStatuses() {
      return enrichStatusesForSelect(this.statuses);
    },
    selectedStatus() {
      return this.normalizedStatuses.find((s) => s.id === this.value) || null;
    },
    showLabelWithIcon() {
      return this.normalizedStatuses.some((s) => s.category != null || typeof s.id === 'number');
    },
    compactTrigger() {
      if (this.showTriggerLabel) {
        return false;
      }
      return Boolean(this.selectedStatus?.icon) && !this.showLabelWithIcon;
    },
    triggerIconClass() {
      return this.selectedStatus?.iconClass || 'text-white';
    },
    selectedStyle() {
      const hex = this.selectedStatus?.color;
      const style = {
        backgroundColor: hex || '#3571A4',
      };

      if (this.selectedStatus?.borderColor) {
        style.border = `1px solid ${this.selectedStatus.borderColor}`;
      }

      return style;
    },
    sortedStatuses() {
      const statuses = this.normalizedStatuses;
      if (statuses.length > 0 && statuses[0].category) {
        const grouped = {};
        for (const status of statuses) {
          const catId = status.category?.id ?? 0;
          if (!grouped[catId]) {
            grouped[catId] = {
              category: status.category,
              items: [],
            };
          }
          grouped[catId].items.push(status);
        }
        return Object.values(grouped).sort((a, b) => {
          const aId = a.category?.id ?? 0;
          const bId = b.category?.id ?? 0;
          return aId - bId;
        });
      }

      return [{
        category: null,
        items: statuses,
      }];
    },
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    toggleDropdown() {
      if (this.disabled) {
        return;
      }
      this.isOpen = !this.isOpen;
      if (!this.isOpen) {
        return;
      }
      this.$nextTick(() => {
        const rect = this.$refs.dropdownRef?.getBoundingClientRect?.();
        if (!rect) {
          return;
        }
        this.dropdownStyle = {
          top: `${rect.bottom + 8}px`,
          left: `${rect.left}px`,
        };
      });
    },
    selectStatus(newId) {
      if (this.disabled) {
        return;
      }
      this.isOpen = false;
      this.onChange?.(newId);
    },
    getColorStyle(status) {
      const hex = status.category?.color || status.color;
      return hex || 'transparent';
    },
    handleClickOutside(e) {
      if (this.$refs.dropdownRef && !this.$refs.dropdownRef.contains(e.target)) {
        this.isOpen = false;
      }
    },
    getStatusName(status) {
      if (!status?.name) {
        return '';
      }
      if (this.plainNames) {
        return status.name;
      }
      if (status.category) {
        return translateOrderStatus(status.name, this.$t);
      }
      return translateTaskStatus(status.name, this.$t);
    },
  },
};
</script>

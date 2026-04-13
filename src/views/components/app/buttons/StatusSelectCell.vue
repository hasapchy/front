<template>
  <div
    ref="dropdownRef"
    class="relative status-dropdown inline-block"
  >
    <div
      class="px-2 py-2 rounded cursor-pointer flex items-center justify-between min-w-[120px]"
      :style="selectedStyle"
      @click="toggleDropdown"
    >
      <span class="truncate text-[12px] text-white">{{ selectedStatus ? getStatusName(selectedStatus) : (placeholder || $t('selectStatus')) }}</span>
      <i class="fas fa-chevron-down text-xs ml-2 text-white" />
    </div>

    <ul
      v-if="isOpen"
      ref="dropdownMenu"
      class="fixed z-50 max-h-64 w-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.45)]"
      :style="dropdownStyle"
    >
      <template
        v-for="group in sortedStatuses"
        :key="group.category?.id"
      >
        <li
          v-for="s in group.items"
          :key="s.id"
          :class="[
            'flex cursor-pointer items-center border-l-4 px-4 py-3 transition-all duration-200',
            s.id === value 
              ? 'border-blue-500 bg-blue-50 font-semibold text-blue-700 dark:border-[var(--label-accent)] dark:bg-[var(--surface-muted)] dark:text-[var(--label-accent)]' 
              : 'border-transparent hover:border-blue-400 hover:bg-blue-50 dark:border-transparent dark:hover:border-[var(--label-accent)] dark:hover:bg-[var(--surface-muted)]'
          ]"
          @click="selectStatus(s.id)"
        >
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
          >{{ getStatusName(s) }}</span>
        </li>
      </template>
    </ul>
  </div>
</template>

<script>
import { translateOrderStatus, translateTaskStatus } from '@/utils/translationUtils';

export default {
  props: {
    id: Number,
    value: Number,
    statuses: {
      type: Array,
      required: true
    },
    onChange: Function,
    placeholder: {
      type: String,
      default: null
    },
  },
  data() {
    return {
      isOpen: false,
      dropdownStyle: {}
    };
  },
  computed: {
    selectedStatus() {
      return this.statuses.find(s => s.id === this.value);
    },
    selectedStyle() {
      // Поддержка как категорий (для заказов), так и прямого цвета (для проектов)
      const hex = this.selectedStatus?.category?.color || this.selectedStatus?.color;

      if (!hex) {
        return {
          backgroundColor: '#3571A4',
          color: '#555',
        };
      }

      return {
        backgroundColor: hex,
        color: '#000',
      };
    },
    sortedStatuses() {
      // Если у статусов есть категории (заказы), группируем по категориям
      if (this.statuses.length > 0 && this.statuses[0].category) {
        const grouped = {};
        for (const status of this.statuses) {
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
      } else {
        // Если у статусов нет категорий (проекты), возвращаем простой список
        return [{
          category: null,
          items: this.statuses
        }];
      }
    }
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    toggleDropdown() {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.$nextTick(() => {
          if (this.$refs.dropdownRef) {
            const rect = this.$refs.dropdownRef.getBoundingClientRect();
            this.dropdownStyle = {
              top: `${rect.bottom + 8}px`,
              left: `${rect.left}px`
            };
          }
        });
      }
    },
    selectStatus(newId) {
      this.isOpen = false;
      this.onChange?.(newId);
    },
    getColorStyle(status) {
      // Поддержка как категорий (для заказов), так и прямого цвета (для проектов)
      const hex = status.category?.color || status.color;
      if (!hex) return 'transparent';
      return hex;
    },
    hexToRgb(hex) {
      const clean = hex.replace('#', '');
      const bigint = parseInt(clean, 16);
      return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
      };
    },
    handleClickOutside(e) {
      if (this.$refs.dropdownRef && !this.$refs.dropdownRef.contains(e.target)) {
        this.isOpen = false;
      }
    },
    getStatusName(status) {
      if (!status || !status.name) return '';
      if (status.category) {
        return translateOrderStatus(status.name, this.$t);
      }
      return translateTaskStatus(status.name, this.$t);
    },
  }
};
</script>


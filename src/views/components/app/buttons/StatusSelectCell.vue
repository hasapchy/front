<template>
  <div ref="dropdownRef" class="relative status-dropdown inline-block">
    <div class="px-2 py-2 rounded cursor-pointer flex items-center justify-between min-w-[120px]" :style="selectedStyle"
      @click="toggleDropdown">
      <span class="truncate text-[12px] text-white">{{ selectedStatus?.name || $t('selectStatus') }}</span>
      <i class="fas fa-chevron-down text-xs ml-2 text-white"></i>
    </div>

    <ul v-if="isOpen" ref="dropdownMenu" class="fixed z-50 w-64 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" :style="dropdownStyle">
      <template v-for="group in sortedStatuses" :key="group.category?.id">
        <li v-for="s in group.items" :key="s.id"
          :class="[
            'px-4 py-3 cursor-pointer flex items-center transition-all duration-200',
            s.id === value 
              ? 'bg-blue-50 border-l-4 border-blue-500 text-blue-700 font-semibold' 
              : 'hover:bg-gray-50 border-l-4 border-transparent hover:border-blue-400 hover:bg-blue-50'
          ]"
          @click="selectStatus(s.id)">
          <div :class="[
            'w-3 h-3 rounded-full mr-3 flex-shrink-0',
            s.id === value ? 'ring-2 ring-blue-500 ring-offset-1' : ''
          ]" :style="{ backgroundColor: getColorStyle(s) }"></div>
          <span :class="[
            'text-sm font-medium',
            s.id === value ? 'text-blue-700' : 'text-gray-700'
          ]">{{ s.name }}</span>
        </li>
      </template>
    </ul>
  </div>

</template>

<script>
export default {
  props: {
    id: Number,
    value: Number,
    statuses: {
      type: Array,
      required: true
    },
    onChange: Function,
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
  methods: {
    toggleDropdown(event) {
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
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }
};
</script>


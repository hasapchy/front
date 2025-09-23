<template>
  <div ref="dropdownRef" class="relative status-dropdown inline-block">
    <div class="px-2 py-2 rounded cursor-pointer flex items-center justify-between min-w-[120px]" :style="selectedStyle"
      @click="toggleDropdown">
      <span class="truncate text-[12px] text-white">{{ selectedStatus?.name || $t('selectStatus') }}</span>
      <i class="fas fa-chevron-down text-xs ml-2 text-white"></i>
    </div>

    <ul v-if="isOpen" class="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-auto">
      <template v-for="(group, groupIndex) in sortedStatuses" :key="group.category?.id">
        <li v-for="(s, index) in group.items" :key="s.id"
          :class="['px-2 py-3 hover:bg-gray-100 cursor-pointer flex items-center justify-between', { 'mb-2': !(groupIndex === sortedStatuses.length - 1 && index === group.items.length - 1) }]"
          @click="selectStatus(s.id)" :style="{ backgroundColor: getColorStyle(s), color: '#fff' }">
          <span>{{ s.name }}</span>
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
    }
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }
};
</script>


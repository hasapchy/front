<template>
  <div ref="dropdownRef" class="relative text-sm w-full status-dropdown">
    <!-- Отображение выбранного -->
    <div
      class="p-2 rounded border cursor-pointer flex items-center justify-between"
      :style="selectedStyle"
      @click="toggleDropdown"
    >
      <span class="truncate">{{ selectedStatus?.name || '—' }}</span>
      <i class="fas fa-chevron-down text-xs ml-2 text-gray-600"></i>
    </div>

    <!-- Выпадающий список -->
    <ul
      v-if="isOpen"
      class="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-auto"
    >
      <li
        v-for="s in allStatuses"
        :key="s.id"
        class="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
        @click="selectStatus(s.id)"
        :style="{ backgroundColor: getColorStyle(s), color: '#000' }"
      >
        <span>{{ s.name }}</span>
        <!-- <span v-if="s.category?.name" class="text-xs text-gray-600 ml-2">({{ s.category.name }})</span> -->
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: {
    id: Number,
    value: Number,
    allStatuses: {
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
      return this.allStatuses.find(s => s.id === this.value);
    },
    selectedStyle() {
      const hex = this.selectedStatus?.category?.color;
      if (!hex) return {};
      const { r, g, b } = this.hexToRgb(hex);
      return {
        backgroundColor: `rgba(${r}, ${g}, ${b}, 0.2)`,
        color: '#000',
      };
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
      const hex = status.category?.color;
      if (!hex) return 'transparent';
      const { r, g, b } = this.hexToRgb(hex);
      return `rgba(${r}, ${g}, ${b}, 0.15)`;
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

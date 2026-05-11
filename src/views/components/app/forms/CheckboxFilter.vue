<template>
  <div
    ref="root"
    class="relative w-full"
  >
    <button
      type="button"
      class="custom-dropdown-button checkbox-filter__trigger"
      :class="{ 'checkbox-filter__trigger_single-line': singleLinePreview }"
      @click="showDropdown = !showDropdown"
    >
      <div class="checkbox-filter__selection">
        <template v-if="localValue.length === 0">
          <span class="checkbox-filter__placeholder">{{ $t(placeholder) }}</span>
        </template>
        <template v-else>
          <span
            v-for="option in previewPills"
            :key="option.value"
            :title="pillTitle"
            class="checkbox-filter__pill"
          >
            {{ option.label }}
          </span>
          <span
            v-if="hasMoreInPreview"
            class="checkbox-filter__ellipsis"
            :title="pillTitle"
          >…</span>
        </template>
      </div>
      <i class="fas fa-chevron-down" />
    </button>

    <transition name="fade">
      <div
        v-if="showDropdown"
        class="checkbox-filter__dropdown"
      >
        <div class="checkbox-filter__list">
          <label
            v-for="option in listOptions"
            :key="option.value"
            class="checkbox-filter__option"
          >
            <input
              v-model="localValue"
              type="checkbox"
              :value="option.value"
              @change="emitSelection"
            >
            <span>{{ option.label }}</span>
          </label>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'CheckboxFilter',
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
    options: {
      type: Array,
      default: () => [],
    },
    placeholder: {
      type: String,
      default: 'all',
    },
    singleLinePreview: {
      type: Boolean,
      default: false,
    },
    maxVisibleCount: {
      type: Number,
      default: 5,
    },
  },
  emits: ['update:modelValue', 'change'],
  data() {
    return {
      showDropdown: false,
      localValue: Array.isArray(this.modelValue) ? [...this.modelValue] : [],
    };
  },
  computed: {
    listOptions() {
      return Array.isArray(this.options) ? this.options : [];
    },
    pillTitle() {
      return this.selectedOptions.map((o) => o.label).join(', ');
    },
    selectedOptions() {
      if (!Array.isArray(this.localValue) || !this.localValue.length) return [];
      return this.localValue
        .map((value) => this.listOptions.find((o) => o.value === value))
        .filter(Boolean);
    },
    previewPills() {
      return this.singleLinePreview
        ? this.selectedOptions.slice(0, this.maxVisibleCount)
        : this.selectedOptions;
    },
    hasMoreInPreview() {
      return this.singleLinePreview && this.selectedOptions.length > this.maxVisibleCount;
    },
  },
  watch: {
    modelValue: {
      handler(next) {
        this.localValue = Array.isArray(next) ? [...next] : [];
      },
      deep: true,
    },
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    emitSelection() {
      const next = Array.isArray(this.localValue) ? [...this.localValue] : [];
      this.$emit('update:modelValue', next);
      this.$emit('change', next);
    },
    handleClickOutside(event) {
      if (this.$refs.root && !this.$refs.root.contains(event.target)) this.showDropdown = false;
    },
  },
};
</script>

<style scoped>
.checkbox-filter__trigger {
  min-height: 40px;
  text-align: left;
  padding-right: 2.5rem;
}

.checkbox-filter__selection {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  width: 100%;
}

.checkbox-filter__trigger_single-line .checkbox-filter__selection {
  flex-wrap: nowrap;
  overflow: hidden;
}

.checkbox-filter__placeholder {
  color: #9ca3af;
  font-size: 0.875rem;
}

.checkbox-filter__ellipsis {
  flex-shrink: 0;
  color: #6b7280;
  font-size: 0.75rem;
  padding-left: 2px;
}

.checkbox-filter__pill {
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  border-radius: 9999px;
  background-color: #eff6ff;
  color: #1d4ed8;
  font-size: 0.75rem;
  line-height: 1.75rem;
  height: 1.75rem;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.checkbox-filter__dropdown {
  position: absolute;
  z-index: 50;
  top: calc(100% + 4px);
  left: 0;
  width: 100%;
  min-width: 12rem;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
}

.checkbox-filter__list {
  max-height: 16rem;
  overflow-y: auto;
  padding: 0.5rem;
}

.checkbox-filter__option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.checkbox-filter__option:hover {
  background-color: #f3f4f6;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>

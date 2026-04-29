<template>
  <div
    ref="dropdownRef"
    class="relative inline-block"
    @dblclick.stop
  >
    <div
      :class="['px-2 py-2 rounded cursor-pointer flex items-center gap-1', selectedOption?.icon ? 'justify-center min-w-[32px]' : 'justify-between min-w-[120px]']"
      :style="selectedStyle"
      :title="selectedOption ? selectedOption.label : placeholder"
      @click.stop="toggleDropdown"
    >
      <i
        v-if="selectedOption?.icon"
        :class="selectedOption.icon"
        class="text-white"
      />
      <template v-else>
        <span class="truncate text-[12px] text-white">{{ selectedOption ? selectedOption.label : placeholder }}</span>
      </template>
      <i class="fas fa-chevron-down text-xs text-white" />
    </div>

    <ul
      v-if="isOpen"
      class="fixed z-50 max-h-64 w-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.45)]"
      :style="dropdownStyle"
      @click.stop
    >
      <li
        v-for="opt in options"
        :key="String(opt.value)"
        :class="[
          'flex cursor-pointer items-center border-l-4 px-4 py-3 transition-all duration-200',
          opt.value === value
            ? 'border-blue-500 bg-blue-50 font-semibold text-blue-700 dark:border-[var(--label-accent)] dark:bg-[var(--surface-muted)] dark:text-[var(--label-accent)]'
            : 'border-transparent hover:border-blue-400 hover:bg-blue-50 dark:border-transparent dark:hover:border-[var(--label-accent)] dark:hover:bg-[var(--surface-muted)]'
        ]"
        @click.stop="selectValue(opt.value)"
      >
        <i
          v-if="opt.icon"
          :class="opt.icon"
          class="mr-3 flex-shrink-0 text-gray-500 dark:text-[var(--text-secondary)]"
        />
        <div
          :class="[
            'mr-3 h-3 w-3 flex-shrink-0 rounded-full',
            opt.value === value ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-[var(--label-accent)] dark:ring-offset-[var(--surface-muted)]' : ''
          ]"
          :style="{ backgroundColor: opt.color || 'transparent' }"
        />
        <span
          :class="[
            'text-sm font-medium',
            opt.value === value ? 'text-blue-700 dark:text-[var(--label-accent)]' : 'text-gray-700 dark:text-[var(--text-primary)]'
          ]"
        >
          {{ opt.label }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
    props: {
        value: {
            type: Boolean,
            default: false
        },
        options: {
            type: Array,
            required: true
        },
        onChange: {
            type: Function,
            default: null
        },
        placeholder: {
            type: String,
            default: ''
        },
        disabled: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            isOpen: false,
            dropdownStyle: {}
        };
    },
    computed: {
        selectedOption() {
            return (this.options || []).find(o => o.value === this.value) || null;
        },
        selectedStyle() {
            const color = this.selectedOption?.color || '#3571A4';
            const opacity = this.disabled ? 0.6 : 1;

            return {
                backgroundColor: color,
                opacity: opacity
            };
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
            if (this.disabled) return;

            this.isOpen = !this.isOpen;
            if (!this.isOpen) return;

            this.$nextTick(() => {
                const rect = this.$refs.dropdownRef?.getBoundingClientRect?.();
                if (!rect) return;

                this.dropdownStyle = {
                    top: `${rect.bottom + 8}px`,
                    left: `${rect.left}px`
                };
            });
        },
        selectValue(newValue) {
            this.isOpen = false;
            this.onChange?.(newValue);
        },
        handleClickOutside(e) {
            if (this.$refs.dropdownRef && !this.$refs.dropdownRef.contains(e.target)) {
                this.isOpen = false;
            }
        }
    }
};
</script>


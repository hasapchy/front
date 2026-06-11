<template>
  <div class="space-y-3">
    <div>
      <label class="filters-modal-label">{{ $t('filterPresetIcon') }}</label>
      <div class="grid max-h-32 grid-cols-6 gap-2 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-[var(--border-subtle)]">
        <button
          v-for="item in icons"
          :key="item.value"
          type="button"
          class="flex h-9 items-center justify-center rounded-md border transition-colors"
          :class="icon === item.value
            ? 'border-gray-900 bg-gray-50 dark:border-white dark:bg-[var(--surface-muted)]'
            : 'border-transparent hover:border-gray-200 hover:bg-gray-50 dark:hover:border-[var(--border-subtle)] dark:hover:bg-[var(--surface-muted)]'"
          @click="$emit('update:icon', item.value)"
        >
          <span class="filter-modal-icon-badge">
            <i
              :class="item.value"
              :style="{ color }"
            />
          </span>
        </button>
      </div>
    </div>
    <div>
      <label class="filters-modal-label">{{ $t('filterPresetColor') }}</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="presetColor in colors"
          :key="presetColor"
          type="button"
          class="relative h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
          :class="color === presetColor ? 'border-gray-900 dark:border-white' : 'border-transparent'"
          :style="{ backgroundColor: presetColor }"
          @click="$emit('update:color', presetColor)"
        >
          <i
            v-if="color === presetColor"
            class="fas fa-check absolute inset-0 m-auto h-3 w-3 text-[10px] text-white drop-shadow"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FilterPresetAppearancePicker',
  props: {
    icon: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '',
    },
    icons: {
      type: Array,
      default: () => [],
    },
    colors: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update:icon', 'update:color'],
};
</script>

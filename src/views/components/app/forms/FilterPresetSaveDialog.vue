<template>
  <CenteredModalDialog
    :show-form="visible"
    :title="title || $t('saveFilterPreset')"
    overlay-class="z-[130]"
    panel-class="max-w-md"
    :onclose="handleClose"
  >
    <div class="space-y-4">
      <input
        :value="name"
        class="w-full rounded border border-gray-300 px-3 py-2 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]"
        :placeholder="$t('filterPresetName')"
        @input="$emit('update:name', $event.target.value)"
        @keyup.enter="$emit('save')"
      >
      <FilterPresetAppearancePicker
        v-if="appearanceIcons.length && appearanceColors.length"
        :icon="icon"
        :color="color"
        :icons="appearanceIcons"
        :colors="appearanceColors"
        @update:icon="$emit('update:icon', $event)"
        @update:color="$emit('update:color', $event)"
      />
    </div>
    <div class="mt-4 flex gap-2">
      <button
        type="button"
        class="flex-1 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium dark:bg-[var(--surface-muted)]"
        @click="handleClose"
      >
        {{ $t('cancel') }}
      </button>
      <button
        type="button"
        class="flex-1 rounded-md bg-gradient-to-r from-[var(--color-success)] to-[var(--color-success-hover)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        :disabled="saving || !name.trim() || !icon || !color"
        @click="$emit('save')"
      >
        {{ $t('save') }}
      </button>
    </div>
  </CenteredModalDialog>
</template>

<script>
import CenteredModalDialog from '@/views/components/app/dialog/CenteredModalDialog.vue';
import FilterPresetAppearancePicker from '@/views/components/app/forms/FilterPresetAppearancePicker.vue';

export default {
  name: 'FilterPresetSaveDialog',
  components: { CenteredModalDialog, FilterPresetAppearancePicker },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '',
    },
    appearanceIcons: {
      type: Array,
      default: () => [],
    },
    appearanceColors: {
      type: Array,
      default: () => [],
    },
    saving: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: '',
    },
  },
  emits: ['update:name', 'update:icon', 'update:color', 'save', 'close'],
  methods: {
    handleClose() {
      this.$emit('close');
    },
  },
};
</script>

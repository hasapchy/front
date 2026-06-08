<template>
  <teleport to="body">
    <div
      v-if="showForm"
      class="fixed inset-0 flex items-center justify-center bg-black/30 p-4"
      :class="overlayClass || 'z-[120]'"
      @mousedown="onclose"
    >
      <div
        class="w-full rounded-xl bg-white p-4 shadow-xl dark:border dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]"
        :class="panelClass || 'max-w-md'"
        role="dialog"
        aria-modal="true"
        :aria-label="title || undefined"
        @mousedown.stop
      >
        <div
          v-if="title"
          class="mb-3 text-base font-semibold text-gray-900 dark:text-[var(--text-primary)]"
        >
          {{ title }}
        </div>
        <slot />
        <div
          v-if="$slots.footer"
          class="mt-4 flex justify-end gap-2"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
export default {
  name: 'CenteredModalDialog',
  props: {
    showForm: {
      type: Boolean,
      default: false,
    },
    onclose: {
      type: Function,
      required: true,
    },
    title: {
      type: String,
      default: '',
    },
    panelClass: {
      type: String,
      default: '',
    },
    overlayClass: {
      type: String,
      default: '',
    },
  },
};
</script>

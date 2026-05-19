<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue ? 'true' : 'false'"
    :aria-label="ariaLabel"
    :disabled="disabled"
    class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--nav-accent)]/35 disabled:cursor-not-allowed disabled:opacity-50"
    :class="modelValue ? 'bg-[var(--label-accent)]' : 'bg-gray-300 dark:bg-[var(--border-subtle)]'"
    @click="onClick"
  >
    <span
      class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
      :class="modelValue ? 'translate-x-5' : 'translate-x-0'"
    />
  </button>
</template>

<script>
export default {
  name: 'ToggleSwitch',
  props: {
    modelValue: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    ariaLabel: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  methods: {
    onClick() {
      if (this.disabled) {
        return;
      }
      this.$emit('update:modelValue', !this.modelValue);
    },
  },
};
</script>

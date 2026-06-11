<template>
  <div class="filter-form-field">
    <label class="filter-form-field__label">
      <span
        v-if="icon"
        class="filter-modal-icon-badge"
        aria-hidden="true"
      >
        <i :class="icon" />
      </span>
      <span>{{ label }}</span>
    </label>
    <div class="filter-form-field__control">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'FilterFormField',
  props: {
    label: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: '',
    },
  },
};
</script>

<template>
  <div class="filter-form-field">
    <label class="filter-form-field__label">
      <i
        v-if="icon"
        :class="icon"
        class="filter-form-field__icon"
        aria-hidden="true"
      />
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

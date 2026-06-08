<template>
  <div
    class="app-form-field"
    :class="{ 'app-form-field--invalid': Boolean(error) }"
  >
    <label
      v-if="label"
      :for="fieldId || undefined"
      :class="{ required: required }"
    >
      {{ label }}
    </label>
    <slot />
    <p
      v-if="error"
      class="app-form-field__error"
      role="alert"
    >
      {{ error }}
    </p>
  </div>
</template>

<script>
export default {
  name: 'AppFormField',
  props: {
    label: {
      type: String,
      default: '',
    },
    required: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: '',
    },
    fieldId: {
      type: String,
      default: '',
    },
  },
};
</script>

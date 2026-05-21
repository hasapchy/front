<template>
  <div>
    <label
      v-if="showLabel"
      :class="['block', 'mb-1', { required: required }]"
    >{{ $t('icon') }}</label>
    <select
      :value="modelValue"
      class="w-full"
      :disabled="disabled"
      :required="required"
      @input="$emit('update:modelValue', $event.target.value)"
    >
      <option
        v-if="allowEmpty"
        value=""
      >
        {{ $t('no') }}
      </option>
      <option
        v-for="opt in resolvedOptions"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>

<script>
import { getIconOptionsForPreset } from '@/constants/iconFormPresets';

export default {
  name: 'IconSelectField',
  props: {
    modelValue: { type: String, default: '' },
    preset: { type: String, required: true },
    showLabel: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
    allowEmpty: { type: Boolean, default: true },
    required: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  computed: {
    resolvedOptions() {
      return getIconOptionsForPreset(this.preset);
    },
  },
};
</script>

<template>
  <input
    type="number"
    :value="displayValue"
    :step="resolvedStep"
    :min="minAttr"
    :max="maxAttr"
    :required="required ? true : undefined"
    :disabled="disabled ? true : undefined"
    :placeholder="placeholderAttr"
    @focus="onFocus"
    @input="onInput"
    @blur="onBlur"
  >
</template>

<script>
import {
  formatNumberWithRounding,
  formatQuantity,
  roundValue,
  roundQuantityValue,
  getStepForDecimals,
} from '@/utils/numberUtils';

export default {
  name: 'FormattedDecimalInput',
  props: {
    modelValue: { type: [Number, String, null], default: null },
    variant: {
      type: String,
      default: 'amount',
      validator: (v) => ['amount', 'quantity'].includes(v),
    },
    step: { type: [String, Number], default: undefined },
    min: { type: [String, Number], default: undefined },
    max: { type: [String, Number], default: undefined },
    required: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    placeholder: { type: [String, Number], default: undefined },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      focused: false,
      local: '',
    };
  },
  computed: {
    resolvedStep() {
      if (this.step !== undefined && this.step !== null && this.step !== '') {
        return this.step;
      }
      if (this.variant === 'quantity') {
        return getStepForDecimals(this.$store.getters.roundingQuantityDecimals);
      }
      return getStepForDecimals(this.$store.getters.roundingDecimals);
    },
    blurFormatted() {
      const raw = this.modelValue;
      const base = raw === null || raw === undefined || raw === '' ? 0 : parseFloat(raw);
      const n = Number.isFinite(base) ? base : 0;
      if (this.variant === 'quantity') {
        return formatQuantity(n);
      }
      return formatNumberWithRounding(n, true).replace(/\s/g, '');
    },
    displayValue() {
      return this.focused ? this.local : this.blurFormatted;
    },
    minAttr() {
      return this.min === undefined || this.min === '' ? undefined : this.min;
    },
    maxAttr() {
      return this.max === undefined || this.max === '' ? undefined : this.max;
    },
    placeholderAttr() {
      return this.placeholder === undefined || this.placeholder === '' ? undefined : String(this.placeholder);
    },
  },
  methods: {
    onFocus() {
      this.focused = true;
      this.local = this.blurFormatted;
    },
    onInput(e) {
      const raw = e.target.value;
      this.local = raw;
      const normalized = String(raw).replace(/\s/g, '').replace(',', '.');
      const n = parseFloat(normalized);
      this.$emit('update:modelValue', Number.isFinite(n) ? n : 0);
    },
    onBlur() {
      const normalized = String(this.local).replace(/\s/g, '').replace(',', '.');
      let n = parseFloat(normalized);
      if (!Number.isFinite(n)) {
        n = 0;
      }
      if (this.variant === 'quantity') {
        n = roundQuantityValue(n);
      } else {
        n = roundValue(n);
      }
      this.$emit('update:modelValue', n);
      this.focused = false;
      this.local = '';
    },
  },
};
</script>

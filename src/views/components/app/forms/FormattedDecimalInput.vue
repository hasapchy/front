<template>
  <input
    type="text"
    inputmode="decimal"
    :value="displayValue"
    :required="required || undefined"
    :disabled="disabled || undefined"
    :placeholder="placeholderAttr"
    @focus="onFocus"
    @input="onInput"
    @blur="onBlur"
  >
</template>

<script>
import {
  formatNumberForInput,
  getAmountDisplayDecimals,
  parseDecimalInput,
  roundQuantityValue,
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
    min: { type: [String, Number], default: undefined },
    max: { type: [String, Number], default: undefined },
    required: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    placeholder: { type: [String, Number], default: undefined },
    amountRoundingScope: {
      type: String,
      default: 'default',
      validator: (v) => ['default', 'order', 'contract', 'warehouse'].includes(v),
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      focused: false,
      local: '',
    };
  },
  computed: {
    decimals() {
      if (this.variant === 'quantity') {
        return this.$store.getters.roundingQuantityDecimals;
      }
      return getAmountDisplayDecimals();
    },
    formatted() {
      return formatNumberForInput(this.modelValue, this.decimals);
    },
    displayValue() {
      return this.focused ? this.local : this.formatted;
    },
    placeholderAttr() {
      return this.placeholder === undefined || this.placeholder === '' ? undefined : String(this.placeholder);
    },
  },
  methods: {
    clamp(n) {
      const min = this.min === undefined || this.min === '' ? null : parseFloat(this.min);
      const max = this.max === undefined || this.max === '' ? null : parseFloat(this.max);
      if (Number.isFinite(min) && n < min) {
        return min;
      }
      if (Number.isFinite(max) && n > max) {
        return max;
      }
      return n;
    },
    onFocus() {
      this.focused = true;
      this.local = this.formatted;
    },
    onInput(e) {
      this.local = e.target.value;
      const n = parseDecimalInput(e.target.value);
      if (n === null) {
        return;
      }
      this.$emit('update:modelValue', n);
    },
    onBlur() {
      const parsed = parseDecimalInput(this.local);
      if (parsed === null) {
        this.focused = false;
        this.local = '';
        return;
      }
      const value = this.variant === 'quantity' ? roundQuantityValue(parsed) : parsed;
      const n = this.clamp(value);
      this.$emit('update:modelValue', Number(n));
      this.focused = false;
      this.local = '';
    },
  },
};
</script>

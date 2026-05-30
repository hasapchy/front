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
  getAmountInputDecimalsForScope,
  isAmountRoundingEnabledForScope,
  parseDecimalInput,
  roundQuantityValue,
  roundDocumentTotalForScope,
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
    effectiveAmountRoundingScope() {
      if (this.variant === 'quantity' || this.amountRoundingScope === 'contract') {
        return this.amountRoundingScope;
      }
      return 'default';
    },
    decimals() {
      if (this.variant === 'quantity') {
        return this.$store.getters.roundingQuantityDecimals;
      }
      if (this.isModuleLineAmount) {
        return getAmountDisplayDecimals();
      }
      return getAmountInputDecimalsForScope(this.effectiveAmountRoundingScope);
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
    isModuleLineAmount() {
      return this.variant === 'amount'
        && (this.amountRoundingScope === 'warehouse' || this.amountRoundingScope === 'order');
    },
  },
  methods: {
    round(n) {
      if (this.variant === 'quantity') {
        return roundQuantityValue(n);
      }
      if (this.isModuleLineAmount) {
        return n;
      }
      if (!isAmountRoundingEnabledForScope(this.effectiveAmountRoundingScope)) {
        return n;
      }
      return roundDocumentTotalForScope(n, this.effectiveAmountRoundingScope);
    },
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
      const n = this.clamp(this.round(parsed));
      this.$emit('update:modelValue', Number(n));
      this.focused = false;
      this.local = '';
    },
  },
};
</script>

<template>
  <FormattedDecimalInput
    :model-value="value"
    variant="quantity"
    :disabled="disabled"
    @update:modelValue="onUpdate"
  />
</template>

<script>
import FormattedDecimalInput from '@/views/components/app/forms/FormattedDecimalInput.vue';

export default {
  name: 'InventoryActualQuantityCell',
  components: { FormattedDecimalInput },
  props: {
    value: {
      type: [Number, String],
      default: 0,
    },
    onChange: {
      type: Function,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    onUpdate(nextValue) {
      if (this.disabled) {
        return;
      }
      this.onChange(nextValue);
    },
  },
};
</script>

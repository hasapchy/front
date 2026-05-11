<template>
  <select
    class="w-full min-w-[130px] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-[#3571A4] focus:outline-none dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]"
    :value="value"
    :disabled="disabled"
    @click.stop
    @mousedown.stop
    @change="handleChange"
  >
    <option
      v-for="option in options"
      :key="option.value"
      :value="option.value"
    >
      {{ option.label }}
    </option>
  </select>
</template>

<script>
export default {
    name: 'WarehouseStatusSelectCell',
    props: {
        value: {
            type: [String, Number],
            default: '',
        },
        options: {
            type: Array,
            required: true,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        onChange: {
            type: Function,
            default: null,
        },
    },
    methods: {
        handleChange(event) {
            this.onChange?.(event.target.value);
        },
    },
};
</script>

<template>
  <span v-if="!options || options.length === 0">—</span>
  <span
    v-else-if="plainWhenSingle && options.length === 1"
    class="text-xs"
  >{{ options[0].label }}</span>
  <select
    v-else
    class="max-w-[240px] text-xs border rounded px-1 py-0.5"
    :value="selectedValue === null || selectedValue === undefined ? '' : String(selectedValue)"
    :disabled="disabled"
    @change="handleChange"
  >
    <option
      v-for="o in options"
      :key="o.value"
      :value="String(o.value)"
    >
      {{ o.label }}
    </option>
  </select>
</template>

<script>
export default {
    name: 'SalaryPreviewSelectCell',
    props: {
        selectedValue: {
            type: [Number, String],
            default: null
        },
        options: {
            type: Array,
            default: () => []
        },
        disabled: {
            type: Boolean,
            default: false
        },
        plainWhenSingle: {
            type: Boolean,
            default: false
        },
        onSelect: {
            type: Function,
            required: true
        }
    },
    methods: {
        handleChange(e) {
            const raw = e.target.value;
            const v = raw === '' ? null : Number(raw);
            this.onSelect(v);
        }
    }
};
</script>

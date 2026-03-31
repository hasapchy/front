<template>
  <span v-if="!options || options.length === 0">—</span>
  <span
    v-else-if="plainWhenSingle && options.length === 1"
    class="inline-flex items-center gap-1 text-xs min-w-0"
  >
    <span class="truncate">{{ options[0].label }}</span>
    <i
      v-if="options[0].isDefault"
      class="fas fa-star text-amber-500 text-[10px] shrink-0"
      aria-hidden="true"
    />
  </span>
  <span
    v-else
    class="inline-flex items-center gap-1 min-w-0"
  >
    <select
      class="max-w-[220px] text-xs border rounded px-1 py-0.5 shrink min-w-0"
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
    <i
      v-if="selectedOptionIsDefault"
      class="fas fa-star text-amber-500 text-[10px] shrink-0"
      :title="$t('setAsDefault')"
      aria-hidden="true"
    />
  </span>
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
    computed: {
        selectedOptionIsDefault() {
            if (this.selectedValue == null || !this.options?.length) {
                return false;
            }
            const v = Number(this.selectedValue);
            const o = this.options.find((x) => Number(x.value) === v);
            return !!(o && o.isDefault);
        },
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

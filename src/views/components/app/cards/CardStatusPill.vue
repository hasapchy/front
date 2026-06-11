<template>
  <div
    v-if="hasValue"
    class="card-status-pill"
    @dblclick.stop
  >
    <StatusSelectCell
      v-if="interactive"
      :value="statusValue"
      :statuses="statuses"
      :on-change="onStatusChange"
      show-trigger-label
      dense
      :plain-names="plainNames"
      :disabled="disabled"
      :placeholder="label"
    />
    <span
      v-else
      class="card-status-pill__static"
      :style="staticStyle"
    >
      <i
        v-if="iconClass"
        :class="iconClass"
        class="card-status-pill__icon"
      />
      <span class="card-status-pill__label">{{ label }}</span>
      <i
        v-if="showChevron"
        class="fas fa-chevron-down card-status-pill__chevron"
      />
    </span>
  </div>
</template>

<script>
import StatusSelectCell from '@/views/components/app/buttons/StatusSelectCell.vue';

export default {
    name: 'CardStatusPill',
    components: { StatusSelectCell },
    props: {
        label: {
            type: String,
            default: '',
        },
        color: {
            type: String,
            default: '',
        },
        iconClass: {
            type: String,
            default: '',
        },
        showChevron: {
            type: Boolean,
            default: false,
        },
        statusValue: {
            type: [String, Number, Boolean],
            default: null,
        },
        statuses: {
            type: Array,
            default: () => [],
        },
        onChange: {
            type: Function,
            default: null,
        },
        plainNames: {
            type: Boolean,
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        hasValue() {
            return Boolean(this.label);
        },
        interactive() {
            return Boolean(this.onChange && this.statuses?.length);
        },
        staticStyle() {
            const accent = this.color || 'var(--nav-accent)';
            return {
                '--card-status-accent': accent,
                backgroundColor: `color-mix(in srgb, ${accent} 18%, transparent)`,
                color: accent,
            };
        },
    },
    methods: {
        onStatusChange(newValue) {
            if (this.onChange) {
                this.onChange(newValue);
            }
        },
    },
};
</script>

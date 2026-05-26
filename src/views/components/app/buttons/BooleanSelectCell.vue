<template>
  <StatusSelectCell
    :value="value"
    :statuses="options"
    :on-change="onChange"
    :placeholder="placeholder"
    :disabled="disabled"
    plain-names
  />
</template>

<script>
import StatusSelectCell from '@/views/components/app/buttons/StatusSelectCell.vue';

export default {
    components: { StatusSelectCell },
    props: {
        value: {
            type: [Boolean, String, Number],
            default: false,
        },
        options: {
            type: Array,
            required: true,
        },
        onChange: {
            type: Function,
            default: null,
        },
        placeholder: {
            type: String,
            default: '',
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    },
};
</script>

<template>
  <button
    type="button"
    class="text-xs text-left underline cursor-pointer bg-transparent border-0 p-0 text-[#337AB7]"
    style="font: inherit"
    @click.stop="onOpen"
  >
    {{ displayText }}
  </button>
</template>

<script>
export default {
    name: 'SalaryPreviewNormCell',
    props: {
        norm: {
            type: [Number, String],
            default: null,
        },
        onOpen: {
            type: Function,
            required: true,
        },
    },
    computed: {
        displayText() {
            const v = this.norm;
            if (v == null || v === '') {
                return '—';
            }
            return String(v);
        },
    },
};
</script>

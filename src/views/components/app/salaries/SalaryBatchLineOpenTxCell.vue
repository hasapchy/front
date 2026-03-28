<template>
  <button
    v-if="transactionId"
    type="button"
    class="text-[#337AB7] hover:underline text-xs"
    @click.stop="onOpen(Number(transactionId))"
  >
    {{ $t('salaryPreviewOpenTx') }}
  </button>
  <span
    v-else
    class="text-gray-400 text-xs"
  >—</span>
</template>

<script>
export default {
    name: 'SalaryBatchLineOpenTxCell',
    props: {
        transactionId: { type: [Number, String], default: null },
        onOpen: { type: Function, required: true },
    },
};
</script>

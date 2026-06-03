<template>
  <div
    v-if="isFieldVisible('source') && sourceType !== 'contract'"
    class="mt-2"
  >
    <template v-if="resolvedSourceId">
      <label class="block mb-1">{{ $t('source') }}</label>
      <div class="rounded border border-gray-200 bg-white p-3 dark:border-[var(--border-subtle)] dark:bg-[var(--input-bg)]">
        <div class="text-sm text-gray-900 dark:text-[var(--text-primary)]">
          <span class="font-semibold">Тип:</span> {{ sourceTypeLabel }}
        </div>
        <div class="mt-1 text-sm text-gray-900 dark:text-[var(--text-primary)]">
          <span class="font-semibold">ID:</span> {{ `#${resolvedSourceId}` }}
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import transactionFormConfigMixin from '@/mixins/transactionFormConfigMixin';
import { getSourceKind, getSourceKindLabel } from '@/utils/transactionSourceUtils';

export default {
    name: 'TransactionSourceSection',
    mixins: [transactionFormConfigMixin],
    props: {
        orderId: { type: [String, Number], default: null },
        contractId: { type: [String, Number], default: null },
        warehouseReceiptId: { type: [String, Number], default: null },
        warehousePurchaseId: { type: [String, Number], default: null },
        selectedSource: { type: Object, default: null },
        sourceType: { type: String, default: '' },
        formConfig: { type: Object, default: () => ({}) },
    },
    computed: {
        resolvedSourceId() {
            return this.selectedSource?.id || this.orderId || this.contractId || this.warehouseReceiptId || this.warehousePurchaseId || null;
        },
        sourceTypeLabel() {
            if (this.orderId) return getSourceKindLabel(this.$t.bind(this), 'order');
            if (this.contractId) return getSourceKindLabel(this.$t.bind(this), 'contract');
            if (this.warehouseReceiptId) return getSourceKindLabel(this.$t.bind(this), 'receipt');
            if (this.warehousePurchaseId) return getSourceKindLabel(this.$t.bind(this), 'purchase');
            if (!this.sourceType) return this.$t('source');
            return getSourceKindLabel(this.$t.bind(this), getSourceKind(this.sourceType, ''));
        },
    },
}
</script>


<template>
  <div
    v-if="isFieldVisible('source') && sourceType !== 'contract'"
    class="mt-2"
  >
    <template v-if="orderId || contractId || warehouseReceiptId || warehousePurchaseId || selectedSource">
      <label class="block mb-1">{{ $t('source') }}</label>
      <div class="rounded border border-gray-200 bg-white p-3 dark:border-[var(--border-subtle)] dark:bg-[var(--input-bg)]">
        <div class="text-sm text-gray-900 dark:text-[var(--text-primary)]">
          <span class="font-semibold">Тип:</span> {{ displaySourceTypeLabel() }}
        </div>
        <div class="mt-1 text-sm text-gray-900 dark:text-[var(--text-primary)]">
          <span class="font-semibold">ID:</span> {{ `#${selectedSource?.id || orderId || contractId || warehouseReceiptId || warehousePurchaseId}` }}
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
    created() {
        void this.formConfig;
    },
    methods: {
        displaySourceTypeLabel() {
            if (this.orderId) return 'Заказ';
            if (this.contractId) return this.$t('contract');
            if (this.warehouseReceiptId) return this.$t('receipt');
            if (this.warehousePurchaseId) return this.$t('purchases');
            if (!this.sourceType) return this.$t('source');
            const kind = getSourceKind(this.sourceType, '');
            return getSourceKindLabel(this.$t.bind(this), kind);
        },
    }
}
</script>


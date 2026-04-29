<template>
  <div
    v-if="isFieldVisible('source') && sourceType !== 'contract'"
    class="mt-2"
  >
    <template v-if="orderId || contractId || selectedSource">
      <label class="block mb-1">{{ $t('source') }}</label>
      <div class="rounded border border-gray-200 bg-white p-3 dark:border-[var(--border-subtle)] dark:bg-[var(--input-bg)]">
        <div class="text-sm text-gray-900 dark:text-[var(--text-primary)]">
          <span class="font-semibold">Тип:</span> {{ displaySourceTypeLabel() }}
        </div>
        <div class="mt-1 text-sm text-gray-900 dark:text-[var(--text-primary)]">
          <span class="font-semibold">ID:</span> {{ `#${selectedSource?.id || orderId || contractId}` }}
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import transactionFormConfigMixin from '@/mixins/transactionFormConfigMixin';

export default {
    name: 'TransactionSourceSection',
    mixins: [transactionFormConfigMixin],
    props: {
        orderId: { type: [String, Number], default: null },
        contractId: { type: [String, Number], default: null },
        selectedSource: { type: Object, default: null },
        sourceType: { type: String, default: '' },
        formConfig: { type: Object, default: () => ({}) },
    },
    methods: {
        displaySourceTypeLabel() {
            if (this.orderId) return 'Заказ';
            if (this.contractId) return this.$t('contract');
            if (this.sourceType) {
                if (this.sourceType.includes('Order')) return 'Заказ';
                if (this.sourceType.includes('Sale')) return 'Продажа';
                if (this.sourceType.includes('WhReceipt') || this.sourceType.includes('WarehouseReceipt')) return 'Оприходование';
                if (this.sourceType.includes('EmployeeSalary')) return 'Зарплата';
                if (this.sourceType.includes('ProjectContract')) return this.$t('contract');
            }
            const labelMap = {
                'order': 'Заказ',
                'sale': 'Продажа',
                'warehouse_receipt': 'Оприходование',
                'salary': 'Зарплата',
                'contract': this.$t('contract')
            };
            return labelMap[this.sourceType] || this.$t('source');
        },
    }
}
</script>


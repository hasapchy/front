<template>
    <div class="mt-2" v-if="isFieldVisible('source') && sourceType !== 'contract'">
        <template v-if="orderId || selectedSource">
            <label class="block mb-1">{{ $t('source') || 'Источник' }}</label>
            <div class="p-3 border rounded bg-white">
                <div class="text-sm"><span class="font-semibold">Тип:</span> {{ displaySourceTypeLabel() }}</div>
                <div class="text-sm mt-1"><span class="font-semibold">ID:</span> {{ `#${selectedSource?.id || orderId}` }}</div>
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
        selectedSource: { type: Object, default: null },
        sourceType: { type: String, default: '' },
        formConfig: { type: Object, default: () => ({}) },
    },
    methods: {
        displaySourceTypeLabel() {
            if (this.orderId) return 'Заказ';
            if (this.sourceType) {
                if (this.sourceType.includes('Order')) return 'Заказ';
                if (this.sourceType.includes('Sale')) return 'Продажа';
                if (this.sourceType.includes('WhReceipt') || this.sourceType.includes('WarehouseReceipt')) return 'Оприходование';
                if (this.sourceType.includes('EmployeeSalary')) return 'Зарплата';
                if (this.sourceType.includes('ProjectContract')) return this.$t('contract') || 'Контракт';
            }
            const labelMap = {
                'order': 'Заказ',
                'sale': 'Продажа',
                'warehouse_receipt': 'Оприходование',
                'salary': 'Зарплата',
                'contract': this.$t('contract') || 'Контракт'
            };
            return labelMap[this.sourceType] || (this.$t('source') || 'Источник');
        },
    }
}
</script>


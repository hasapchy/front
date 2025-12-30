<template>
    <div v-if="showPreview" class="mt-1 text-sm text-gray-600 flex items-center gap-2">
        <span>{{ balanceAfterAdjustmentLabel }}:</span>
        <span class="font-semibold text-sm" :class="balanceAfterAdjustmentClass">
            {{ balanceAfterAdjustmentFormatted }} {{ defaultCurrencySymbol }}
            <span v-if="balanceAfterAdjustmentStateText">
                ({{ balanceAfterAdjustmentStateText }})
            </span>
        </span>
    </div>
</template>

<script>
export default {
    name: 'TransactionBalancePreview',
    props: {
        showPreview: { type: Boolean, default: false },
        currentClientBalance: { type: [Number, String, null], default: null },
        type: { type: String, required: true },
        origAmount: { type: [Number, String], required: true },
        defaultCurrencySymbol: { type: String, default: '' },
    },
    computed: {
        balanceAfterAdjustmentValue() {
            if (!this.showPreview) {
                return null;
            }
            const base = parseFloat(this.currentClientBalance) || 0;
            const delta = parseFloat(this.origAmount) || 0;
            const sign = this.type === 'income' ? 1 : -1;
            return base + sign * delta;
        },
        balanceAfterAdjustmentLabel() {
            if (!this.showPreview) {
                return '';
            }
            return this.$t('balanceAfterOperation') !== 'balanceAfterOperation'
                ? this.$t('balanceAfterOperation')
                : 'Баланс после операции';
        },
        balanceAfterAdjustmentFormatted() {
            if (!this.showPreview) {
                return '';
            }
            return this.$formatNumber
                ? this.$formatNumber(this.balanceAfterAdjustmentValue, null, true)
                : this.balanceAfterAdjustmentValue;
        },
        balanceAfterAdjustmentClass() {
            const value = this.balanceAfterAdjustmentValue || 0;
            if (value > 0) {
                return 'text-[#5CB85C]';
            }
            if (value < 0) {
                return 'text-[#EE4F47]';
            }
            return 'text-[#337AB7]';
        },
        balanceAfterAdjustmentStateText() {
            const value = this.balanceAfterAdjustmentValue || 0;
            if (value > 0) {
                return this.$t('clientOwesUs');
            }
            if (value < 0) {
                return this.$t('weOweClient');
            }
            return this.$t('mutualSettlement');
        }
    }
}
</script>


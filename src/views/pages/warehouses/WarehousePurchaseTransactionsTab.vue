<template>
  <div>
    <DraggableTable
      table-key="warehouse.purchase.transactions"
      :columns-config="columnsConfig"
      :table-data="transactions || []"
      :item-mapper="itemMapper"
      :on-item-click="() => {}"
    >
      <template #tableSettingsAdditional>
        <PrimaryButton
          icon="fas fa-plus"
          :onclick="openPayModal"
          :is-small="true"
          :disabled="!canPay"
          :aria-label="$t('payForGoods')"
        />
      </template>
    </DraggableTable>

    <SideModalDialog
      :show-form="payModal"
      :title="$t('payForGoods')"
      :onclose="closePayModal"
      :level="3"
    >
      <div
        v-if="payModal"
        class="p-4 space-y-3"
      >
        <div>
          <label class="block mb-1 required">{{ $t('amount') }}</label>
          <input
            v-model.number="payment.amount"
            type="number"
            min="0"
            step="0.00001"
          >
        </div>
        <div>
          <label class="block mb-1 required">{{ $t('cashRegister') }}</label>
          <select v-model="payment.cashId">
            <option value="">{{ $t('no') }}</option>
            <option
              v-for="cash in cashRegistersForSelect"
              :key="cash.id"
              :value="cash.id"
            >
              {{ cash.displayName || cash.name }} ({{ cash.currencySymbol }})
            </option>
          </select>
        </div>
        <div>
          <label class="block mb-1 required">{{ $t('currency') }}</label>
          <select
            v-model="payment.currencyId"
            :disabled="balanceLocksCurrencyCash"
          >
            <option value="">{{ $t('no') }}</option>
            <option
              v-for="currency in currencies"
              :key="currency.id"
              :value="currency.id"
            >
              {{ currency.name }} ({{ currency.symbol }})
            </option>
          </select>
        </div>
        <div class="flex justify-end">
          <PrimaryButton
            icon="fas fa-money-bill-wave"
            :onclick="submitPayment"
            :disabled="!canPay"
          >
            {{ $t('payForGoods') }}
          </PrimaryButton>
        </div>
      </div>
    </SideModalDialog>
  </div>
</template>

<script>
import WarehousePurchaseController from '@/api/WarehousePurchaseController';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import { formatDatabaseDateTime } from '@/utils/dateUtils';

export default {
    components: {
        DraggableTable,
        PrimaryButton,
        SideModalDialog,
    },
    props: {
        purchaseId: { type: [Number, String], default: null },
        canPay: { type: Boolean, default: false },
        transactions: { type: Array, default: () => [] },
        cashRegistersForSelect: { type: Array, default: () => [] },
        currencies: { type: Array, default: () => [] },
        defaultCashId: { type: [Number, String, null], default: null },
        defaultCurrencyId: { type: [Number, String, null], default: null },
        balanceLocksCurrencyCash: { type: Boolean, default: false },
    },
    emits: ['purchase-refreshed', 'error'],
    data() {
        return {
            payModal: false,
            payment: {
                amount: null,
                cashId: this.defaultCashId || null,
                currencyId: this.defaultCurrencyId || null,
            },
        };
    },
    computed: {
        columnsConfig() {
            return [
                { name: 'id', label: this.$t('number'), size: 60 },
                { name: 'amount', label: this.$t('amount') },
                { name: 'cash', label: this.$t('cashRegister') },
                { name: 'dateUser', label: this.$t('dateUser') },
            ];
        },
    },
    watch: {
        defaultCashId(newValue) {
            if (!this.payment.cashId && newValue) {
                this.payment.cashId = newValue;
            }
        },
        defaultCurrencyId(newValue) {
            if (!this.payment.currencyId && newValue) {
                this.payment.currencyId = newValue;
            }
        },
    },
    methods: {
        openPayModal() {
            this.payment.cashId = this.payment.cashId || this.defaultCashId || null;
            this.payment.currencyId = this.payment.currencyId || this.defaultCurrencyId || null;
            this.payModal = true;
        },
        closePayModal() {
            this.payModal = false;
        },
        itemMapper(item, column) {
            switch (column) {
                case 'amount':
                    return item?.orig_amount ?? '-';
                case 'cash':
                    return item?.cash_register?.name || item?.cashName || '-';
                case 'dateUser': {
                    const date = item?.date ? formatDatabaseDateTime(item.date) : '-';
                    return `${date} / ${item?.creator?.name || '-'}`;
                }
                default:
                    return item?.[column] ?? '-';
            }
        },
        async submitPayment() {
            if (!this.canPay || !this.purchaseId || !this.payment.amount || !this.payment.cashId) {
                return;
            }
            try {
                await WarehousePurchaseController.pay(this.purchaseId, {
                    amount: this.payment.amount,
                    cashId: this.payment.cashId,
                    currencyId: this.payment.currencyId || this.defaultCurrencyId || null,
                });
                const fresh = await WarehousePurchaseController.getItem(this.purchaseId);
                this.payment.amount = null;
                this.payment.cashId = this.defaultCashId || null;
                this.payment.currencyId = this.defaultCurrencyId || null;
                this.payModal = false;
                this.$emit('purchase-refreshed', fresh);
            } catch (error) {
                this.$emit('error', error);
            }
        },
    },
};
</script>

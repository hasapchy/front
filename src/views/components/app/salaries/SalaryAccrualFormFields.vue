<template>
  <div class="w-full mb-4">
    <div
      v-if="showAccrualMonth"
      class="mb-4"
    >
      <label class="required">{{ $t('salaryAccrualMonth') }}</label>
      <input
        :value="form.accrualMonth"
        type="month"
        required
        @input="patch({ accrualMonth: $event.target.value })"
      >
    </div>

    <div class="mb-4">
      <label class="required">{{ $t('salaryPaymentType') }}</label>
      <select
        :value="form.paymentType"
        required
        @change="patch({ paymentType: Number($event.target.value) })"
      >
        <option
          v-if="showPaymentType(0)"
          :value="0"
        >
          {{ $t('salaryPaymentTypeNonCash') }}
        </option>
        <option
          v-if="showPaymentType(1)"
          :value="1"
        >
          {{ $t('salaryPaymentTypeCash') }}
        </option>
      </select>
    </div>

    <div class="mb-4">
      <CashRegisterSelect
        :model-value="form.cashId"
        :cash-registers="cashRegistersForForm"
        :disabled="!form.companyId || loading || !cashRegistersForForm.length"
        :required="true"
        :placeholder="cashRegistersForForm.length ? $t('selectCashRegister') : $t('noCashRegistersForPaymentType')"
        @update:model-value="onCashIdUpdate"
      />
    </div>

    <div
      v-if="showPaymentDateField"
      class="mb-4"
    >
      <label class="required">{{ $t('date') }}</label>
      <input
        :value="form.date"
        type="datetime-local"
        step="60"
        required
        :disabled="loading"
        @input="patch({ date: $event.target.value })"
      >
    </div>
  </div>
</template>

<script>
import CashRegisterSelect from '@/views/components/app/forms/CashRegisterSelect.vue';
import { normalizeCashRegisterModelValue } from '@/utils/cashRegisterUtils';
import {
    canViewClientBalanceType,
    CLIENT_BALANCE_VIEW_OWN_PERM,
    CLIENT_BALANCE_VIEW_PERM,
} from '@/permissions/clientBalanceView';

export default {
    name: 'SalaryAccrualFormFields',
    components: { CashRegisterSelect },
    props: {
        form: {
            type: Object,
            required: true,
        },
        showAccrualMonth: {
            type: Boolean,
            default: false,
        },
        showPaymentDateField: {
            type: Boolean,
            default: false,
        },
        loading: {
            type: Boolean,
            default: false,
        },
        cashRegistersForForm: {
            type: Array,
            default: () => [],
        },
    },
    emits: ['patch-form'],
    methods: {
        patch(partial) {
            this.$emit('patch-form', partial);
        },
        onCashIdUpdate(value) {
            const normalized = normalizeCashRegisterModelValue(value);
            this.patch({ cashId: normalized === '' ? null : normalized });
        },
        showPaymentType(type) {
            const perms = this.$store.getters.permissions || [];
            if (!perms.includes(CLIENT_BALANCE_VIEW_PERM) && !perms.includes(CLIENT_BALANCE_VIEW_OWN_PERM)) {
                return true;
            }
            return canViewClientBalanceType(this.$store, type);
        },
    },
};
</script>

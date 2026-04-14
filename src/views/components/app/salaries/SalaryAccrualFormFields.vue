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
        <option :value="0">
          {{ $t('salaryPaymentTypeNonCash') }}
        </option>
        <option :value="1">
          {{ $t('salaryPaymentTypeCash') }}
        </option>
      </select>
    </div>

    <div class="mb-4">
      <label class="required">{{ $t('cashRegister') }}</label>
      <select
        :value="form.cashId"
        required
        :disabled="!form.companyId || loading || !cashRegistersForForm.length"
        @change="onCashChange($event)"
      >
        <option
          :value="null"
          disabled
        >
          {{ cashRegistersForForm.length ? $t('selectCashRegister') : $t('noCashRegistersForPaymentType') }}
        </option>
        <option
          v-for="cash in cashRegistersForForm"
          :key="cash.id"
          :value="cash.id"
        >
          {{ cash.displayName || cash.name }} {{ cash.currencySymbol ? `(${cash.currencySymbol})` : '' }}
        </option>
      </select>
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
export default {
    name: 'SalaryAccrualFormFields',
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
        onCashChange(ev) {
            const v = ev.target.value;
            const id = v === '' || v == null ? null : Number(v);
            this.patch({ cashId: Number.isNaN(id) ? null : id });
        },
    },
};
</script>

<template>
  <div>
    <ClientSearch
      v-if="isFieldVisible('client')"
      v-model:selected-client="localSelectedClient"
      :balance-id="selectedBalanceId"
      :show-label="true"
      :required="isDebt || isFieldRequired('client')"
      :disabled="isClientFieldDisabled"
      :allow-deselect="!initialProjectId"
      :client-type-filter="fieldConfig('client').clientTypeFilter"
      @balance-changed="onBalanceChanged"
    />
    <div
      v-if="shouldShowBalanceSelect"
      class="mt-2"
    >
      <label class="block mb-1 required">{{ $t('clientBalance') }}</label>
      <BalanceSelect
        :model-value="selectedBalanceId"
        :balances="clientBalances"
        :placeholder="$t('selectBalance')"
        :required="true"
        @update:model-value="handleBalanceSelectByValue"
      />
    </div>
    <div v-if="canShowDateField">
      <label>{{ $t('date') }}</label>
      <DatePickerField
        :model-value="date"
        type="datetime"
        :editing-item-id="editingItemId"
        :restrict-to-now="true"
        :clearable="false"
        class="w-full rounded"
        @update:model-value="$emit('update:date', $event)"
      />
    </div>
    <div
      v-if="isFieldVisible('type')"
      class="mt-2"
    >
      <label class="block mb-1 required">{{ $t('type') }}</label>
      <select
        :value="type"
        :disabled="!!editingItemId || !!orderId || !!contractId || fieldConfig('type').readonly || fieldConfig('type').enforcedValue !== undefined"
        required
        @input="$emit('update:type', $event.target.value)"
      >
        <option value="">
          {{ $t('selectType') }}
        </option>
        <option value="income">
          ✅ {{ $t('income') }}
        </option>
        <option value="outcome">
          🔺 {{ $t('outcome') }}
        </option>
      </select>
    </div>
    <div class="flex items-center space-x-2 mt-2">
      <div
        v-if="isFieldVisible('paymentType')"
        class="w-full"
      >
        <label class="block mb-1 required">{{ $t('salaryPaymentType') }}</label>
        <select
          :value="paymentType"
          :disabled="!!editingItemId"
          required
          @input="$emit('update:paymentType', Number($event.target.value))"
        >
          <option :value="0">
            {{ $t('salaryPaymentTypeNonCash') }}
          </option>
          <option :value="1">
            {{ $t('salaryPaymentTypeCash') }}
          </option>
        </select>
      </div>
      <div class="w-full">
        <label class="block mb-1 required">{{ $t('cashRegister') }}</label>
        <select
          :value="cashId"
          :disabled="!!editingItemId || currencyLockedByBalance"
          required
          @input="$emit('update:cashId', $event.target.value === '' ? '' : Number($event.target.value))"
        >
          <option value="">
            {{ $t('no') }}
          </option>
          <option
            v-for="parent in allCashRegisters"
            :key="parent.id"
            :value="parent.id"
          >
            {{ parent.displayName || parent.name }} ({{ parent.currencySymbol  }})
          </option>
        </select>
      </div>
    </div>
    <div
      v-if="isFieldVisible('debt')"
      class="mt-2"
    >
      <label class="inline-flex items-center">
        <input
          type="checkbox"
          :checked="isDebt"
          :disabled="!!editingItemId || !!orderId || !!contractId || fieldConfig('debt').readonly"
          @change="$emit('update:isDebt', $event.target.checked)"
        >
        <span class="ml-2">{{ $t('credit') }}</span>
      </label>
    </div>
    <div class="flex items-center space-x-2">
      <div class="w-full mt-2">
        <label class="required">{{ $t('amountBeforeConversion') }}</label>
        <FormattedDecimalInput
          :model-value="origAmount"
          variant="amount"
          required
          min="0.01"
          @update:model-value="$emit('update:origAmount', $event)"
        />
      </div>
      <div class="w-full mt-2">
        <label class="block mb-1 required">{{ $t('currency') }}</label>
        <select
          :value="currencyId"
          required
          :disabled="!!editingItemId || currencyLockedByBalance || !$store.getters.hasPermission('settings_currencies_view')"
          @input="$emit('update:currencyId', $event.target.value === '' ? '' : Number($event.target.value))"
        >
          <option value="">
            {{ $t('no') }}
          </option>
          <template v-if="currencies.length">
            <option
              v-for="parent in currencies"
              :key="parent.id"
              :value="parent.id"
            >
              {{ parent.symbol }} - {{ parent.name }}
            </option>
          </template>
        </select>
      </div>
    </div>
    <div
      v-if="isFieldVisible('category')"
      class="mt-2"
    >
      <label class="block mb-1 required">{{ $t('category') }}</label>
      <TransactionCategoryTreeSelect
        :model-value="categoryId"
        :categories="filteredCategories"
        :disabled="fieldConfig('category').readonly || fieldConfig('category').enforcedValue !== undefined || fieldConfig('category').enforcedByType"
        :disable-category="isCategoryDisabled"
        :required="true"
        @update:model-value="$emit('update:categoryId', $event)"
      />
    </div>
    <div
      v-if="isFieldVisible('project') && !initialProjectId"
      class="mt-2"
    >
      <label class="block mb-1">{{ $t('project') }}</label>
      <select
        :value="projectId"
        @input="$emit('update:projectId', $event.target.value)"
      >
        <option value="">
          {{ $t('no') }}
        </option>
        <template v-if="allProjects.length">
          <option
            v-for="parent in allProjects"
            :key="parent.id"
            :value="parent.id"
          >
            {{ parent.name }}
          </option>
        </template>
      </select>
    </div>
    <div class="mt-2">
      <label :class="['block', 'mb-1', { 'required': isFieldRequired('note') }]">{{ $t('note') }}</label>
      <textarea
        class="w-full min-h-[4rem] max-h-40 overflow-y-auto resize-y"
        rows="3"
        :value="note"
        @input="$emit('update:note', $event.target.value)"
      />
    </div>
  </div>
</template>

<script>
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import DatePickerField from '@/views/components/app/forms/DatePickerField.vue';
import BalanceSelect from '@/views/components/app/forms/BalanceSelect.vue';
import TransactionCategoryTreeSelect from '@/views/components/transactions/TransactionCategoryTreeSelect.vue';
import transactionFormConfigMixin from '@/mixins/transactionFormConfigMixin';

export default {
    name: 'TransactionFormFields',
    components: { ClientSearch, DatePickerField, BalanceSelect, TransactionCategoryTreeSelect },
    mixins: [transactionFormConfigMixin],
    props: {
        selectedClient: { type: Object, default: null },
        date: { type: String, required: true },
        type: { type: String, required: true },
        cashId: { type: [String, Number], required: true },
        isDebt: { type: Boolean, default: false },
        origAmount: { type: [Number, String], required: true },
        currencyId: { type: [String, Number], required: true },
        categoryId: { type: [String, Number], default: '' },
        projectId: { type: [String, Number], default: '' },
        note: { type: String, default: '' },
        editingItemId: { type: [String, Number], default: null },
        orderId: { type: [String, Number], default: null },
        contractId: { type: [String, Number], default: null },
        initialProjectId: { type: [String, Number], default: null },
        allCashRegisters: { type: Array, default: () => [] },
        currencies: { type: Array, default: () => [] },
        filteredCategories: { type: Array, default: () => [] },
        allProjects: { type: Array, default: () => [] },
        formConfig: { type: Object, default: () => ({}) },
        isCategoryDisabled: { type: Function, required: true },
        clientBalances: { type: Array, default: () => [] },
        selectedBalanceId: { type: [String, Number, null], default: null },
        paymentType: { type: Number, default: 1 },
        currencyLockedByBalance: { type: Boolean, default: false },
    },
    emits: [
        'update:selectedClient',
        'update:date',
        'update:type',
        'update:cashId',
        'update:isDebt',
        'update:origAmount',
        'update:currencyId',
        'update:categoryId',
        'update:projectId',
        'update:note',
        'update:selectedBalanceId',
        'update:paymentType',
        'balance-changed'
    ],
    computed: {
        localSelectedClient: {
            get() {
                return this.selectedClient;
            },
            set(value) {
                this.$emit('update:selectedClient', value);
            }
        },
        canShowDateField() {
            return this.$store.getters.hasPermission('settings_edit_any_date');
        },
        isClientFieldDisabled() {
            return !!this.initialProjectId && !this.isFieldVisible('client');
        },
        shouldShowBalanceSelect() {
            if (!this.clientBalances?.length) {
                return false;
            }
            if (this.formConfig?.options?.showClientBalanceSelect === true) {
                return this.$store.getters.hasPermission('settings_client_balance_view') ||
                    this.$store.getters.hasPermission('settings_client_balance_view_own');
            }
            return !this.isFieldVisible('client');
        },
    },
    methods: {
        onBalanceChanged(balanceId) {
            this.$emit('balance-changed', balanceId);
        },
        handleBalanceSelectByValue(balanceId) {
            const value = balanceId == null ? '' : balanceId;
            this.$emit('update:selectedBalanceId', value);
            this.$emit('balance-changed', value);
        },
    }
}
</script>


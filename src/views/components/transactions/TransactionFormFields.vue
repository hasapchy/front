<template>
  <div>
    <ClientSearch v-if="isFieldVisible('client')" :selected-client="localSelectedClient"
      @update:selectedClient="localSelectedClient = $event"
      :balance-id="selectedBalanceId" :show-label="true" :required="isDebt || isFieldRequired('client')"
      :disabled="isClientFieldDisabled || fieldConfig('client').disabled"
      :allow-deselect="!initialProjectId || !isFieldRequired('client')"
      :client-type-filter="fieldConfig('client').clientTypeFilter" @balance-changed="onBalanceChanged" />
    <div v-if="shouldShowBalanceSelect" class="mt-2">
      <label class="block mb-1 required">{{ $t('clientBalance') }}</label>
      <BalanceSelect :model-value="selectedBalanceId" :balances="clientBalances" :placeholder="$t('selectBalance')"
        :required="true" @update:model-value="handleBalanceSelectByValue" />
    </div>
    <div v-if="canShowDateField">
      <label>{{ $t('date') }}</label>
      <DatePickerField :model-value="date" type="datetime" :editing-item-id="editingItemId" :restrict-to-now="true"
        :clearable="false" class="w-full rounded" @update:model-value="$emit('update:date', $event)" />
    </div>
    <div v-if="isFieldVisible('type')" class="mt-2">
      <label class="block mb-1 required">{{ $t('type') }}</label>
      <select :value="type"
        :disabled="!!editingItemId || !!orderId || !!contractId || !!warehouseReceiptId || !!warehousePurchaseId || fieldConfig('type').readonly || fieldConfig('type').enforcedValue !== undefined"
        required @input="$emit('update:type', $event.target.value)">
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
      <div v-if="isFieldVisible('paymentType')" class="w-full">
        <label class="block mb-1 required">{{ $t('salaryPaymentType') }}</label>
        <select :value="paymentType" :disabled="!!editingItemId || currencyLockedByBalance" required
          @input="$emit('update:paymentType', Number($event.target.value))">
          <option :value="0">
            {{ $t('salaryPaymentTypeNonCash') }}
          </option>
          <option :value="1">
            {{ $t('salaryPaymentTypeCash') }}
          </option>
        </select>
      </div>
      <div class="w-full">
        <CashRegisterSelect
          :model-value="cashId"
          :cash-registers="allCashRegisters"
          :disabled="!!editingItemId || currencyLockedByBalance"
          :required="true"
          @update:model-value="$emit('update:cashId', $event)"
        />
      </div>
    </div>
    <div v-if="isFieldVisible('debt') && type !== 'income'" class="mt-2">
      <div class="flex items-center justify-between gap-3">
        <span class="text-sm text-gray-900 dark:text-[var(--text-primary)]">{{ $t('credit') }}</span>
        <ToggleSwitch
          :model-value="isDebt"
          :aria-label="$t('credit')"
          :disabled="!!editingItemId || !!orderId || !!contractId || !!warehouseReceiptId || !!warehousePurchaseId || fieldConfig('debt').readonly"
          @update:model-value="$emit('update:isDebt', $event)"
        />
      </div>
    </div>
    <div class="flex items-center space-x-2">
      <div class="w-full mt-2">
        <label class="required">{{ $t('amountBeforeConversion') }}</label>
        <FormattedDecimalInput :model-value="origAmount" variant="amount" required min="0.01"
          @update:model-value="$emit('update:origAmount', $event)" />
      </div>
      <div class="w-full mt-2">
        <label class="block mb-1 required">{{ $t('currency') }}</label>
        <select :value="currencyId" required
          :disabled="!!editingItemId || currencyLockedByBalance || !$store.getters.hasPermission('settings_currencies_view')"
          @input="$emit('update:currencyId', $event.target.value === '' ? '' : Number($event.target.value))">
          <option value="">
            {{ $t('no') }}
          </option>
          <template v-if="currencies.length">
            <option v-for="parent in currencies" :key="parent.id" :value="parent.id">
              {{ parent.symbol }} - {{ parent.name }}
            </option>
          </template>
        </select>
      </div>
    </div>
    <div v-if="isFieldVisible('category')" class="mt-2">
      <TransactionCategorySearch
        :model-value="categoryId"
        :categories="filteredCategories"
        :disabled="isCategoryFieldDisabled"
        :allow-empty="canClearCategory"
        :disable-category="isCategoryDisabled"
        :required="true"
        show-label
        @update:model-value="$emit('update:categoryId', $event)"
      />
    </div>
    <div v-if="isFieldVisible('project') && !initialProjectId" class="mt-2">
      <ProjectSearch
        :selected-project="selectedProject"
        :project-id="projectId"
        :active-projects-only="true"
        :show-label="true"
        :allow-deselect="true"
        @update:selected-project="$emit('update:selectedProject', $event)"
      />
    </div>
    <div class="mt-2">
      <label :class="['block', 'mb-1', { 'required': isFieldRequired('note') }]">{{ $t('note') }}</label>
      <textarea class="w-full min-h-[4rem] max-h-40 overflow-y-auto resize-y" rows="3" :value="note"
        @input="$emit('update:note', $event.target.value)" />
    </div>
  </div>
</template>

<script>
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import DatePickerField from '@/views/components/app/forms/DatePickerField.vue';
import BalanceSelect from '@/views/components/app/forms/BalanceSelect.vue';
import CashRegisterSelect from '@/views/components/app/forms/CashRegisterSelect.vue';
import ProjectSearch from '@/views/components/app/search/ProjectSearch.vue';
import TransactionCategorySearch from '@/views/components/transactions/TransactionCategorySearch.vue';
import ToggleSwitch from '@/views/components/app/forms/ToggleSwitch.vue';
import transactionFormConfigMixin from '@/mixins/transactionFormConfigMixin';

export default {
  name: 'TransactionFormFields',
  components: {
    ClientSearch,
    DatePickerField,
    BalanceSelect,
    CashRegisterSelect,
    ProjectSearch,
    TransactionCategorySearch,
    ToggleSwitch,
  },
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
    selectedProject: { type: Object, default: null },
    note: { type: String, default: '' },
    editingItemId: { type: [String, Number], default: null },
    orderId: { type: [String, Number], default: null },
    contractId: { type: [String, Number], default: null },
    warehouseReceiptId: { type: [String, Number], default: null },
    warehousePurchaseId: { type: [String, Number], default: null },
    initialProjectId: { type: [String, Number], default: null },
    allCashRegisters: { type: Array, default: () => [] },
    currencies: { type: Array, default: () => [] },
    filteredCategories: { type: Array, default: () => [] },
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
    'update:selectedProject',
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
    isCategoryFieldDisabled() {
      const cfg = this.fieldConfig('category');
      return !!cfg.readonly || cfg.enforcedValue !== undefined || !!cfg.enforcedByType;
    },
    canClearCategory() {
      return !this.isCategoryFieldDisabled;
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

<template>
    <div>
        <ClientSearch v-if="isFieldVisible('client')" v-model:selectedClient="localSelectedClient" :showLabel="true"
            :required="isDebt" :disabled="!!initialProjectId" :allowDeselect="!initialProjectId" />
        <div v-if="canShowDateField">
            <label>{{ $t('date') }}</label>
            <input type="datetime-local" :value="date"
                @input="$emit('update:date', $event.target.value)"
                :disabled="editingItemId && !$store.getters.hasPermission('settings_edit_any_date')"
                :min="!$store.getters.hasPermission('settings_edit_any_date') ? new Date().toISOString().substring(0, 16) : null" />
        </div>
        <div class="mt-2" v-if="isFieldVisible('type')">
            <label class="block mb-1 required">{{ $t('type') }}</label>
            <select :value="type"
                @input="$emit('update:type', $event.target.value)"
                :disabled="!!editingItemId || !!orderId || fieldConfig('type').readonly || fieldConfig('type').enforcedValue !== undefined"
                required>
                <option value="">{{ $t('selectType') }}</option>
                <option value="income">✅ {{ $t('income') }}</option>
                <option value="outcome">🔺 {{ $t('outcome') }}</option>
            </select>
        </div>
        <div class="mt-2">
            <label class="block mb-1 required">{{ $t('cashRegister') }}</label>
            <select :value="cashId" @input="$emit('update:cashId', $event.target.value)" :disabled="!!editingItemId" required>
                <option value="">{{ $t('no') }}</option>
                <option v-for="parent in allCashRegisters" :key="parent.id" :value="parent.id">
                    {{ parent.name }} ({{ parent.currencySymbol || '' }})
                </option>
            </select>
        </div>
        <div class="mt-2" v-if="isFieldVisible('debt')">
            <label class="inline-flex items-center">
                <input type="checkbox" :checked="isDebt" @change="$emit('update:isDebt', $event.target.checked)"
                    :disabled="!!editingItemId || !!orderId || fieldConfig('debt').readonly" />
                <span class="ml-2">{{ $t('credit') }}</span>
            </label>
        </div>
        <div class="flex items-center space-x-2">
            <div class="w-full mt-2">
                <label class="required">{{ $t('amountBeforeConversion') }}</label>
                <input type="number" :value="origAmount" @input="$emit('update:origAmount', parseFloat($event.target.value) || 0)" required :min="0.01">
            </div>
            <div class="w-full mt-2">
                <label class="block mb-1 required">{{ $t('currency') }}</label>
                <select :value="currencyId" @input="$emit('update:currencyId', $event.target.value)" required
                    :disabled="!!editingItemId || !$store.getters.hasPermission('settings_currencies_view')">
                    <option value="">{{ $t('no') }}</option>
                    <template v-if="currencies.length">
                        <option v-for="parent in currencies" :key="parent.id" :value="parent.id">
                            {{ parent.symbol }} - {{ parent.name }}
                        </option>
                    </template>
                </select>
            </div>
        </div>
        <div class="mt-2" v-if="isFieldVisible('category')">
            <label class="block mb-1 required">{{ $t('category') }}</label>
            <select :value="categoryId" @input="$emit('update:categoryId', $event.target.value)"
                :disabled="fieldConfig('category').readonly || fieldConfig('category').enforcedValue !== undefined || fieldConfig('category').enforcedByType">
                <option value="">{{ $t('no') }}</option>
                <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.id"
                    :disabled="isCategoryDisabled(cat)">
                    {{ cat.type ? '✅' : '🔺' }} {{ translateTransactionCategory(cat.name, $t) }}
                </option>
            </select>
        </div>
        <div class="mt-2" v-if="isFieldVisible('project')">
            <label class="block mb-1">{{ $t('project') }}</label>
            <select :value="projectId" @input="$emit('update:projectId', $event.target.value)">
                <option value="">{{ $t('no') }}</option>
                <template v-if="allProjects.length">
                    <option v-for="parent in allProjects" :key="parent.id" :value="parent.id">{{ parent.name }}</option>
                </template>
            </select>
        </div>
        <div class="mt-2">
            <label :class="['block', 'mb-1', { 'required': isFieldRequired('note') }]">{{ $t('note') }}</label>
            <input type="text" :value="note" @input="$emit('update:note', $event.target.value)" />
        </div>
    </div>
</template>

<script>
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import { translateTransactionCategory } from '@/utils/transactionCategoryUtils';
import transactionFormConfigMixin from '@/mixins/transactionFormConfigMixin';

export default {
    name: 'TransactionFormFields',
    mixins: [transactionFormConfigMixin],
    components: { ClientSearch },
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
        initialProjectId: { type: [String, Number], default: null },
        allCashRegisters: { type: Array, default: () => [] },
        currencies: { type: Array, default: () => [] },
        filteredCategories: { type: Array, default: () => [] },
        allProjects: { type: Array, default: () => [] },
        formConfig: { type: Object, default: () => ({}) },
        isCategoryDisabled: { type: Function, required: true },
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
        'update:note'
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
    },
    methods: {
        translateTransactionCategory,
    }
}
</script>


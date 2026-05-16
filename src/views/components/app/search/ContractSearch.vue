<template>
  <AppFieldPicker
    :has-selection="selectedContract != null"
    :show-label="showLabel"
    :label="$t('contract')"
    :required="required"
    :disabled="disabled"
    :allow-deselect="allowDeselect"
    :dropdown-open="showDropdown"
    :search-value="contractSearch"
    :placeholder="$t('enterContractNumberOrProject')"
    @update:search-value="contractSearch = $event"
    @focus="handleFocus"
    @blur="handleBlur"
    @deselect="deselectContract"
  >
    <template #dropdown>
      <li
        v-if="contractSearchLoading"
        class="app-field-picker__message"
      >
        {{ $t('loading') }}
      </li>
      <li
        v-else-if="contractSearch.length > 0 && contractSearch.length < 2"
        class="app-field-picker__message"
      >
        {{ $t('minimum2Characters') }}
      </li>
      <li
        v-else-if="contractSearch.length >= 2 && contractResults.length === 0"
        class="app-field-picker__message"
      >
        {{ $t('notFound') }}
      </li>
      <AppFieldPickerOption
        v-for="contract in dropdownContracts"
        :key="contract.id"
        :primary="contractDisplayTitle(contract)"
        :meta="contractAmountLabel(contract)"
        meta-accent
        @select="selectContract(contract)"
      />
    </template>
    <template #selected>
      <p class="app-field-picker__selected-line">
        {{ contractDisplayTitle(selectedContract) }}
      </p>
      <p class="app-field-picker__selected-sub">
        {{ $t('amount') }}: {{ contractAmountLabel(selectedContract) }}
      </p>
    </template>
  </AppFieldPicker>
</template>

<script>
import ProjectContractController from '@/api/ProjectContractController';
import debounce from 'lodash.debounce';
import AppFieldPicker from '@/views/components/app/forms/AppFieldPicker.vue';
import AppFieldPickerOption from '@/views/components/app/forms/AppFieldPickerOption.vue';
import { formatCurrency } from '@/utils/numberUtils';

export default {
    components: { AppFieldPicker, AppFieldPickerOption },
    props: {
        selectedContract: {
            type: Object,
            default: null,
        },
        contractId: {
            type: [Number, String],
            default: null,
        },
        projectId: {
            type: [String, Number],
            default: null,
        },
        activeProjectsOnly: {
            type: Boolean,
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        required: {
            type: Boolean,
            default: false,
        },
        showLabel: {
            type: Boolean,
            default: true,
        },
        allowDeselect: {
            type: Boolean,
            default: true,
        },
    },
    emits: ['update:selectedContract'],
    data() {
        return {
            contractSearch: '',
            contractSearchLoading: false,
            contractResults: [],
            lastContracts: [],
            showDropdown: false,
        };
    },
    computed: {
        dropdownContracts() {
            if (this.contractSearch.length === 0) {
                return this.lastContracts;
            }
            if (this.contractSearch.length < 2) {
                return [];
            }
            return this.contractResults;
        },
    },
    watch: {
        contractSearch: {
            handler: 'searchContracts',
            immediate: true,
        },
        contractId: {
            async handler(id) {
                if (id && !this.selectedContract) {
                    try {
                        const contract = await ProjectContractController.getItem(id);
                        this.$emit('update:selectedContract', contract);
                    } catch {
                        this.$emit('update:selectedContract', null);
                    }
                }
            },
            immediate: true,
        },
        projectId() {
            this.contractResults = [];
            this.fetchLastContracts();
        },
        activeProjectsOnly() {
            this.contractResults = [];
            this.fetchLastContracts();
        },
    },
    created() {
        this.fetchLastContracts();
    },
    methods: {
        contractDisplayTitle(contract) {
            const projectName = contract?.projectName ?? '-';
            const number = contract?.number ?? '';
            return number ? `${projectName} № ${number}` : projectName;
        },
        contractAmountLabel(contract) {
            return contract?.formatAmount
                ? contract.formatAmount()
                : this.formatContractAmount(contract);
        },
        formatContractAmount(contract) {
            const amount = contract?.amount ?? 0;
            const symbol = contract?.currencySymbol ?? contract?.currency?.symbol ?? '';
            return formatCurrency(amount, symbol, null, true);
        },
        async fetchLastContracts() {
            try {
                const params = { perPage: 20, page: 1, status: 'active' };
                if (this.projectId) params.projectId = this.projectId;
                if (this.activeProjectsOnly) params.activeProjectsOnly = true;
                this.lastContracts = (await ProjectContractController.getAllItems(params))?.items ?? [];
            } catch {
                this.lastContracts = [];
            }
        },
        searchContracts: debounce(async function () {
            if (this.contractSearch.length < 2) {
                this.contractResults = [];
                return;
            }
            this.contractSearchLoading = true;
            try {
                const params = { search: this.contractSearch, perPage: 20, page: 1, status: 'active' };
                if (this.projectId) params.projectId = this.projectId;
                if (this.activeProjectsOnly) params.activeProjectsOnly = true;
                this.contractResults = (await ProjectContractController.getAllItems(params))?.items ?? [];
            } catch {
                this.contractResults = [];
            } finally {
                this.contractSearchLoading = false;
            }
        }, 250),
        selectContract(contract) {
            this.showDropdown = false;
            this.contractSearch = '';
            this.contractResults = [];
            this.$emit('update:selectedContract', contract);
        },
        deselectContract() {
            this.$emit('update:selectedContract', null);
        },
        async handleFocus() {
            this.showDropdown = true;
            if (this.lastContracts.length === 0) {
                await this.fetchLastContracts();
            }
        },
        handleBlur() {
            requestAnimationFrame(() => {
                this.showDropdown = false;
            });
        },
    },
};
</script>

<template>
  <div>
    <div
      v-if="selectedContract == null"
      class="relative"
    >
      <label
        v-if="showLabel"
        :class="['block', 'mb-1', { 'required': required }]"
      >{{ $t('contract') }}</label>
      <input
        v-model="contractSearch"
        type="text"
        :placeholder="$t('enterContractNumberOrProject')"
        class="w-full p-2 border rounded"
        :disabled="disabled"
        @focus="handleFocus"
        @blur="handleBlur"
      >
      <transition name="appear">
        <ul
          v-show="showDropdown"
          class="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto w-full mt-1 z-10"
        >
          <li
            v-if="contractSearchLoading"
            class="p-2 text-gray-500"
          >
            {{ $t('loading') }}
          </li>
          <template v-else-if="contractSearch.length === 0">
            <li
              v-for="contract in lastContracts"
              :key="contract.id"
              class="cursor-pointer border-b border-gray-300 p-2 hover:bg-gray-100 dark:border-[var(--border-subtle)] dark:hover:bg-[var(--surface-muted)]"
              @mousedown.prevent="selectContract(contract)"
            >
              <div class="flex justify-between items-center">
                <div class="font-medium">
                  {{ contractDisplayTitle(contract) }}
                </div>
                <div class="text-[#337AB7]">
                  {{ contract.formatAmount ? contract.formatAmount() : formatContractAmount(contract) }}
                </div>
              </div>
            </li>
          </template>
          <li
            v-else-if="contractSearch.length < 2"
            class="p-2 text-gray-500"
          >
            {{ $t('minimum2Characters') }}
          </li>
          <li
            v-else-if="contractResults.length === 0"
            class="p-2 text-gray-500"
          >
            {{ $t('notFound') }}
          </li>
          <li
            v-for="contract in contractResults"
            :key="contract.id"
            class="cursor-pointer border-b border-gray-300 p-2 hover:bg-gray-100 dark:border-[var(--border-subtle)] dark:hover:bg-[var(--surface-muted)]"
            @mousedown.prevent="selectContract(contract)"
          >
            <div class="flex justify-between items-center">
              <div class="font-medium">
                {{ contractDisplayTitle(contract) }}
              </div>
              <div class="text-[#337AB7]">
                {{ contract.formatAmount ? contract.formatAmount() : formatContractAmount(contract) }}
              </div>
            </div>
          </li>
        </ul>
      </transition>
    </div>
    <div
      v-else
      class="mt-2"
    >
      <div class="p-2 pt-0 border-2 border-gray-400/60 rounded-md">
        <div class="flex justify-between items-center">
          <div>
            <label :class="{ 'required': required }">{{ $t('contract') }}{{ selectedContract?.id ? ` #${selectedContract.id}` : '' }}</label>
            <p><span class="font-semibold text-sm">{{ contractDisplayTitle(selectedContract) }}</span></p>
            <p><span class="text-xs">{{ $t('amount') }}:</span> <span class="font-semibold text-sm">{{ selectedContract.formatAmount ? selectedContract.formatAmount() : formatContractAmount(selectedContract) }}</span></p>
          </div>
          <button
            v-if="allowDeselect"
            class="text-red-500 text-2xl cursor-pointer"
            :disabled="disabled"
            @click="deselectContract"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ProjectContractController from '@/api/ProjectContractController';
import debounce from 'lodash.debounce';
import { formatCurrency } from '@/utils/numberUtils';

export default {
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
    methods: {
        contractDisplayTitle(contract) {
            const projectName = contract?.projectName ?? '-';
            const number = contract?.number ?? '';
            return number ? `${projectName} № ${number}` : projectName;
        },
        formatContractAmount(contract) {
            const amount = contract?.amount ?? 0;
            const symbol = contract?.currencySymbol ?? contract?.currency?.symbol ?? '';
            return formatCurrency(amount, symbol, null, true);
        },
        async fetchLastContracts() {
            try {
                const params = { perPage: 20, page: 1 };
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
                const params = { search: this.contractSearch, perPage: 20, page: 1 };
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
};
</script>

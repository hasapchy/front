<template>
  <AppFieldPicker
    :has-selection="selectedReceipt != null"
    :show-label="showLabel"
    :label="$t('receipt')"
    :required="required"
    :disabled="disabled"
    :allow-deselect="allowDeselect"
    :dropdown-open="showDropdown"
    :search-value="receiptSearch"
    :placeholder="$t('enterReceiptNumberOrSupplier')"
    @update:search-value="receiptSearch = $event"
    @focus="handleFocus"
    @blur="handleBlur"
    @deselect="deselectReceipt"
  >
    <template #dropdown>
      <li
        v-if="dropdownStatus === 'loading'"
        class="app-field-picker__message"
      >
        {{ $t('loading') }}
      </li>
      <li
        v-else-if="dropdownStatus === 'minChars'"
        class="app-field-picker__message"
      >
        {{ $t('minimum2Characters') }}
      </li>
      <li
        v-else-if="dropdownStatus === 'notFound'"
        class="app-field-picker__message"
      >
        {{ $t('notFound') }}
      </li>
      <AppFieldPickerOption
        v-for="receipt in dropdownReceipts"
        :key="receipt.id"
        stacked
        @select="selectReceipt(receipt)"
      >
        <div class="app-field-picker__option-stack">
          <span class="app-field-picker__option-primary w-fit max-w-full">
            {{ getReceiptSupplierLabel(receipt, $t) }}<span class="app-field-picker__option-meta app-field-picker__option-meta--accent ml-1.5 font-semibold">{{ getReceiptAmountLabel(receipt) }}</span>
          </span>
          <span class="app-field-picker__option-sub">{{ getReceiptOptionSub(receipt) }}</span>
        </div>
      </AppFieldPickerOption>
    </template>
    <template #selected>
      <div class="min-w-0">
        <p class="app-field-picker__selected-line">
          {{ getReceiptSupplierLabel(selectedReceipt, $t) }}<span class="app-field-picker__option-meta app-field-picker__option-meta--accent ml-1.5 font-semibold">{{ getReceiptAmountLabel(selectedReceipt) }}</span>
        </p>
        <p class="app-field-picker__selected-sub">
          {{ getReceiptOptionSub(selectedReceipt) }}
        </p>
      </div>
    </template>
  </AppFieldPicker>
</template>

<script>
import WarehouseReceiptController from '@/api/WarehouseReceiptController';
import debounce from 'lodash.debounce';
import AppFieldPicker from '@/views/components/app/forms/AppFieldPicker.vue';
import AppFieldPickerOption from '@/views/components/app/forms/AppFieldPickerOption.vue';
import {
    getReceiptAmountLabel,
    getReceiptOptionSub,
    getReceiptSupplierLabel,
} from '@/utils/receiptSearchUtils';

const SEARCH_MIN_LENGTH = 2;
const LIST_LIMIT = 20;

export default {
    components: { AppFieldPicker, AppFieldPickerOption },
    props: {
        selectedReceipt: { type: Object, default: null },
        disabled: { type: Boolean, default: false },
        required: { type: Boolean, default: false },
        showLabel: { type: Boolean, default: true },
        allowDeselect: { type: Boolean, default: true },
    },
    emits: ['update:selectedReceipt'],
    data() {
        return {
            receiptSearch: '',
            receiptSearchLoading: false,
            receiptResults: [],
            receipts: [],
            showDropdown: false,
        };
    },
    computed: {
        isSearchActive() {
            return this.receiptSearch.length > 0;
        },
        dropdownReceipts() {
            if (!this.isSearchActive) {
                return this.receipts.slice(0, LIST_LIMIT);
            }
            if (this.receiptSearch.length < SEARCH_MIN_LENGTH) {
                return [];
            }
            return this.receiptResults;
        },
        dropdownStatus() {
            if (this.receiptSearchLoading) {
                return 'loading';
            }
            if (this.isSearchActive && this.receiptSearch.length < SEARCH_MIN_LENGTH) {
                return 'minChars';
            }
            if (this.isSearchActive && this.receiptResults.length === 0) {
                return 'notFound';
            }
            return null;
        },
    },
    watch: {
        receiptSearch: {
            handler: 'searchReceipts',
            immediate: true,
        },
    },
    created() {
        this.fetchLastReceipts();
    },
    methods: {
        getReceiptSupplierLabel,
        getReceiptOptionSub,
        getReceiptAmountLabel,
        filterReceipts(receipts, query) {
            const normalizedQuery = query.trim().toLowerCase();
            if (!normalizedQuery) {
                return receipts;
            }
            return receipts.filter((receipt) => {
                const supplier = getReceiptSupplierLabel(receipt, this.$t).toLowerCase();
                return String(receipt.id).includes(normalizedQuery)
                    || supplier.includes(normalizedQuery)
                    || String(receipt.warehouseName).toLowerCase().includes(normalizedQuery);
            });
        },
        async fetchLastReceipts() {
            const page = await WarehouseReceiptController.getItems(1, 100);
            this.receipts = page.items;
        },
        searchReceipts: debounce(async function () {
            if (this.receiptSearch.length < SEARCH_MIN_LENGTH) {
                this.receiptResults = [];
                return;
            }
            this.receiptSearchLoading = true;
            try {
                if (!this.receipts.length) {
                    await this.fetchLastReceipts();
                }
                this.receiptResults = this.filterReceipts(this.receipts, this.receiptSearch).slice(0, LIST_LIMIT);
            } finally {
                this.receiptSearchLoading = false;
            }
        }, 400),
        selectReceipt(receipt) {
            this.showDropdown = false;
            this.receiptSearch = '';
            this.receiptResults = [];
            this.$emit('update:selectedReceipt', receipt);
        },
        deselectReceipt() {
            this.$emit('update:selectedReceipt', null);
        },
        async handleFocus() {
            this.showDropdown = true;
            if (!this.receipts.length) {
                await this.fetchLastReceipts();
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

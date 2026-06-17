<template>
  <div class="flex flex-col h-full min-h-0">
    <div class="flex-1 min-h-0 overflow-y-auto p-4">
      <TabBar
        v-if="showWriteoffTabs"
        :tabs="visibleTabs"
        :active-tab="currentTab"
        :tab-click="changeTab"
      />

      <div v-show="!showWriteoffTabs || currentTab === 'details'">
        <div class="mt-2">
          <label class="block mb-1">{{ $t('warehouse') }}</label>
          <div class="flex items-center space-x-2">
            <select v-model="warehouseId">
              <option value="">
                {{ $t('no') }}
              </option>
              <template v-if="allWarehouses.length">
                <option
                  v-for="parent in allWarehouses"
                  :key="parent.id"
                  :value="parent.id"
                >
                  {{ parent.name }}
                </option>
              </template>
            </select>
          </div>
        </div>

        <div
          v-if="!lockedReturnSupplier"
          class="mt-2"
        >
          <label class="block mb-1">{{ $t('writeoffReason') }}</label>
          <select v-model="reason">
            <option
              v-for="opt in reasonOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ $t(opt.labelKey) }}
            </option>
          </select>
        </div>

        <div
          v-if="isReturnSupplierReason"
          class="mt-2"
        >
          <ReceiptSearch
            :selected-receipt="selectedReceipt"
            :disabled="!!editingItemId"
            :required="true"
            :allow-deselect="!editingItemId"
            :eligible-for-return="true"
            @update:selected-receipt="onReceiptPicked"
          />
        </div>

        <div
          v-if="isReturnSupplierReason && selectedReceipt?.client"
          class="mt-2"
        >
          <ClientSearch
            :selected-client="selectedReceipt.client"
            :balance-id="selectedReceipt.clientBalanceId"
            :only-suppliers="true"
            label-key="supplier"
            :allow-deselect="false"
            :disabled="true"
            :client-selection-disabled="true"
            :skip-fetch-selected-client-on-create="true"
          />
        </div>

        <div class="mt-2">
          <label>{{ $t('date') }}</label>
          <input
            v-model="date"
            type="date"
          >
        </div>
        <div class="mt-2">
          <label>{{ $t('note') }}</label>
          <input
            v-model="note"
            type="text"
          >
        </div>
        <ProductSearch
          v-model="products"
          amount-rounding-scope="warehouse"
          :disabled="!!editingItemId"
          :show-quantity="true"
          :show-price="isReturnSupplierReason"
          :is-receipt="isReturnSupplierReason"
          :show-amount="isReturnSupplierReason"
          :only-products="true"
          :warehouse-id="warehouseId"
          :receipt-waybill-catalog-products="receiptCatalogProducts"
          :enable-alternate-unit-quantity="true"
          :document-currency-id="receiptCashCurrencyId"
          :currency-code="receiptCashCurrencySymbol"
          :document-to-default-factor="receiptDocumentToDefaultFactor"
          :exchange-rate-date="writeoffExchangeRateDate"
          required
        />
      </div>

      <div v-show="showWriteoffTabs && currentTab === 'transactions'">
        <WarehouseWriteoffTransactionsTab
          v-if="transactionsTabVisited && editingItemId"
          :writeoff-id="editingItemId"
          :client="selectedReceipt?.client"
          :cash-id="selectedReceipt?.cashId"
          :document-balance-id="selectedReceipt?.clientBalanceId"
          :client-balances="selectedReceipt?.client?.balances || []"
          :paid-portion="Number(editingItem?.paidPortion || 0)"
          :cash-return-remaining-default="editingItem?.cashReturnRemainingDefault ?? null"
          :currency-symbol="receiptCashCurrencySymbol"
          @finance-changed="onWriteoffFinanceChanged"
        />
      </div>
    </div>
    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center justify-between gap-4 md:flex-nowrap">
        <div class="flex items-center gap-2">
          <PrimaryButton
            v-if="editingItemId != null"
            :onclick="showDeleteDialog"
            :is-danger="true"
            :is-loading="deleteLoading"
            icon="fas fa-trash"
            :disabled="!$store.getters.hasPermission('warehouse_writeoffs_delete')"
          />
          <PrimaryButton
            icon="fas fa-save"
            :onclick="save"
            :is-loading="saveLoading"
            :disabled="(editingItemId != null && !$store.getters.hasPermission('warehouse_writeoffs_update')) ||
              (editingItemId == null && !$store.getters.hasPermission('warehouse_writeoffs_create'))"
            :aria-label="$t('save')"
          />
        </div>

        <div
          v-if="isReturnSupplierReason && writeoffReturnDocumentTotal != null"
          class="text-sm text-gray-700 dark:text-white flex flex-wrap md:flex-nowrap gap-x-4 gap-y-1 font-medium"
        >
          <div class="inline-flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-right">
            <span>{{ $t('total') }}:</span>
            <span class="font-bold">{{ writeoffReturnFooterTotalFormatted }}</span>
            <span
              v-if="writeoffReturnFooterDefHint"
              class="font-normal text-gray-500 dark:text-[var(--text-secondary)]"
            >
              {{ writeoffReturnFooterDefHint }}
            </span>
          </div>
        </div>
      </div>
    </teleport>
    <AlertDialog
      :dialog="deleteDialog"
      :descr="$t('confirmCancelWriteoff')"
      :confirm-text="$t('deleteWriteoff')"
      :leave-text="$t('cancel')"
      @confirm="deleteItem"
      @leave="closeDeleteDialog"
    />
    <AlertDialog
      :dialog="closeConfirmDialog"
      :descr="$t('unsavedChanges')"
      :confirm-text="$t('closeWithoutSaving')"
      :leave-text="$t('stay')"
      @confirm="confirmClose"
      @leave="cancelClose"
    />
  </div>
</template>


<script>
import WarehouseWriteoffProductDto from '@/dto/warehouse/WarehouseWriteoffProductDto';
import ProductDto from '@/dto/product/ProductDto';
import WarehouseWriteoffController from '@/api/WarehouseWriteoffController';
import WarehouseReceiptController from '@/api/WarehouseReceiptController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import ReceiptSearch from '@/views/components/app/search/ReceiptSearch.vue';
import ProductSearch from '@/views/components/app/search/ProductSearch.vue';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import WarehouseWriteoffTransactionsTab from '@/views/pages/warehouses/WarehouseWriteoffTransactionsTab.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import { WH_WRITEOFF_REASONS } from '@/constants/warehouseWriteoffReasons';
import { loadClientBalancesForForm } from '@/utils/clientBalanceCashUtils';
import {
    fetchDocumentToDefaultFactor,
    isDocumentCurrencyDefault,
    resolveLineSubtotalInDefaultCurrency,
} from '@/utils/documentToDefaultCurrency';
import { formatCurrencyForDisplay, multiplyWithoutFloatNoise, roundDocumentTotalForScope } from '@/utils/numberUtils';
import { lineOrigSavePayload } from '@/utils/warehouseLineOrigPayload';
import { getCurrentLocalDateTime } from '@/utils/dateUtils';


export default {
    components: { PrimaryButton, AlertDialog, ClientSearch, ReceiptSearch, ProductSearch, TabBar, WarehouseWriteoffTransactionsTab },
    mixins: [getApiErrorMessage, crudFormMixin, sideModalFooterPortal],
    props: {
        editingItem: { type: Object, default: null },
        lockedReturnSupplier: { type: Boolean, default: false },
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request', 'writeoff-refreshed'],
    data() {
        return {
            note: this.editingItem ? this.editingItem.note : '',
            date: this.editingItem?.date ? String(this.editingItem.date).substring(0, 10) : getCurrentLocalDateTime().substring(0, 10),
            warehouseId: this.editingItem ? this.editingItem.warehouseId : '',
            reason: this.editingItem ? this.editingItem.reason : (this.lockedReturnSupplier ? 'return_supplier' : 'defect'),
            products: this.editingItem ? this.editingItem.products : [],
            allWarehouses: [],
            currencies: [],
            allCashRegisters: [],
            receiptDocumentToDefaultFactor: 1,
            selectedReceipt: null,
            currentTab: 'details',
            transactionsTabVisited: false,
        };
    },
    computed: {
        showWriteoffTabs() {
            return this.isReturnSupplierReason && this.editingItemId != null;
        },
        visibleTabs() {
            return [
                { name: 'details', label: this.$t('details') },
                { name: 'transactions', label: this.$t('transactions') },
            ];
        },
        reasonOptions() {
            return WH_WRITEOFF_REASONS;
        },
        isReturnSupplierReason() {
            return this.reason === 'return_supplier';
        },
        createModeDefaultReason() {
            return this.lockedReturnSupplier ? 'return_supplier' : 'defect';
        },
        selectedReceiptCashRegister() {
            if (!this.selectedReceipt?.cashId) {
                return null;
            }
            return this.allCashRegisters?.find((c) => Number(c.id) === Number(this.selectedReceipt.cashId)) || null;
        },
        receiptCashCurrencySymbol() {
            if (this.selectedReceiptCashRegister) {
                return this.selectedReceiptCashRegister.currencyCode ?? '';
            }
            return this.selectedReceipt?.origCurrencyCode || this.selectedReceipt?.currencyCode || '';
        },
        receiptCashCurrencyId() {
            if (this.selectedReceiptCashRegister) {
                return this.selectedReceiptCashRegister.currencyId ?? null;
            }
            return this.selectedReceipt?.origCurrencyId ?? null;
        },
        writeoffExchangeRateDate() {
            return this.selectedReceipt?.date || this.editingItem?.createdAt || null;
        },
        isWriteoffReturnCurrencyDefault() {
            return isDocumentCurrencyDefault(this.receiptCashCurrencyId, this.currencies);
        },
        writeoffReturnEffectiveDocumentToDefaultFactor() {
            if (this.isWriteoffReturnCurrencyDefault) {
                return 1;
            }
            const factor = Number(this.receiptDocumentToDefaultFactor);
            return factor > 1 ? factor : 1;
        },
        writeoffReturnDocumentTotal() {
            if (!this.isReturnSupplierReason || !this.products?.length) {
                return null;
            }
            let sum = 0;
            for (const product of this.products) {
                const lineAmount = product.amount != null && product.amount !== ''
                    ? (Number(product.amount) || 0)
                    : multiplyWithoutFloatNoise(Number(product.price) || 0, Number(product.quantity) || 0);
                sum += lineAmount;
            }
            return roundDocumentTotalForScope(sum, 'warehouse');
        },
        writeoffReturnFooterDefaultTotal() {
            if (this.isWriteoffReturnCurrencyDefault) {
                return 0;
            }
            const factor = this.writeoffReturnEffectiveDocumentToDefaultFactor;
            let sum = 0;
            for (const product of this.products || []) {
                const lineDefault = resolveLineSubtotalInDefaultCurrency({
                    amountDefault: product.amountDefault,
                    priceDefault: product.priceDefault,
                    quantity: product.quantity,
                    documentUnitPrice: product.price,
                    documentLineAmount: product.amount,
                    factor,
                });
                if (lineDefault != null && lineDefault > 0) {
                    sum += lineDefault;
                }
            }
            return sum;
        },
        writeoffReturnFooterDefHint() {
            if (this.isWriteoffReturnCurrencyDefault) {
                return null;
            }
            const def = this.currencies.find((c) => c.isDefault);
            const defAmount = this.writeoffReturnFooterDefaultTotal;
            if (!defAmount) {
                return null;
            }
            const formatted = formatCurrencyForDisplay(defAmount, def?.code ?? '', true);
            return this.$t('productSearchEquivDefaultCurrency', { amount: formatted });
        },
        writeoffReturnFooterTotalFormatted() {
            return formatCurrencyForDisplay(
                this.writeoffReturnDocumentTotal,
                this.receiptCashCurrencySymbol,
                true,
            );
        },
        receiptCatalogProducts() {
            if (!this.isReturnSupplierReason || !this.selectedReceipt?.products?.length) {
                return [];
            }
            return this.selectedReceipt.products.map((p) => {
                const product = ProductDto.fromApi({
                    id: p.productId,
                    type: 1,
                    name: p.productName,
                    image: p.productImage,
                    stock_quantity: p.quantity,
                    unit_id: p.unitId,
                    unit_name: p.unitName,
                    unit_short_name: p.unitShortName,
                    retail_price: p.price,
                    wholesale_price: p.price,
                    purchase_price: p.price,
                });
                product.priceLocked = true;
                return product;
            });
        },
    },
    watch: {
        receiptCashCurrencyId: {
            handler() {
                this.refreshReceiptDocumentToDefaultFactor();
            },
            immediate: true,
        },
        writeoffExchangeRateDate() {
            this.refreshReceiptDocumentToDefaultFactor();
        },
        async reason(newReason, oldReason) {
            if (newReason === oldReason) {
                return;
            }
            if (newReason !== 'return_supplier') {
                this.selectedReceipt = null;
                this.products = [];
                this.currentTab = 'details';
                this.transactionsTabVisited = false;
            }
        },
        editingItemId(val) {
            if (!val) {
                this.currentTab = 'details';
                this.transactionsTabVisited = false;
            }
        },
    },
    mounted() {
        this.$nextTick(async () => {
            await Promise.all([
                this.fetchCurrencies(),
                this.fetchAllWarehouses(),
                this.fetchAllCashRegisters(),
            ]);
            if (this.reason === 'return_supplier' && this.editingItem?.sourceReceiptId) {
                await this.loadSelectedReceipt(this.editingItem.sourceReceiptId);
            }

            if (!this.editingItem) {
                if (this.allWarehouses.length > 0 && !this.warehouseId) {
                    this.warehouseId = this.allWarehouses[0].id;
                }
            }

            this.saveInitialState();
        });
    },
    methods: {
        changeTab(tabId) {
            this.currentTab = tabId;
            if (tabId === 'transactions') {
                this.transactionsTabVisited = true;
            }
        },
        async onWriteoffFinanceChanged() {
            if (!this.editingItemId) {
                return;
            }
            try {
                const dto = await WarehouseWriteoffController.getItem(this.editingItemId);
                this.$emit('writeoff-refreshed', dto);
            } catch (error) {
                this.$store.dispatch('showNotification', {
                    title: this.$t('error'),
                    subtitle: this.apiErrorLinesAsString(error),
                    isDanger: true,
                });
            }
        },
        getFormState() {
            return {
                warehouseId: this.warehouseId,
                reason: this.reason,
                note: this.note,
                date: this.date,
                products: [...this.products]
            };
        },
        async onReceiptPicked(receipt) {
            if (!receipt?.id) {
                this.selectedReceipt = null;
                this.products = [];
                return;
            }
            await this.loadSelectedReceipt(receipt.id);
        },
        async fetchAllWarehouses() {
            if (this.$store.getters.warehouses && this.$store.getters.warehouses.length > 0) {
                this.allWarehouses = this.$store.getters.warehouses;
            } else {
                await this.$store.dispatch('loadWarehouses');
                this.allWarehouses = this.$store.getters.warehouses;
            }
            if (!this.warehouseId && !this.editingItem && this.allWarehouses.length > 0) {
                this.warehouseId = this.allWarehouses[0].id;
            }
        },
        async loadSelectedReceipt(receiptId) {
            const receipt = await WarehouseReceiptController.getItem(Number(receiptId));
            const balances = await loadClientBalancesForForm(receipt.client.id, receipt.client);
            receipt.client = { ...receipt.client, balances };
            this.selectedReceipt = receipt;
            if (!this.editingItemId) {
                this.applyReceiptProducts(receipt);
            }
        },
        applyReceiptProducts(receipt) {
            this.products = (receipt.products || []).map((line) => {
                const dto = new WarehouseWriteoffProductDto(
                    null,
                    null,
                    line.productId,
                    line.productName,
                    line.productImage,
                    line.unitId,
                    line.unitName,
                    line.unitShortName,
                    line.quantity,
                    line.quantity,
                    line.price,
                    line.id,
                );
                dto.amount = line.amount ?? (Number(line.quantity) || 0) * (Number(line.price) || 0);
                dto.priceLocked = true;
                dto.origUnitId = line.origUnitId ?? null;
                dto.origQuantity = line.origQuantity ?? null;
                dto.origUnitShortName = line.origUnitShortName ?? null;
                if (dto.origUnitId != null && dto.unitId != null && dto.origUnitId !== dto.unitId) {
                    dto.alternateInputUnitId = dto.origUnitId;
                }
                dto.stockByUnits = Array.isArray(line.stockByUnits) ? [...line.stockByUnits] : [];
                dto.alternateUnitOptions = Array.isArray(line.alternateUnitOptions) ? [...line.alternateUnitOptions] : [];
                if (line.priceDefault != null) {
                    dto.priceDefault = line.priceDefault;
                    dto.amountDefault = line.amountDefault ?? line.priceDefault * (Number(line.quantity) || 0);
                }
                return dto;
            });
        },
        async fetchCurrencies() {
            if (this.$store.getters.currencies?.length) {
                this.currencies = this.$store.getters.currencies;
                return;
            }
            await this.$store.dispatch('loadCurrencies');
            this.currencies = this.$store.getters.currencies;
        },
        async fetchAllCashRegisters() {
            if (this.$store.getters.cashRegisters?.length) {
                this.allCashRegisters = this.$store.getters.cashRegisters;
                return;
            }
            await this.$store.dispatch('loadCashRegisters');
            this.allCashRegisters = this.$store.getters.cashRegisters;
        },
        async refreshReceiptDocumentToDefaultFactor() {
            if (!this.isReturnSupplierReason) {
                this.receiptDocumentToDefaultFactor = 1;
                return;
            }
            this.receiptDocumentToDefaultFactor = await fetchDocumentToDefaultFactor(
                this.receiptCashCurrencyId,
                this.currencies,
                this.writeoffExchangeRateDate,
            );
        },
        prepareSave() {
            const reason = this.lockedReturnSupplier ? this.createModeDefaultReason : this.reason;
            return {
                warehouseId: this.warehouseId,
                reason,
                sourceReceiptId: this.isReturnSupplierReason ? Number(this.selectedReceipt?.id) : null,
                note: this.note,
                date: this.date,
                products: this.products.map(product => ({
                    productId: product.productId,
                    quantity: product.quantity,
                    sourceReceiptProductId: this.isReturnSupplierReason ? (product.sourceReceiptProductId ?? null) : null,
                    ...lineOrigSavePayload(product),
                }))
            };
        },
        async performSave(data) {
            if (this.editingItemId != null) {
                return await WarehouseWriteoffController.updateItem(this.editingItemId, data);
            } else {
                return await WarehouseWriteoffController.storeItem(data);
            }
        },
        async performDelete() {
            const resp = await WarehouseWriteoffController.deleteItem(this.editingItemId);
            if (!resp.message) {
                throw new Error('Failed to delete writeoff');
            }
            return resp;
        },
        clearForm() {
            this.note = '';
            this.date = getCurrentLocalDateTime().substring(0, 10);
            this.warehouseId = '';
            this.reason = this.createModeDefaultReason;
            this.selectedReceipt = null;
            this.products = [];
            this.currentTab = 'details';
            this.transactionsTabVisited = false;
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            if (newEditingItem) {
                this.note = newEditingItem.note;
                this.date = newEditingItem?.date ? String(newEditingItem.date).substring(0, 10) : getCurrentLocalDateTime().substring(0, 10);
                this.warehouseId = newEditingItem.warehouseId;
                this.reason = newEditingItem.reason;
                this.products = newEditingItem.products || [];
                if (newEditingItem.sourceReceiptId) {
                    void this.loadSelectedReceipt(newEditingItem.sourceReceiptId);
                }
            }
        }
    },
};
</script>
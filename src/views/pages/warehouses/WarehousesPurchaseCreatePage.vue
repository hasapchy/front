<template>
  <div class="flex flex-col h-full min-h-0">
    <div class="flex-1 min-h-0 overflow-y-auto p-4">
      <TabBar
        :tabs="visibleTabs"
        :active-tab="currentTab"
        :tab-click="changeTab"
      />

      <div v-show="currentTab === 'info'">
        <ClientSearch
          :selected-client="selectedClient"
          :only-suppliers="true"
          label-key="supplier"
          :disabled="!canEditMainInfo"
          :balance-id="clientBalanceId"
          required
          @update:selected-client="onSelectedClientUpdated"
          @balance-changed="onBalanceChanged"
        />

        <div class="mt-2">
          <label class="block mb-1 required">{{ $t('warehouse') }}</label>
          <select
            v-model="warehouseId"
            :disabled="!canEditMainInfo"
          >
            <option value="">
              {{ $t('no') }}
            </option>
            <option
              v-for="warehouse in allWarehouses"
              :key="warehouse.id"
              :value="warehouse.id"
            >
              {{ warehouse.name }}
            </option>
          </select>
        </div>

        <div class="mt-2">
          <label class="block mb-1 required">{{ $t('currency') }}</label>
          <select
            v-model="currencyId"
            :disabled="!canEditMainInfo || clientBalanceSelected"
          >
            <option value="">
              {{ $t('no') }}
            </option>
            <option
              v-for="currency in currencies"
              :key="currency.id"
              :value="currency.id"
            >
              {{ currency.name }} ({{ currency.symbol }})
            </option>
          </select>
        </div>

        <div class="mt-2">
          <CashRegisterSelect
            v-model="cashId"
            :cash-registers="cashRegistersForForm"
            :disabled="!canEditMainInfo || cashSelectDisabled"
            :required="true"
          />
        </div>

        <div>
          <label>{{ $t('date') }}</label>
          <input
            v-model="date"
            type="datetime-local"
            :disabled="!canEditMainInfo"
            :min="getMinDate()"
          >
        </div>

        <div
          v-if="editingItemId != null"
          class="mt-2"
        >
          <label class="block mb-1">{{ $t('status') }}</label>
          <select
            v-if="canEditStatus"
            v-model="status"
          >
            <option
              v-if="showDraftPurchaseStatusOption"
              value="draft"
            >
              {{ $t('purchaseStatusDraft') }}
            </option>
            <option value="approved">
              {{ $t('purchaseStatusApproved') }}
            </option>
          </select>
          <div
            v-else
            class="text-sm text-gray-700 dark:text-white"
          >
            {{ purchaseStatusReadonlyLabel }}
          </div>
          <p
            v-if="status === 'approved'"
            class="mt-1 text-xs text-gray-500 dark:text-[var(--text-secondary)]"
          >
            {{ $t('purchaseStatusCompletedAutoHint') }}
          </p>
        </div>

        <div class="mt-2">
          <label>{{ $t('note') }}</label>
          <input
            v-model="note"
            type="text"
            :disabled="!canEditMainInfo"
          >
        </div>

        <ProductSearch
          v-model="products"
          class="warehouse-purchase-create__products"
          amount-rounding-scope="warehouse"
          :disabled="!canEditMainInfo"
          :show-quantity="true"
          :show-price="true"
          :is-receipt="true"
          :is-purchase="true"
          :show-amount="true"
          :only-products="true"
          :warehouse-id="warehouseId"
          :allow-all-warehouse-products="true"
          :enable-alternate-unit-quantity="true"
          :document-currency-id="currencyId"
          :currency-symbol="purchaseDocumentCurrencySymbol"
          :document-to-default-factor="purchaseDocumentToDefaultFactor"
          :exchange-rate-date="date"
          required
        />
      </div>

      <div v-show="currentTab === 'transactions'">
        <WarehousePurchaseTransactionsTab
          :purchase-id="editingItemId"
          :can-pay="canPay"
          :goods-payment-remaining-default="goodsPaymentRemainingDefault"
          :transactions="transactions"
          :client="selectedClient"
          :document-balance-id="clientBalanceId"
          :client-balances="transactionTabClientBalances"
          :cash-registers-for-select="cashRegistersForForm"
          :currencies="currencies"
          :default-cash-id="cashId"
          :default-currency-id="currencyId"
          :client-balance-selected="clientBalanceSelected"
          @purchase-refreshed="onPurchaseRefreshed"
          @totals-changed="onPurchaseTotalsChanged"
          @error="onTabError"
        />
      </div>

      <div v-show="currentTab === 'receipts'">
        <WarehousePurchaseReceiptsTab
          :receipts="receipts"
          :can-create-receipt="canCreateReceiptFromPurchase"
          :receipt-create-context="receiptCreateContext"
          @receipt-saved="onReceiptSaved"
          @error="onTabError"
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
            :disabled="!$store.getters.hasPermission('warehouse_purchases_delete')"
          />
          <PrimaryButton
            icon="fas fa-save"
            :onclick="save"
            :is-loading="saveLoading"
            :disabled="!canSave"
            :aria-label="$t('save')"
          />
        </div>
        <div class="text-sm text-gray-700 flex flex-wrap md:flex-nowrap gap-x-4 gap-y-1 font-medium dark:text-white">
          <div
            v-if="purchaseOrigAmount != null"
            class="warehouse-purchase-create__footer inline-flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-right"
          >
            <span>{{ $t('total') }}:</span>
            <span class="font-bold">{{ purchaseFooterTotalFormatted }}</span>
            <span
              v-if="purchaseFooterDefHint"
              class="font-normal text-gray-500 dark:text-[var(--text-secondary)]"
            >
              {{ purchaseFooterDefHint }}
            </span>
          </div>
          <div
            v-if="purchaseFooterTxnGoods"
            class="inline-flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-right"
          >
            <span>{{ $t('payForGoods') }}:</span>
            <span class="font-bold">{{ purchaseFooterTxnGoods }}</span>
          </div>
        </div>
      </div>
    </teleport>

    <AlertDialog
      :dialog="deleteDialog"
      :descr="$t('confirmDelete')"
      :confirm-text="$t('delete')"
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
import WarehousePurchaseController from '@/api/WarehousePurchaseController';
import WarehouseReceiptProductDto from '@/dto/warehouse/WarehouseReceiptProductDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import ProductSearch from '@/views/components/app/search/ProductSearch.vue';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import CashRegisterSelect from '@/views/components/app/forms/CashRegisterSelect.vue';
import WarehousePurchaseTransactionsTab from '@/views/pages/warehouses/WarehousePurchaseTransactionsTab.vue';
import WarehousePurchaseReceiptsTab from '@/views/pages/warehouses/WarehousePurchaseReceiptsTab.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import notificationMixin from '@/mixins/notificationMixin';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import { dateFormMixin } from '@/utils/dateUtils';
import clientBalanceCashMixin from '@/mixins/clientBalanceCashMixin';
import { balancesForDocumentPayment } from '@/utils/documentPaymentBalanceUtils';
import { formatCurrencyForDisplay } from '@/utils/numberUtils';
import { applyDocumentFromApiResponse, parseDocumentTotalPrice } from '@/utils/documentTotals';
import { lineOrigSavePayload, warehouseLinePriceForSave } from '@/utils/warehouseLineOrigPayload';
import { canWarehousePurchase } from '@/utils/warehousePurchasePermissions';
import {
    fetchDocumentToDefaultFactor,
    resolveLineSubtotalInDefaultCurrency,
} from '@/utils/documentToDefaultCurrency';

export default {
    components: {
        PrimaryButton,
        AlertDialog,
        ClientSearch,
        ProductSearch,
        TabBar,
        CashRegisterSelect,
        WarehousePurchaseTransactionsTab,
        WarehousePurchaseReceiptsTab,
    },
    mixins: [getApiErrorMessage, notificationMixin, crudFormMixin, dateFormMixin, sideModalFooterPortal, clientBalanceCashMixin],
    clientBalanceCashFields: {
        selectedBalanceId: 'clientBalanceId',
    },
    props: {
        editingItem: {
            type: Object,
            default: null,
        },
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
    data() {
        return {
            currentTab: 'info',
            selectedClient: this.editingItem?.supplier || null,
            clientBalanceId: this.editingItem?.clientBalanceId ?? null,
            date: this.editingItem?.date ? this.getFormattedDate(this.editingItem.date) : this.getCurrentLocalDateTime(),
            warehouseId: this.editingItem?.warehouseId ?? '',
            cashId: this.editingItem?.cashId ?? '',
            currencyId: this.editingItem?.origCurrencyId ?? this.editingItem?.currencyId ?? '',
            note: this.editingItem?.note || '',
            status: this.editingItem?.status || 'draft',
            products: this.editingItem?.products ?? [],
            transactions: this.editingItem?.transactions || [],
            receipts: this.editingItem?.receipts || [],
            goodsPaymentRemainingDefault: this.editingItem?.goodsPaymentRemainingDefault ?? null,
            allWarehouses: [],
            allCashRegisters: [],
            currencies: [],
            purchaseDocumentToDefaultFactor: 1,
            purchaseFooterTxnGoods: null,
            purchaseOrigAmount: parseDocumentTotalPrice(this.editingItem, 'warehouse'),
        };
    },
    watch: {
        currencyId: {
            handler() {
                this.refreshPurchaseDocumentToDefaultFactor();
            },
            immediate: true,
        },
        date() {
            this.refreshPurchaseDocumentToDefaultFactor();
        },
    },
    computed: {
        visibleTabs() {
            const tabs = [{ name: 'info', label: this.$t('infoAndProducts') }];
            if (this.editingItemId) {
                tabs.push({ name: 'transactions', label: this.$t('transactions') });
                tabs.push({ name: 'receipts', label: this.$t('receipt') });
            }
            return tabs;
        },
        isEditablePurchase() {
            if (this.editingItemId == null) {
                return true;
            }
            return this.editingItem?.status === 'draft';
        },
        canEditMainInfo() {
            return this.isEditablePurchase;
        },
        canEditStatus() {
            if (!canWarehousePurchase(this.$store.getters, 'update')) {
                return false;
            }
            if (this.editingItemId == null) {
                return true;
            }
            const current = this.editingItem?.status ?? this.status;
            return current === 'draft';
        },
        purchaseStatusReadonlyLabel() {
            if (this.status === 'completed') {
                return this.$t('purchaseStatusCompleted');
            }
            if (this.status === 'approved') {
                return this.$t('purchaseStatusApproved');
            }
            return this.$t('purchaseStatusDraft');
        },
        showDraftPurchaseStatusOption() {
            if (this.editingItemId == null) {
                return true;
            }
            return (this.editingItem?.status ?? this.status) === 'draft';
        },
        canSave() {
            if (this.editingItemId != null) {
                return canWarehousePurchase(this.$store.getters, 'update') && this.isEditablePurchase;
            }
            return this.$store.getters.hasPermission('warehouse_purchases_create');
        },
        canPay() {
            return Boolean(this.editingItemId) && canWarehousePurchase(this.$store.getters, 'update');
        },
        purchaseDocumentCurrencySymbol() {
            if (!this.currencyId) {
                const defaultCurrency = this.currencies.find((c) => c.isDefault);
                return defaultCurrency ? defaultCurrency.symbol : '';
            }
            const currency = this.currencies.find((c) => Number(c.id) === Number(this.currencyId));
            return currency?.symbol ?? '';
        },
        clientBalances() {
            return this.selectedClient?.balances ?? [];
        },
        transactionTabClientBalances() {
            return balancesForDocumentPayment(this.clientBalances, this.clientBalanceId);
        },
        canCreateReceiptFromPurchase() {
            if (!this.editingItemId) {
                return false;
            }
            if (!this.$store.getters.hasPermission('warehouse_receipts_create')) {
                return false;
            }
            if (this.status === 'draft') {
                return false;
            }
            return this.receiptCreateContext.catalog.length > 0;
        },
        receiptCreateContext() {
            const catalog = [];
            const caps = {};
            for (const line of this.products) {
                const rem = Number(line.remainingReceiptQuantity);
                if (rem <= 0) {
                    continue;
                }
                const productId = Number(line.productId);
                caps[productId] = rem;
                catalog.push({
                    id: productId,
                    name: line.productName,
                    type: 1,
                    image: line.productImage,
                    unitId: line.unitId,
                    unitShortName: line.unitShortName,
                    purchasePrice: line.price,
                    retailPrice: line.price,
                });
            }
            return {
                purchaseId: this.editingItemId,
                supplier: this.selectedClient,
                warehouseId: this.warehouseId,
                catalog,
                caps,
                initialProducts: WarehouseReceiptProductDto.initialLinesFromPurchase(this.products),
            };
        },
        isPurchaseCurrencyDefault() {
            const def = this.currencies.find((c) => c.isDefault);
            if (!def || !this.currencyId) {
                return true;
            }
            return Number(def.id) === Number(this.currencyId);
        },
        purchaseEffectiveDocumentToDefaultFactor() {
            if (this.isPurchaseCurrencyDefault) {
                return 1;
            }
            const factor = Number(this.purchaseDocumentToDefaultFactor);
            return factor > 1 ? factor : 1;
        },
        purchaseFooterDefaultTotal() {
            if (this.isPurchaseCurrencyDefault) {
                return 0;
            }
            const factor = this.purchaseEffectiveDocumentToDefaultFactor;
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
        purchaseFooterDefHint() {
            if (this.isPurchaseCurrencyDefault) {
                return null;
            }
            const def = this.currencies.find((c) => c.isDefault);
            const defAmount = this.purchaseFooterDefaultTotal;
            if (!defAmount) {
                return null;
            }
            const formatted = formatCurrencyForDisplay(defAmount, def?.symbol ?? '', true);
            return this.$t('productSearchEquivDefaultCurrency', { amount: formatted });
        },
        purchaseFooterTotalFormatted() {
            return formatCurrencyForDisplay(this.purchaseOrigAmount, this.purchaseDocumentCurrencySymbol, true);
        },
    },
    mounted() {
        this.$nextTick(async () => {
            await Promise.all([
                this.fetchAllWarehouses(),
                this.fetchCurrencies(),
                this.fetchAllCashRegisters(),
            ]);
            if (!this.warehouseId && this.allWarehouses.length) {
                this.warehouseId = this.allWarehouses[0].id;
            }
            this.applyDefaultsForCreate();
            await this.refreshPurchaseDocumentToDefaultFactor();
            this.saveInitialState();
        });
    },
    methods: {
        applyDefaultsForCreate() {
            if (this.editingItemId != null) {
                return;
            }
            if (!this.currencyId && this.currencies.length) {
                const defaultCurrency = this.currencies.find((c) => c.isDefault);
                this.currencyId = defaultCurrency?.id ?? this.currencies[0].id;
            }
            if (!this.cashId && this.cashRegistersForForm.length) {
                this.cashId = this.cashRegistersForForm[0].id;
            }
        },
        async fetchAllWarehouses() {
            if (this.$store.getters.warehouses?.length) {
                this.allWarehouses = this.$store.getters.warehouses;
                return;
            }

            await this.$store.dispatch('loadWarehouses');
            this.allWarehouses = this.$store.getters.warehouses || [];
        },
        async fetchCurrencies() {
            if (this.$store.getters.currencies?.length) {
                this.currencies = this.$store.getters.currencies;
                await this.refreshPurchaseDocumentToDefaultFactor();
                return;
            }
            await this.$store.dispatch('loadCurrencies');
            this.currencies = this.$store.getters.currencies || [];
            await this.refreshPurchaseDocumentToDefaultFactor();
        },
        async fetchAllCashRegisters() {
            if (this.$store.getters.cashRegisters?.length) {
                this.allCashRegisters = this.$store.getters.cashRegisters;
                return;
            }
            await this.$store.dispatch('loadCashRegisters');
            this.allCashRegisters = this.$store.getters.cashRegisters || [];
        },
        changeTab(tabName) {
            this.currentTab = tabName;
        },
        async refreshPurchaseDocumentToDefaultFactor() {
            this.purchaseDocumentToDefaultFactor = await fetchDocumentToDefaultFactor(
                this.currencyId,
                this.currencies,
                this.date,
            );
        },
        async onPurchaseRefreshed(fresh) {
            this.applyPurchaseFromServer(fresh);
        },
        onPurchaseTotalsChanged(totals) {
            this.purchaseFooterTxnGoods = totals || null;
        },
        async onReceiptSaved() {
            if (!this.editingItemId) {
                return;
            }
            const fresh = await WarehousePurchaseController.getItem(this.editingItemId);
            this.applyPurchaseFromServer(fresh);
            this.currentTab = 'receipts';
        },
        onTabError(error) {
            const message = this.getApiErrorMessage(error);
            this.showNotification(this.$t('error'), message || this.$t('error'), true);
        },
        onSelectedClientUpdated(client) {
            const prevId = Number(this.selectedClient?.id) || null;
            const nextId = Number(client?.id) || null;
            if (prevId !== nextId) {
                this.clientBalanceId = null;
            }
            this.selectedClient = client;
        },
        onBalanceChanged(balanceId) {
            this.clientBalanceId = balanceId ?? null;
            if (balanceId) {
                this.applyBalanceDefaults(balanceId);
                return;
            }
            this.applyDefaultsForCreate();
        },
        getFormState() {
            return {
                selectedClientId: this.selectedClient?.id ?? null,
                warehouseId: this.warehouseId,
                cashId: this.cashId,
                currencyId: this.currencyId,
                clientBalanceId: this.clientBalanceId,
                date: this.date,
                note: this.note,
                status: this.status,
                products: this.mapProductsForSave(),
            };
        },
        prepareSave() {
            const errors = [];
            if (!this.selectedClient?.id) {
                errors.push('• Выберите поставщика');
            }
            if (!this.products?.length) {
                errors.push('• Добавьте товары');
            }
            if (!this.warehouseId) {
                errors.push('• Выберите склад');
            }
            if (!this.cashId) {
                errors.push('• Выберите кассу');
            }
            if (!this.currencyId) {
                errors.push('• Выберите валюту');
            }
            const invalidProducts = this.products.filter((p) => !p.productId || !p.quantity || Number(p.quantity) <= 0);
            if (invalidProducts.length) {
                errors.push('• Проверьте товары и количество');
            }
            if (errors.length) {
                const text = errors.join('\n');
                this.emitSavedError(text);
                throw new Error(text);
            }

            return {
                supplierId: this.selectedClient.id,
                warehouseId: this.warehouseId,
                cashId: this.cashId,
                currencyId: this.currencyId,
                clientBalanceId: this.clientBalanceId || null,
                date: this.date,
                note: this.note,
                status: this.status,
                products: this.mapProductsForSave(),
            };
        },
        mapProductsForSave() {
            return this.products.map((p) => ({
                productId: p.productId ?? p.product_id,
                quantity: p.quantity,
                price: warehouseLinePriceForSave(p),
                ...lineOrigSavePayload(p),
            }));
        },
        applyPurchaseDocumentTotals(purchase) {
            const applied = applyDocumentFromApiResponse(purchase, 'warehouse');
            this.purchaseOrigAmount = applied.documentTotalPrice;
            if (applied.products) {
                this.products = applied.products;
            }
        },
        async performSave(data) {
            let resp;
            if (this.editingItemId != null) {
                resp = await WarehousePurchaseController.updateItem(this.editingItemId, data);
            } else {
                resp = await WarehousePurchaseController.storeItem(data);
            }
            this.applyPurchaseDocumentTotals(resp.item);
            return resp;
        },
        async performDelete() {
            const response = await WarehousePurchaseController.deleteItem(this.editingItemId);
            if (!response?.message) {
                throw new Error('Failed to delete purchase');
            }
            return response;
        },
        clearForm() {
            this.selectedClient = null;
            this.clientBalanceId = null;
            this.date = this.getCurrentLocalDateTime();
            this.warehouseId = this.allWarehouses?.length ? this.allWarehouses[0].id : '';
            this.cashId = '';
            this.currencyId = '';
            this.note = '';
            this.status = 'draft';
            this.products = [];
            this.transactions = [];
            this.receipts = [];
            this.purchaseFooterTxnGoods = null;
            this.purchaseOrigAmount = null;
            this.currentTab = 'info';
            this.applyDefaultsForCreate();
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        applyPurchaseFromServer(newEditingItem) {
            if (!newEditingItem) {
                return;
            }
            this.selectedClient = newEditingItem.supplier || null;
            this.warehouseId = newEditingItem.warehouseId ?? '';
            this.cashId = newEditingItem.cashId ?? '';
            this.currencyId = newEditingItem.origCurrencyId ?? newEditingItem.currencyId ?? '';
            this.clientBalanceId = newEditingItem.clientBalanceId ?? null;
            this.date = newEditingItem.date ? this.getFormattedDate(newEditingItem.date) : this.getCurrentLocalDateTime();
            this.note = newEditingItem.note || '';
            this.status = newEditingItem.status || 'draft';
            this.products = newEditingItem.products ?? [];
            this.transactions = newEditingItem.transactions || [];
            this.receipts = newEditingItem.receipts || [];
            this.goodsPaymentRemainingDefault = newEditingItem.goodsPaymentRemainingDefault ?? null;
            this.applyPurchaseDocumentTotals(newEditingItem);
            this.$nextTick(() => this.refreshPurchaseDocumentToDefaultFactor());
        },
        onEditingItemChanged(newEditingItem) {
            this.applyPurchaseFromServer(newEditingItem);
            this.currentTab = 'info';
        },
    },
};
</script>

<style>
html.dark .warehouse-purchase-create__products label:not([type="checkbox"]) {
    color: #ffffff;
}

html.dark .warehouse-purchase-create__footer {
    color: #ffffff;
}
</style>

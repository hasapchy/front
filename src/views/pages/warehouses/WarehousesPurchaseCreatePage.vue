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
          @update:selected-client="selectedClient = $event"
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
            :disabled="!canEditMainInfo || balanceLocksCurrencyCash"
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
          <label class="block mb-1 required">{{ $t('cashRegister') }}</label>
          <select
            v-model="cashId"
            :disabled="!canEditMainInfo || balanceLocksCurrencyCash"
          >
            <option value="">
              {{ $t('no') }}
            </option>
            <option
              v-for="cash in cashRegistersForSelect"
              :key="cash.id"
              :value="cash.id"
            >
              {{ cash.displayName || cash.name }} ({{ cash.currencySymbol }})
            </option>
          </select>
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
            v-model="status"
            :disabled="!canEditStatus"
          >
            <option value="draft">{{ $t('purchaseStatusDraft') }}</option>
            <option value="approved">{{ $t('purchaseStatusApproved') }}</option>
            <option value="completed">{{ $t('purchaseStatusCompleted') }}</option>
          </select>
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
          :disabled="!canEditMainInfo"
          :show-quantity="true"
          :show-price="true"
          :is-receipt="true"
          :show-amount="false"
          :only-products="true"
          :warehouse-id="warehouseId"
          :allow-all-warehouse-products="true"
          required
        />
      </div>

      <div v-show="currentTab === 'transactions'">
        <WarehousePurchaseTransactionsTab
          :purchase-id="editingItemId"
          :can-pay="canPay"
          :transactions="transactions"
          :client="selectedClient"
          :client-balance-id="clientBalanceId"
          :client-balances="clientBalances"
          :cash-registers-for-select="cashRegistersForSelect"
          :currencies="currencies"
          :default-cash-id="cashId"
          :default-currency-id="currencyId"
          :balance-locks-currency-cash="balanceLocksCurrencyCash"
          @purchase-refreshed="onPurchaseRefreshed"
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
      <div class="flex w-full flex-wrap items-center gap-2">
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
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import ProductSearch from '@/views/components/app/search/ProductSearch.vue';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import WarehousePurchaseTransactionsTab from '@/views/pages/warehouses/WarehousePurchaseTransactionsTab.vue';
import WarehousePurchaseReceiptsTab from '@/views/pages/warehouses/WarehousePurchaseReceiptsTab.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import notificationMixin from '@/mixins/notificationMixin';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import { dateFormMixin } from '@/utils/dateUtils';
import { filterCashRegistersByClientBalance } from '@/utils/clientBalanceCashUtils';

export default {
    components: {
        PrimaryButton,
        AlertDialog,
        ClientSearch,
        ProductSearch,
        TabBar,
        WarehousePurchaseTransactionsTab,
        WarehousePurchaseReceiptsTab,
    },
    mixins: [getApiErrorMessage, notificationMixin, crudFormMixin, dateFormMixin, sideModalFooterPortal],
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
            clientBalanceId: this.editingItem?.client_balance_id ?? null,
            date: this.editingItem?.date ? this.getFormattedDate(this.editingItem.date) : this.getCurrentLocalDateTime(),
            warehouseId: this.editingItem?.warehouse_id ?? '',
            cashId: this.editingItem?.cash_id ?? '',
            currencyId: this.editingItem?.currency_id ?? '',
            note: this.editingItem?.note || '',
            status: this.editingItem?.status || 'draft',
            products: this.mapProductsFromItem(this.editingItem?.products || []),
            transactions: this.editingItem?.transactions || [],
            receipts: this.editingItem?.receipts || [],
            allWarehouses: [],
            allCashRegisters: [],
            currencies: [],
        };
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
            return this.isEditablePurchase;
        },
        canSave() {
            if (this.editingItemId != null) {
                return this.$store.getters.hasPermission('warehouse_purchases_update') && this.isEditablePurchase;
            }
            return this.$store.getters.hasPermission('warehouse_purchases_create');
        },
        canPay() {
            return Boolean(this.editingItemId) && this.$store.getters.hasPermission('warehouse_purchases_update');
        },
        clientBalances() {
            return this.selectedClient?.balances ?? [];
        },
        selectedBalanceRecord() {
            if (!this.clientBalanceId || !this.clientBalances?.length) {
                return null;
            }
            return this.clientBalances.find((b) => Number(b.id) === Number(this.clientBalanceId)) ?? null;
        },
        balanceLocksCurrencyCash() {
            return Boolean(this.selectedClient?.id && this.clientBalanceId && this.selectedBalanceRecord);
        },
        cashRegistersForSelect() {
            if (!this.balanceLocksCurrencyCash || !this.selectedBalanceRecord) {
                return this.allCashRegisters;
            }
            return filterCashRegistersByClientBalance(this.selectedBalanceRecord, this.allCashRegisters);
        },
        canCreateReceiptFromPurchase() {
            if (!this.editingItemId) {
                return false;
            }
            if (!this.$store.getters.hasPermission('warehouse_receipts_create')) {
                return false;
            }
            return this.status !== 'draft';
        },
        receiptCreateContext() {
            return {
                purchaseId: this.editingItemId,
                supplier: this.selectedClient,
                warehouseId: this.warehouseId,
                products: this.products.map((p) => ({
                    ...p,
                    priceLocked: true,
                })),
            };
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
            if (!this.cashId && this.cashRegistersForSelect.length) {
                this.cashId = this.cashRegistersForSelect[0].id;
            }
        },
        applyBalanceDefaults(balanceId) {
            const row = this.clientBalances.find((b) => Number(b.id) === Number(balanceId));
            if (!row) {
                return;
            }
            const list = filterCashRegistersByClientBalance(row, this.allCashRegisters);
            const balanceCurrencyId = row.currencyId ?? row.currency_id ?? null;
            if (balanceCurrencyId) {
                this.currencyId = balanceCurrencyId;
            }
            const currentOk = list.some((c) => Number(c.id) === Number(this.cashId));
            if (!currentOk && list.length) {
                this.cashId = list[0].id;
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
                return;
            }
            await this.$store.dispatch('loadCurrencies');
            this.currencies = this.$store.getters.currencies || [];
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
        mapProductsFromItem(lines) {
            return (lines || []).map((line) => ({
                productId: line.product_id ?? line.productId,
                productName: line.product_name ?? line.productName,
                productImage: line.product_image ?? line.productImage,
                unitId: line.unit_id ?? line.unitId,
                unitName: line.unit_name ?? line.unitName,
                unitShortName: line.unit_short_name ?? line.unitShortName,
                quantity: Number(line.quantity) || 0,
                price: Number(line.price) || 0,
            }));
        },
        async onPurchaseRefreshed(fresh) {
            this.onEditingItemChanged(fresh);
        },
        async onReceiptSaved() {
            if (!this.editingItemId) {
                return;
            }
            const fresh = await WarehousePurchaseController.getItem(this.editingItemId);
            this.onEditingItemChanged(fresh);
        },
        onTabError(error) {
            const message = this.getApiErrorMessage(error);
            this.showNotification(this.$t('error'), message || this.$t('error'), true);
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
                products: this.products.map((p) => ({
                    productId: p.productId,
                    quantity: p.quantity,
                    price: p.price,
                })),
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
                products: this.products.map((p) => ({
                    productId: p.productId,
                    quantity: p.quantity,
                    price: p.price,
                })),
            };
        },
        async performSave(data) {
            if (this.editingItemId != null) {
                return await WarehousePurchaseController.updateItem(this.editingItemId, data);
            }
            return await WarehousePurchaseController.storeItem(data);
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
            this.currentTab = 'info';
            this.applyDefaultsForCreate();
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            if (!newEditingItem) {
                return;
            }
            this.selectedClient = newEditingItem.supplier || null;
            this.warehouseId = newEditingItem.warehouse_id ?? '';
            this.cashId = newEditingItem.cash_id ?? '';
            this.currencyId = newEditingItem.currency_id ?? '';
            this.clientBalanceId = newEditingItem.client_balance_id ?? null;
            this.date = newEditingItem.date ? this.getFormattedDate(newEditingItem.date) : this.getCurrentLocalDateTime();
            this.note = newEditingItem.note || '';
            this.status = newEditingItem.status || 'draft';
            this.products = this.mapProductsFromItem(newEditingItem.products || []);
            this.transactions = newEditingItem.transactions || [];
            this.receipts = newEditingItem.receipts || [];
            this.currentTab = 'info';
        },
    },
};
</script>

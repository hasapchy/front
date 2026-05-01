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
          v-model:selected-client="selectedClient"
          :only-suppliers="true"
          label-key="supplier"
          :disabled="!!editingItemId"
          :balance-id="clientBalanceId"
          required
          @balance-changed="onBalanceChanged"
        />

        <div>
          <label>{{ $t('date') }}</label>
          <input
            v-model="date"
            type="datetime-local"
            :disabled="!!editingItemId && !canEditDate()"
            :min="getMinDate()"
          >
        </div>
        <div class="mt-2">
          <label class="block mb-1 required">{{ $t('warehouse') }}</label>
          <div class="flex items-center space-x-2">
            <select
              v-model="warehouseId"
              :disabled="!!editingItemId"
            >
              <option value="">
                {{ $t('no') }}
              </option>
              <option
                v-for="parent in allWarehouses"
                :key="parent.id"
                :value="parent.id"
              >
                {{ parent.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="mt-2">
          <label class="block mb-1 required">{{ $t('cashRegister') }}</label>
          <select
            v-model="cashId"
            :disabled="!!editingItemId"
          >
            <option value="">
              {{ $t('no') }}
            </option>
            <option
              v-for="c in cashRegistersForSelect"
              :key="c.id"
              :value="c.id"
            >
              {{ c.displayName || c.name }} ({{ c.currencySymbol  }})
            </option>
          </select>
        </div>

        <div
          v-if="showReceiptStatusSelect"
          class="mt-2"
        >
          <label class="block mb-1">{{ $t('receiptStatus') }}</label>
          <select v-model="status">
            <option value="in_transit">
              {{ $t('receiptStatusInTransit') }}
            </option>
            <option value="customs_clearance">
              {{ $t('receiptStatusCustoms') }}
            </option>
            <option value="purchasing">
              {{ $t('receiptStatusPurchasing') }}
            </option>
            <option value="fully_received">
              {{ $t('receiptStatusFullyReceived') }}
            </option>
          </select>
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
          :disabled="isReadOnlyProducts"
          :show-quantity="true"
          :show-price="true"
          :is-receipt="true"
          :show-amount="editingItemId == null"
          :only-products="true"
          :warehouse-id="warehouseId"
          :allow-all-warehouse-products="true"
          required
        />

        <div
          v-if="editingItemId && editingItem?.landedCost"
          class="mt-6 rounded border border-gray-200 bg-[var(--surface-muted)] p-3 dark:border-[var(--border-subtle)]"
        >
          <h4 class="mb-3 text-sm font-semibold text-gray-800 dark:text-[var(--text-primary)]">
            {{ $t('receiptLandedCostTitle') }}
          </h4>
          <div class="mb-3 grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <span class="text-gray-500 dark:text-[var(--text-secondary)]">{{ $t('receiptLandedCostGoodsSubtotal') }}</span>
              <div class="font-medium">
                {{ formatLandedAmount(editingItem.landedCost.goodsSubtotalDefault) }}
              </div>
            </div>
            <div>
              <span class="text-gray-500 dark:text-[var(--text-secondary)]">{{ $t('receiptLandedCostExpensesAllocated') }}</span>
              <div class="font-medium">
                {{ formatLandedAmount(editingItem.landedCost.expensesAllocatedTotal) }}
              </div>
            </div>
            <div>
              <span class="text-gray-500 dark:text-[var(--text-secondary)]">{{ $t('receiptLandedCostFullCost') }}</span>
              <div class="font-medium">
                {{ formatLandedAmount(editingItem.landedCost.fullCostDefault) }}
              </div>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr class="border-b border-gray-200 text-left text-gray-600 dark:border-[var(--border-subtle)] dark:text-[var(--text-secondary)]">
                  <th class="py-2 pr-2">
                    {{ $t('product') }}
                  </th>
                  <th class="py-2 pr-2">
                    {{ $t('quantity') }}
                  </th>
                  <th class="py-2 pr-2">
                    {{ $t('receiptLandedCostLineSubtotal') }}
                  </th>
                  <th class="py-2 pr-2">
                    {{ $t('receiptLandedCostAllocated') }}
                  </th>
                  <th class="py-2">
                    {{ $t('receiptLandedCostLineTotal') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="p in products"
                  :key="p.id || p.productId"
                  class="border-b border-gray-100 dark:border-[var(--border-subtle)]"
                >
                  <td class="py-2 pr-2">
                    {{ p.productName }}
                  </td>
                  <td class="py-2 pr-2">
                    {{ p.quantity }}{{ p.unitShortName ? ` ${p.unitShortName}` : '' }}
                  </td>
                  <td class="py-2 pr-2">
                    {{ formatLandedAmount(p.lineSubtotalDefault) }}
                  </td>
                  <td class="py-2 pr-2">
                    {{ formatLandedAmount(p.allocatedExpensesDefault) }}
                  </td>
                  <td class="py-2">
                    {{ formatLandedAmount(p.landedLineTotalDefault) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-show="currentTab === 'waybills'">
        <WarehouseReceiptWaybillsPage
          v-if="waybillsTabVisited"
          :receipt-id="editingItemId"
          :warehouse-id="warehouseId"
          :can-edit-waybills="canEditWaybills"
          @changed="onWaybillsChanged"
        />
      </div>

      <div v-show="currentTab === 'transactions'">
        <WarehouseReceiptTransactionsTab
          v-if="transactionsTabVisited && editingItemId"
          :receipt-id="editingItemId"
          :client="selectedClient"
          :project-id="editingItem?.projectId"
          :cash-id="cashId"
          :goods-payment-remaining-default="editingItem?.goodsPaymentRemainingDefault ?? null"
          @finance-changed="onReceiptFinanceChanged"
        />
      </div>
    </div>

    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center justify-between gap-4 md:flex-nowrap">
        <div class="flex items-center space-x-2">
          <PrimaryButton
            v-if="editingItemId != null"
            :onclick="showDeleteDialog"
            :is-danger="true"
            :is-loading="deleteLoading"
            icon="fas fa-trash"
            :disabled="!$store.getters.hasPermission('warehouse_receipts_delete')"
          />
          <PrimaryButton
            icon="fas fa-save"
            :onclick="save"
            :is-loading="saveLoading"
            :disabled="(editingItemId != null && !$store.getters.hasPermission('warehouse_receipts_update')) ||
              (editingItemId == null && !$store.getters.hasPermission('warehouse_receipts_create'))"
            :aria-label="$t('save')"
          />
        </div>

        <div
          v-if="products && products.length > 0"
          class="text-sm text-gray-700 flex flex-wrap md:flex-nowrap gap-x-4 gap-y-1 font-medium"
        >
          <div>{{ $t('total') }}: <span class="font-bold">{{ $formatNumber(totalAmount, null, true) }} {{ defaultCurrencySymbol }}</span></div>
        </div>
      </div>
    </teleport>
    <AlertDialog
      :dialog="deleteDialog"
      :descr="$t('deleteReceiptConfirm')"
      :confirm-text="$t('deleteReceipt')"
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
import WarehouseReceiptController from '@/api/WarehouseReceiptController';
import { filterCashRegistersByClientBalance } from '@/utils/clientBalanceCashUtils';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import ProductSearch from '@/views/components/app/search/ProductSearch.vue';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import WarehouseReceiptWaybillsPage from '@/views/pages/warehouses/WarehouseReceiptWaybillsPage.vue';
import WarehouseReceiptTransactionsTab from '@/views/pages/warehouses/WarehouseReceiptTransactionsTab.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from "@/mixins/crudFormMixin";
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import { dateFormMixin } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/numberUtils';

export default {
    components: {
        PrimaryButton,
        AlertDialog,
        ClientSearch,
        ProductSearch,
        TabBar,
        WarehouseReceiptWaybillsPage,
        WarehouseReceiptTransactionsTab,
    },
    mixins: [getApiErrorMessage, crudFormMixin, dateFormMixin, sideModalFooterPortal],
    props: {
        editingItem: {
            type: Object,
            default: null,
        },
        createMode: { type: String, default: 'default' },
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request', 'receipt-refreshed'],
    data() {
        return {
            currentTab: 'info',
            waybillsTabVisited: false,
            transactionsTabVisited: false,
            date: this.editingItem?.date ? this.getFormattedDate(this.editingItem.date) : this.getCurrentLocalDateTime(),
            note: this.editingItem ? this.editingItem.note : '',
            warehouseId: this.editingItem ? this.editingItem.warehouseId  : '',
            cashId: this.editingItem ? this.editingItem.cashId : '',
            products: this.editingItem ? this.editingItem.products : [],
            selectedClient: this.editingItem ? this.editingItem.client : null,
            clientBalanceId: this.editingItem?.clientBalanceId ?? this.editingItem?.client_balance_id ?? null,
            status: this.editingItem?.status
                ?? (this.editingItem?.isSimple || (!this.editingItem && this.createMode === 'simple')
                    ? 'fully_received'
                    : 'purchasing'),
            allWarehouses: [],
            currencies: [],
            allCashRegisters: [],
        };
    },
    computed: {
        isSimpleCreate() {
            return !this.editingItemId && this.createMode === 'simple';
        },
        isSimpleReceiptLocked() {
            return Boolean(this.editingItem?.isSimple);
        },
        showReceiptStatusSelect() {
            return !this.isSimpleCreate && !this.isSimpleReceiptLocked;
        },
        isReadOnlyProducts() {
            return !!this.editingItemId && (this.isSimpleReceiptLocked || !this.editingItem?.isLegacy);
        },
        canEditWaybills() {
            return this.$store.getters.hasPermission('warehouse_receipts_update')
                && this.editingItemId
                && !this.editingItem?.isLegacy
                && !this.editingItem?.isSimple;
        },
        visibleTabs() {
            const tabs = [
                { name: 'info', label: this.$t('receiptTabMain') },
            ];
            if (this.editingItemId && !this.editingItem?.isLegacy && !this.editingItem?.isSimple) {
                tabs.push({ name: 'waybills', label: this.$t('receiptTabWaybills') });
            }
            if (this.editingItemId) {
                tabs.push({ name: 'transactions', label: this.$t('receiptTabTransactions') });
            }
            return tabs;
        },
        totalAmount() {
            if (!this.products?.length) return 0;
            return this.products.reduce((sum, product) => {
                if (product.amount !== null && product.amount !== undefined) {
                    return sum + (Number(product.amount) || 0);
                }
                const quantity = Number(product.quantity) || 0;
                const price = Number(product.price) || 0;
                return sum + (quantity * price);
            }, 0);
        },
        defaultCurrencySymbol() {
            const defaultCurrency = this.currencies.find(c => c.isDefault);
            return defaultCurrency ? defaultCurrency.symbol : '';
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
    },
    watch: {
        allCashRegisters: {
            handler(newRegisters) {
                if (newRegisters?.length && this.clientBalanceId && this.balanceLocksCurrencyCash) {
                    this.applyBalanceDefaults(this.clientBalanceId);
                }
            },
            immediate: true,
        },
        editingItemId(val) {
            if (!val) {
                this.currentTab = 'info';
                this.waybillsTabVisited = false;
                this.transactionsTabVisited = false;
            }
        },
    },
    mounted() {
        this.$nextTick(async () => {
            await Promise.all([
                this.fetchCurrencies(),
                this.fetchAllWarehouses(),
                this.fetchAllCashRegisters()
            ]);

            if (!this.editingItem) {
                if (this.allWarehouses?.length && !this.warehouseId) {
                    this.warehouseId = this.allWarehouses[0].id;
                }
            }

            this.saveInitialState();
        });
    },
    methods: {
        changeTab(tabName) {
            this.currentTab = tabName;
            if (tabName === 'waybills') {
                this.waybillsTabVisited = true;
            }
            if (tabName === 'transactions') {
                this.transactionsTabVisited = true;
            }
        },
        formatLandedAmount(value) {
            if (value == null || Number.isNaN(Number(value))) {
                return '—';
            }
            const sym = this.editingItem?.landedCost?.defaultCurrencySymbol ?? '';
            return formatCurrency(Number(value), sym);
        },
        async onReceiptFinanceChanged() {
            if (!this.editingItemId) {
                return;
            }
            const dto = await WarehouseReceiptController.getItem(this.editingItemId);
            if (dto?.products) {
                this.products = dto.products;
            }
            this.$emit('receipt-refreshed', dto);
        },
        async onWaybillsChanged() {
            await this.$store.dispatch('invalidateCache', { type: 'products' });
            await this.$store.dispatch('loadAllProducts');
        },
        applyBalanceDefaults(balanceId) {
            const row = this.clientBalances.find((b) => Number(b.id) === Number(balanceId));
            if (!row) {
                return;
            }
            const list = filterCashRegistersByClientBalance(row, this.allCashRegisters);
            const currentOk = list.some((c) => Number(c.id) === Number(this.cashId));
            if (!currentOk && list.length) {
                this.cashId = list[0].id;
            }
        },
        onBalanceChanged(balanceId) {
            this.clientBalanceId = balanceId ?? null;
            if (balanceId) {
                this.applyBalanceDefaults(balanceId);
            }
        },
        getFormState() {
            return {
                warehouseId: this.warehouseId,
                clientId: this.selectedClient?.id,
                clientBalanceId: this.clientBalanceId,
                date: this.date,
                note: this.note,
                status: this.status,
                products: this.products.map(p => ({ ...p }))
            };
        },
        async fetchAllWarehouses() {
            if (this.$store.getters.warehouses?.length) {
                this.allWarehouses = this.$store.getters.warehouses;
                return;
            }
            await this.$store.dispatch('loadWarehouses');
            this.allWarehouses = this.$store.getters.warehouses;
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
            } else {
                await this.$store.dispatch('loadCashRegisters');
                this.allCashRegisters = this.$store.getters.cashRegisters;
            }
            if (!this.cashId && this.allCashRegisters?.length && !this.balanceLocksCurrencyCash) {
                this.cashId = this.allCashRegisters[0].id;
            }
        },

        prepareSave() {
            const validationErrors = [];

            if (!this.selectedClient?.id) {
                validationErrors.push('• Выберите клиента (поставщика)');
            }

            if (!this.warehouseId) {
                validationErrors.push('• Выберите склад');
            }

            if (!this.cashId) {
                validationErrors.push('• Выберите кассу');
            }

            if (!this.products?.length) {
                validationErrors.push('• Добавьте товары');
            }

            const invalidProducts = this.products.filter(p =>
                !p.productId || !p.quantity || p.quantity <= 0 || !p.price || p.price < 0
            );

            if (invalidProducts?.length) {
                validationErrors.push('• У некоторых товаров не заполнены обязательные поля (ID, количество, цена)');
            }

            if (validationErrors?.length) {
                this.emitSavedError(validationErrors.join('\n'));
                throw new Error(validationErrors.join('\n'));
            }

            const productsData = this.products.map(product => ({
                productId: product.productId,
                quantity: product.quantity,
                price: product.price,
            }));

            return {
                clientId: this.selectedClient?.id,
                clientBalanceId: this.clientBalanceId || null,
                warehouseId: this.warehouseId,
                date: this.date,
                note: this.note,
                cashId: this.cashId,
                status: (this.isSimpleCreate || this.isSimpleReceiptLocked) ? 'fully_received' : this.status,
                isLegacy: false,
                isSimple: this.isSimpleCreate,
                products: productsData
            };
        },
        async performSave(data) {
            if (this.editingItemId != null) {
                return await WarehouseReceiptController.updateItem(this.editingItemId, {
                    date: data.date,
                    note: data.note,
                    status: data.status,
                });
            }
            return await WarehouseReceiptController.storeItem(data);
        },
        async performDelete() {
            const resp = await WarehouseReceiptController.deleteItem(this.editingItemId);
            if (!resp.message) {
                throw new Error('Failed to delete receipt');
            }
            return resp;
        },
        onSaveSuccess(response) {
            if (response && (response.message || response.data)) {
                this.$store.dispatch('invalidateCache', { type: 'products' }).then(() => {
                    return this.$store.dispatch('loadAllProducts');
                });
                if (response.data?.id) {
                    if (this.resetFormChanges) {
                        this.resetFormChanges();
                    }
                    return;
                }
                if (this.editingItemId) {
                    if (this.resetFormChanges) {
                        this.resetFormChanges();
                    }
                    return;
                }
                this.clearForm();
            }
        },
        clearForm() {
            this.date = this.getCurrentLocalDateTime();
            this.note = '';
            this.warehouseId = '';
            this.selectedClient = null;
            this.clientBalanceId = null;
            this.products = [];
            this.status = this.createMode === 'simple' ? 'fully_received' : 'purchasing';
            this.cashId = this.allCashRegisters?.length ? this.allCashRegisters[0].id : '';
            this.currentTab = 'info';
            this.waybillsTabVisited = false;
            this.transactionsTabVisited = false;
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            if (newEditingItem) {
                this.date = newEditingItem.date ;
                this.note = newEditingItem.note ;
                this.warehouseId = newEditingItem.warehouseId ;
                this.selectedClient = newEditingItem.client || null;
                this.clientBalanceId = newEditingItem.clientBalanceId ?? newEditingItem.client_balance_id ?? null;
                this.products = newEditingItem.products || [];
                this.cashId = newEditingItem.cashId ;
                this.status = newEditingItem.status || 'purchasing';
            }
        },
    }
};
</script>

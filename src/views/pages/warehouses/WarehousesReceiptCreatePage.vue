<template>
  <div class="flex flex-col h-full min-h-0">
    <div class="flex-1 min-h-0 overflow-y-auto p-4">
      <TabBar
        :tabs="visibleTabs"
        :active-tab="currentTab"
        :tab-click="changeTab"
      />

      <p
        v-if="isReceiptCompleted"
        class="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/45 dark:bg-amber-950/35 dark:text-amber-50"
      >
        {{ $t('receiptCompletedReadonlyBanner') }}
      </p>

      <div v-show="currentTab === 'info'">
        <ClientSearch
          :selected-client="selectedClient"
          :only-suppliers="true"
          label-key="supplier"
          :disabled="!!editingItemId || isReceiptCompleted || isLinkedPurchaseCreate"
          :balance-id="clientBalanceId"
          required
          @update:selected-client="selectedClient = $event"
          @balance-changed="onBalanceChanged"
        />

        <div>
          <label>{{ $t('date') }}</label>
          <input
            v-model="date"
            type="datetime-local"
            :disabled="(!!editingItemId && !canEditDate()) || isReceiptCompleted"
            :min="getMinDate()"
          >
        </div>
        <div class="mt-2">
          <label class="block mb-1 required">{{ $t('warehouse') }}</label>
          <div class="flex items-center space-x-2">
            <select
              v-model="warehouseId"
              :disabled="!!editingItemId || isReceiptCompleted || isLinkedPurchaseCreate"
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
            :disabled="!!editingItemId || isReceiptCompleted"
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
          <select
            v-model="status"
            :disabled="isReceiptCompleted"
          >
            <template v-if="isReceiptCompleted">
              <option value="completed">
                {{ $t('receiptStatusCompleted') }}
              </option>
            </template>
            <template v-else>
              <option value="draft">
                {{ $t('receiptStatusDraft') }}
              </option>
              <option value="completed">
                {{ $t('receiptStatusCompleted') }}
              </option>
            </template>
          </select>
        </div>

        <div class="mt-2">
          <label>{{ $t('note') }}</label>
          <input
            v-model="note"
            type="text"
            :disabled="isReceiptCompleted"
          >
        </div>

        <ProductSearch
          v-model="products"
          :disabled="isReadOnlyProducts || isReceiptCompleted"
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
          class="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
        >
          <div class="mb-4 inline-flex flex-wrap items-center gap-1">
            <h3 class="text-md m-0 font-semibold text-gray-900 dark:text-[var(--text-primary)]">
              {{ $t('receiptLandedCostTitle') }}
            </h3>
            <FieldHint
              :text="$t('receiptLandedCostIntro')"
              placement="top"
            />
          </div>

          <div class="mt-4 overflow-x-auto rounded-md border border-gray-200 dark:border-[var(--border-subtle)]">
            <table class="w-full min-w-[520px] border-collapse text-xs">
              <thead class="bg-gray-100 dark:bg-[var(--surface-muted)]">
                <tr>
                  <th class="align-top border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-[var(--label-accent)] dark:border-[var(--border-subtle)]">
                    <span class="inline-flex items-center gap-1">
                      {{ $t('product') }}
                      <FieldHint
                        :text="$t('receiptLandedCostProductColHint')"
                        placement="bottom"
                      />
                    </span>
                  </th>
                  <th class="align-top border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-[var(--label-accent)] dark:border-[var(--border-subtle)]">
                    <span class="inline-flex items-center gap-1">
                      {{ $t('quantity') }}
                      <FieldHint
                        :text="$t('receiptLandedCostQuantityColHint')"
                        placement="bottom"
                      />
                    </span>
                  </th>
                  <th class="align-top border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-[var(--label-accent)] dark:border-[var(--border-subtle)]">
                    <span class="inline-flex items-center gap-1">
                      {{ $t('receiptLandedCostLineSubtotal') }}
                      <FieldHint
                        :text="$t('receiptLandedCostLineSubtotalHint')"
                        placement="bottom"
                      />
                    </span>
                  </th>
                  <th class="align-top border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-[var(--label-accent)] dark:border-[var(--border-subtle)]">
                    <span class="inline-flex items-center gap-1">
                      {{ $t('receiptLandedCostAllocated') }}
                      <FieldHint
                        :text="$t('receiptLandedCostAllocatedHint')"
                        placement="bottom"
                      />
                    </span>
                  </th>
                  <th class="align-top border border-gray-300 px-3 py-2 text-left text-xs font-semibold text-[var(--label-accent)] dark:border-[var(--border-subtle)]">
                    <span class="inline-flex items-center gap-1">
                      {{ $t('receiptLandedCostLineTotal') }}
                      <FieldHint
                        :text="$t('receiptLandedCostLineTotalHint')"
                        placement="bottom"
                      />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="p in products"
                  :key="p.id || p.productId"
                  class="border-b border-gray-300 transition-colors hover:bg-gray-50 dark:border-[var(--border-subtle)] dark:hover:bg-[var(--surface-muted)]"
                >
                  <td class="border-x border-gray-300 px-3 py-2 font-medium text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]">
                    {{ p.productName }}
                  </td>
                  <td class="border-x border-gray-300 px-3 py-2 text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]">
                    {{ formatReceiptQuantity(p.quantity) }}{{ p.unitShortName ? ` ${p.unitShortName}` : '' }}
                  </td>
                  <td class="border-x border-gray-300 px-3 py-2 tabular-nums text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]">
                    {{ formatLandedAmount(p.lineSubtotalDefault) }}
                  </td>
                  <td class="border-x border-gray-300 px-3 py-2 tabular-nums text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]">
                    {{ formatLandedAmount(p.allocatedExpensesDefault) }}
                  </td>
                  <td class="border-x border-gray-300 px-3 py-2 tabular-nums font-medium text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]">
                    {{ formatLandedAmount(p.landedLineTotalDefault) }}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="border-t-2 border-gray-300 bg-[var(--surface-muted)] dark:border-[var(--border-subtle)] dark:bg-[var(--surface-muted)]">
                  <td
                    colspan="2"
                    class="border border-gray-300 px-3 py-2 text-xs font-semibold text-[var(--label-accent)] dark:border-[var(--border-subtle)]"
                  >
                    {{ $t('grandTotal') }}
                  </td>
                  <td class="border border-gray-300 px-3 py-2 text-right text-xs font-medium tabular-nums text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]">
                    {{ formatLandedAmount(editingItem.landedCost.goodsSubtotalDefault) }}
                  </td>
                  <td class="border border-gray-300 px-3 py-2 text-right text-xs font-medium tabular-nums text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]">
                    {{ formatLandedAmount(editingItem.landedCost.expensesAllocatedTotal) }}
                  </td>
                  <td class="border border-gray-300 px-3 py-2 text-right text-xs font-semibold tabular-nums text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]">
                    {{ formatLandedAmount(editingItem.landedCost.fullCostDefault) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <div v-show="currentTab === 'transactions'">
        <WarehouseReceiptTransactionsTab
          v-if="transactionsTabVisited && editingItemId"
          :receipt-id="editingItemId"
          :client="selectedClient"
          :cash-id="cashId"
          :client-balance-id="clientBalanceId"
          :client-balances="clientBalances"
          :goods-payment-remaining-default="editingItem?.goodsPaymentRemainingDefault ?? null"
          :receipt-completed="isReceiptCompleted"
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
            :disabled="isReceiptCompleted || !$store.getters.hasPermission('warehouse_receipts_delete')"
          />
          <PrimaryButton
            icon="fas fa-save"
            :onclick="save"
            :is-loading="saveLoading"
            :disabled="isReceiptCompleted ||
              (editingItemId != null && !$store.getters.hasPermission('warehouse_receipts_update')) ||
              (editingItemId == null && !$store.getters.hasPermission('warehouse_receipts_create'))"
            :aria-label="$t('save')"
          />
        </div>

        <div
          v-if="products && products.length > 0"
          class="text-sm text-gray-700 flex flex-wrap md:flex-nowrap gap-x-4 gap-y-1 font-medium"
        >
          <div>{{ $t('total') }}: <span class="font-bold">{{ $formatNumber(receiptFooterTotalValue, null, true) }} {{ receiptFooterTotalSymbol }}</span></div>
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
import FieldHint from '@/views/components/app/forms/FieldHint.vue';
import WarehouseReceiptTransactionsTab from '@/views/pages/warehouses/WarehouseReceiptTransactionsTab.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from "@/mixins/crudFormMixin";
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import { dateFormMixin } from '@/utils/dateUtils';
import { formatCurrency, formatQuantity } from '@/utils/numberUtils';

export default {
    components: {
        PrimaryButton,
        AlertDialog,
        ClientSearch,
        ProductSearch,
        TabBar,
        FieldHint,
        WarehouseReceiptTransactionsTab,
    },
    mixins: [getApiErrorMessage, crudFormMixin, dateFormMixin, sideModalFooterPortal],
    props: {
        editingItem: {
            type: Object,
            default: null,
        },
        createMode: { type: String, default: 'default' },
        purchaseContext: { type: Object, default: null },
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request', 'receipt-refreshed', 'update:createMode'],
    data() {
        return {
            currentTab: 'info',
            transactionsTabVisited: false,
            date: this.editingItem?.date ? this.getFormattedDate(this.editingItem.date) : this.getCurrentLocalDateTime(),
            note: this.editingItem ? this.editingItem.note : '',
            warehouseId: this.editingItem ? this.editingItem.warehouseId  : '',
            cashId: this.editingItem ? this.editingItem.cashId : '',
            products: this.editingItem ? this.editingItem.products : (this.purchaseContext?.products || []),
            selectedClient: this.editingItem ? this.editingItem.client : (this.purchaseContext?.supplier || null),
            clientBalanceId: this.editingItem?.clientBalanceId ?? this.editingItem?.client_balance_id ?? null,
            status: this.editingItem?.status ?? 'draft',
            allWarehouses: [],
            currencies: [],
            allCashRegisters: [],
        };
    },
    computed: {
        isReceiptCompleted() {
            return Boolean(this.editingItem?.status === 'completed');
        },
        showReceiptStatusSelect() {
            return true;
        },
        isReadOnlyProducts() {
            return this.isReceiptCompleted || this.isLinkedPurchaseCreate;
        },
        isLinkedPurchaseCreate() {
            return Boolean(this.editingItemId == null && this.purchaseContext?.purchaseId);
        },
        canEditWaybills() {
            return false;
        },
        visibleTabs() {
            const tabs = [
                { name: 'info', label: this.$t('receiptTabMain') },
            ];
            if (this.editingItemId) {
                tabs.push({ name: 'transactions', label: this.$t('receiptTabTransactions') });
            }
            return tabs;
        },
        receiptFooterLineSum() {
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
        receiptFooterTotalValue() {
            const landed = this.editingItem?.landedCost;
            if (landed && landed.goodsSubtotalDefault != null && !Number.isNaN(Number(landed.goodsSubtotalDefault))) {
                return Number(landed.goodsSubtotalDefault);
            }
            return this.receiptFooterLineSum;
        },
        receiptFooterTotalSymbol() {
            const landed = this.editingItem?.landedCost;
            if (landed?.defaultCurrencySymbol) {
                return landed.defaultCurrencySymbol;
            }
            if (!this.cashId) {
                const defaultCurrency = this.currencies.find(c => c.isDefault);
                return defaultCurrency ? defaultCurrency.symbol : '';
            }
            const cr = this.allCashRegisters?.find((c) => Number(c.id) === Number(this.cashId));
            return cr?.currencySymbol ?? '';
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
                if (this.purchaseContext?.warehouseId && !this.warehouseId) {
                    this.warehouseId = this.purchaseContext.warehouseId;
                }
            }

            this.saveInitialState();
        });
    },
    methods: {
        changeTab(tabName) {
            this.currentTab = tabName;
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
        formatReceiptQuantity(value) {
            return formatQuantity(value);
        },
        statusLabel(status) {
            const labels = {
                draft: this.$t('receiptStatusDraft'),
                completed: this.$t('receiptStatusCompleted'),
            };
            return labels[status] || this.$t('receiptStatusDraft');
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

            if (!this.cashId && !this.isLinkedPurchaseCreate) {
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
                purchaseId: this.purchaseContext?.purchaseId ?? null,
                date: this.date,
                note: this.note,
                cashId: this.cashId || null,
                status: this.status,
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
            this.status = 'draft';
            this.cashId = this.allCashRegisters?.length ? this.allCashRegisters[0].id : '';
            this.currentTab = 'info';
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
                this.status = newEditingItem.status || 'draft';
            } else if (this.purchaseContext?.purchaseId) {
                this.selectedClient = this.purchaseContext.supplier || null;
                this.warehouseId = this.purchaseContext.warehouseId || this.warehouseId;
                this.products = Array.isArray(this.purchaseContext.products) ? [...this.purchaseContext.products] : [];
                this.note = '';
                this.status = 'draft';
            }
        },
    }
};
</script>

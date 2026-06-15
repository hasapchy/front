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
        class="mb-3 flex items-start gap-2 rounded-md border border-[color-mix(in_srgb,var(--color-warning)_35%,var(--border-subtle))] bg-[color-mix(in_srgb,var(--color-warning)_12%,var(--surface-muted))] px-3 py-2 text-sm text-gray-700 dark:border-[color-mix(in_srgb,var(--color-warning)_40%,var(--border-subtle))] dark:bg-[color-mix(in_srgb,var(--color-warning)_16%,var(--surface-muted))] dark:text-[var(--text-primary)]"
      >
        <i
          class="fas fa-circle-info mt-0.5 shrink-0 text-[var(--color-warning)]"
          aria-hidden="true"
        />
        <span>
          {{ isReceiptCompleted && receiptLinkedReturns.length
            ? $t('receiptCompletedWithReturnsBanner')
            : $t('receiptCompletedReadonlyBanner') }}
        </span>
      </p>

      <div v-show="currentTab === 'info'">
        <ClientSearch
          :selected-client="selectedClient"
          :only-suppliers="true"
          label-key="supplier"
          :disabled="!!editingItemId || !isEditableReceipt || isLinkedPurchaseCreate"
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
            :disabled="(!!editingItemId && !canEditDate()) || !isEditableReceipt"
            :min="getMinDate()"
          >
        </div>
        <div class="mt-2">
          <label class="block mb-1 required">{{ $t('warehouse') }}</label>
          <div class="flex items-center space-x-2">
            <select
              v-model="warehouseId"
              :disabled="!!editingItemId || !isEditableReceipt || isLinkedPurchaseCreate"
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

        <div
          v-if="!isLinkedPurchaseCreate"
          class="mt-2"
        >
          <CashRegisterSelect
            v-model="cashId"
            :cash-registers="cashRegistersForForm"
            :disabled="!!editingItemId || !isEditableReceipt || cashSelectDisabled"
            :required="true"
          />
        </div>

        <div
          v-if="showReceiptStatusSelect"
          class="mt-2"
        >
          <label class="mb-1 block">{{ $t('receiptStatus') }}</label>
          <select
            v-if="canEditReceiptStatus"
            v-model="status"
          >
            <option
              v-if="showDraftReceiptStatusOption"
              value="draft"
            >
              {{ $t('receiptStatusDraft') }}
            </option>
            <option value="approved">
              {{ $t('purchaseStatusApproved') }}
            </option>
          </select>
          <div
            v-else
            class="text-sm text-gray-700 dark:text-white"
          >
            {{ receiptStatusReadonlyLabel }}
          </div>
        </div>

        <div class="mt-2">
          <label>{{ $t('note') }}</label>
          <input
            v-model="note"
            type="text"
            :disabled="!isEditableReceipt"
          >
        </div>

        <ProductSearch
          v-model="products"
          amount-rounding-scope="warehouse"
          :disabled="isReadOnlyProducts"
          :show-quantity="true"
          :show-price="true"
          :is-receipt="true"
          :show-amount="true"
          :only-products="true"
          :warehouse-id="warehouseId"
          :allow-all-warehouse-products="!purchaseContext?.purchaseId"
          :receipt-waybill-catalog-products="purchaseContext?.catalog || []"
          :waybill-remaining-cap-by-product-id="purchaseContext?.purchaseId ? purchaseContext.caps : null"
          :enable-alternate-unit-quantity="true"
          :document-currency-id="receiptCashCurrencyId"
          :currency-code="receiptCashCurrencySymbol"
          :document-to-default-factor="receiptDocumentToDefaultFactor"
          :exchange-rate-date="date"
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
                  <th class="app-table-head-cell dark:border-[var(--border-subtle)]">
                    <span class="inline-flex items-center gap-1">
                      {{ $t('product') }}
                      <FieldHint
                        :text="$t('receiptLandedCostProductColHint')"
                        placement="bottom"
                      />
                    </span>
                  </th>
                  <th class="app-table-head-cell dark:border-[var(--border-subtle)]">
                    <span class="inline-flex items-center gap-1">
                      {{ $t('quantity') }}
                      <FieldHint
                        :text="$t('receiptLandedCostQuantityColHint')"
                        placement="bottom"
                      />
                    </span>
                  </th>
                  <th class="app-table-head-cell dark:border-[var(--border-subtle)]">
                    <span class="inline-flex items-center gap-1">
                      {{ $t('receiptLandedCostLineSubtotal') }}
                      <FieldHint
                        :text="$t('receiptLandedCostLineSubtotalHint')"
                        placement="bottom"
                      />
                    </span>
                  </th>
                  <th class="app-table-head-cell dark:border-[var(--border-subtle)]">
                    <span class="inline-flex items-center gap-1">
                      {{ $t('receiptLandedCostAllocated') }}
                      <FieldHint
                        :text="$t('receiptLandedCostAllocatedHint')"
                        placement="bottom"
                      />
                    </span>
                  </th>
                  <th class="app-table-head-cell dark:border-[var(--border-subtle)]">
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
                    <div>{{ p.productName }}</div>
                    <div v-if="formatLineOrigThenBaseQty(p)"
                      class="mt-0.5 text-[11px] font-normal leading-tight text-gray-600 dark:text-[var(--text-secondary)]">
                      {{ formatLineOrigThenBaseQty(p) }}
                    </div>
                  </td>
                  <td class="border-x border-gray-300 px-3 py-2 text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]">
                    {{ formatLineOrigThenBaseQty(p) || `${formatReceiptQuantity(p.quantity)}${p.unitShortName ? ` ${p.unitShortName}` : ''}` }}
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

        <div
          v-if="showReceiptReturnsInfo"
          class="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
        >
          <h3 class="text-md mb-3 font-semibold text-gray-900 dark:text-[var(--text-primary)]">
            {{ $t('receiptLinkedReturnsTitle') }}
          </h3>
          <div class="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700 dark:text-[var(--text-secondary)]">
            <div v-if="receiptEffectiveRemaining != null">
              <span class="text-gray-500 dark:text-[var(--text-secondary)]">{{ $t('receiptEffectiveRemaining') }}:</span>
              <span class="ml-1 font-semibold tabular-nums text-gray-900 dark:text-[var(--text-primary)]">
                {{ formatReturnAmount(receiptEffectiveRemaining) }}
              </span>
            </div>
            <div v-if="receiptReturnAdjustedAmount > 0">
              <span class="text-gray-500 dark:text-[var(--text-secondary)]">{{ $t('receiptReturnAdjustedAmount') }}:</span>
              <span class="ml-1 font-semibold tabular-nums text-gray-900 dark:text-[var(--text-primary)]">
                {{ formatReturnAmount(receiptReturnAdjustedAmount) }}
              </span>
            </div>
          </div>
          <div
            v-if="receiptLinkedReturns.length"
            class="overflow-x-auto rounded-md border border-gray-200 dark:border-[var(--border-subtle)]"
          >
            <table class="w-full min-w-[480px] border-collapse text-xs">
              <thead class="bg-gray-100 dark:bg-[var(--surface-muted)]">
                <tr>
                  <th class="app-table-head-cell dark:border-[var(--border-subtle)]">
                    {{ $t('number') }}
                  </th>
                  <th class="app-table-head-cell dark:border-[var(--border-subtle)]">
                    {{ $t('date') }}
                  </th>
                  <th class="app-table-head-cell text-right dark:border-[var(--border-subtle)]">
                    {{ $t('amount') }}
                  </th>
                  <th class="app-table-head-cell text-right dark:border-[var(--border-subtle)]">
                    {{ $t('receiptReturnUnpaidPortion') }}
                  </th>
                  <th
                    v-if="receiptLinkedReturnsShowPaidPortion"
                    class="app-table-head-cell text-right dark:border-[var(--border-subtle)]"
                  >
                    {{ $t('receiptReturnPaidPortion') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in receiptLinkedReturns"
                  :key="item.id"
                  class="border-t border-gray-200 dark:border-[var(--border-subtle)]"
                >
                  <td class="border border-gray-300 px-3 py-2 dark:border-[var(--border-subtle)]">
                    {{ item.id }}
                  </td>
                  <td class="border border-gray-300 px-3 py-2 dark:border-[var(--border-subtle)]">
                    {{ typeof item.formatDate === 'function' ? (item.formatDate() || '—') : '—' }}
                  </td>
                  <td class="border border-gray-300 px-3 py-2 text-right tabular-nums dark:border-[var(--border-subtle)]">
                    {{ formatReturnAmount(item.returnAmount) }}
                  </td>
                  <td class="border border-gray-300 px-3 py-2 text-right tabular-nums dark:border-[var(--border-subtle)]">
                    {{ formatReturnAmount(item.unpaidPortion) }}
                  </td>
                  <td
                    v-if="receiptLinkedReturnsShowPaidPortion"
                    class="border border-gray-300 px-3 py-2 text-right tabular-nums dark:border-[var(--border-subtle)]"
                  >
                    {{ formatReturnAmount(item.paidPortion) }}
                  </td>
                </tr>
              </tbody>
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
          :document-balance-id="clientBalanceId"
          :client-balances="transactionTabClientBalances"
          :goods-payment-remaining-default="editingItem?.goodsPaymentRemainingDefault ?? null"
          :return-adjusted-amount="receiptReturnAdjustedAmount"
          :effective-remaining="receiptEffectiveRemaining"
          :returned-goods-amount="receiptReturnedGoodsAmount"
          :net-goods-amount="receiptNetGoodsAmount"
          :goods-total-original="receiptGoodsTotalOriginal"
          :currency-symbol="receiptReturnCurrencySymbol"
          :is-from-purchase="Boolean(editingItem?.isFromPurchase)"
          :receipt-completed="isReceiptCompleted"
          :receipt-draft="isEditableReceipt"
          :receipt-approved="isReceiptApproved"
          @finance-changed="onReceiptFinanceChanged"
          @totals-changed="onReceiptTotalsChanged"
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
            :disabled="!isEditableReceipt ||
              (editingItemId != null && !$store.getters.hasPermission('warehouse_receipts_update')) ||
              (editingItemId == null && !$store.getters.hasPermission('warehouse_receipts_create'))"
            :aria-label="$t('save')"
          />
        </div>

        <div class="text-sm text-gray-700 dark:text-white flex flex-wrap md:flex-nowrap gap-x-4 gap-y-1 font-medium">
          <div
            v-if="receiptFooterTotals.goods"
            class="inline-flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-right"
          >
            <span>{{ $t('warehouseReceiptTxnTotalGoods') }}:</span>
            <span class="font-bold">{{ receiptFooterTotals.goods }}</span>
            <span
              v-if="receiptFooterDefHint"
              class="font-normal text-gray-500 dark:text-[var(--text-secondary)]"
            >
              {{ receiptFooterDefHint }}
            </span>
          </div>
          <div>{{ $t('warehouseReceiptTxnTotalLogistics') }}: <span class="font-bold">{{ receiptFooterTotals.logistics }}</span></div>
          <div>{{ $t('warehouseReceiptTxnTotalOther') }}: <span class="font-bold">{{ receiptFooterTotals.other }}</span></div>
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
import TransactionController from '@/api/TransactionController';
import clientBalanceCashMixin from '@/mixins/clientBalanceCashMixin';
import { balancesForDocumentPayment } from '@/utils/documentPaymentBalanceUtils';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import ProductSearch from '@/views/components/app/search/ProductSearch.vue';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import FieldHint from '@/views/components/app/forms/FieldHint.vue';
import CashRegisterSelect from '@/views/components/app/forms/CashRegisterSelect.vue';
import WarehouseReceiptTransactionsTab from '@/views/pages/warehouses/WarehouseReceiptTransactionsTab.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';
import crudFormMixin from "@/mixins/crudFormMixin";
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import { dateFormMixin } from '@/utils/dateUtils';
import { formatCurrencyForDisplay, formatQuantity } from '@/utils/numberUtils';
import WarehouseReceiptDto from '@/dto/warehouse/WarehouseReceiptDto';
import { lineOrigSavePayload, warehouseLinePriceForSave } from '@/utils/warehouseLineOrigPayload';
import { formatLineOrigThenBaseQty } from '@/utils/warehouseLineOrigDisplay';
import {
    fetchDocumentToDefaultFactor,
    resolveLineSubtotalInDefaultCurrency,
} from '@/utils/documentToDefaultCurrency';

const RECEIPT_GOODS_CATEGORY_ID = 6;
const RECEIPT_DELIVERY_CATEGORY_ID = 16;

export default {
    components: {
        PrimaryButton,
        AlertDialog,
        ClientSearch,
        ProductSearch,
        TabBar,
        FieldHint,
        CashRegisterSelect,
        WarehouseReceiptTransactionsTab,
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
            products: this.editingItem?.products
                ?? this.purchaseContext?.initialProducts
                ?? [],
            selectedClient: this.editingItem ? this.editingItem.client : (this.purchaseContext?.supplier || null),
            clientBalanceId: this.editingItem?.clientBalanceId ?? null,
            status: this.editingItem?.status ?? 'draft',
            allWarehouses: [],
            currencies: [],
            allCashRegisters: [],
            receiptTabTotals: {
                goods: '—',
                logistics: '—',
                other: '—',
            },
            receiptDocumentToDefaultFactor: 1,
            receiptOrigAmount: this.editingItem?.origAmount ?? null,
        };
    },
    computed: {
        isReceiptCompleted() {
            return Boolean(this.editingItem?.status === 'completed');
        },
        isEditableReceipt() {
            if (this.editingItemId == null) {
                return true;
            }
            return (this.editingItem?.status ?? this.status) === 'draft';
        },
        isReceiptApproved() {
            return (this.editingItem?.status ?? this.status) === 'approved';
        },
        canEditReceiptStatus() {
            if (this.isReceiptCompleted) {
                return false;
            }
            if (this.editingItemId != null && !this.$store.getters.hasPermission('warehouse_receipts_update')) {
                return false;
            }
            if (this.editingItemId == null) {
                return true;
            }
            return (this.editingItem?.status ?? this.status) === 'draft';
        },
        showDraftReceiptStatusOption() {
            if (this.editingItemId == null) {
                return true;
            }
            return (this.editingItem?.status ?? this.status) === 'draft';
        },
        receiptStatusReadonlyLabel() {
            if (this.status === 'completed') {
                return this.$t('receiptStatusCompleted');
            }
            if (this.status === 'approved') {
                return this.$t('purchaseStatusApproved');
            }
            return this.$t('receiptStatusDraft');
        },
        showReceiptStatusSelect() {
            return true;
        },
        isReadOnlyProducts() {
            return !this.isEditableReceipt;
        },
        isLinkedPurchaseCreate() {
            return Boolean(this.editingItemId == null && this.purchaseContext?.purchaseId);
        },
        receiptLinkedReturns() {
            return this.editingItem?.linkedReturns ?? [];
        },
        receiptLinkedReturnsShowPaidPortion() {
            return this.receiptLinkedReturns.some((item) => Number(item.paidPortion ?? 0) > 0);
        },
        receiptEffectiveRemaining() {
            return this.editingItem?.effectiveRemaining ?? null;
        },
        receiptReturnAdjustedAmount() {
            return Number(this.editingItem?.returnAdjustedAmount ?? 0);
        },
        receiptReturnedGoodsAmount() {
            return Number(this.editingItem?.returnedGoodsAmount ?? 0);
        },
        receiptNetGoodsAmount() {
            if (this.editingItem?.netGoodsAmount != null) {
                return Number(this.editingItem.netGoodsAmount);
            }
            if (this.receiptReturnedGoodsAmount > 0) {
                return Math.max(0, this.receiptGoodsTotalOriginal - this.receiptReturnedGoodsAmount);
            }
            return null;
        },
        receiptGoodsTotalOriginal() {
            const landed = this.editingItem?.landedCost?.goodsSubtotalDefault;
            if (landed != null && !Number.isNaN(Number(landed))) {
                return Number(landed);
            }
            return Number(this.editingItem?.totalAmount ?? this.editingItem?.amount ?? 0);
        },
        receiptReturnCurrencySymbol() {
            return this.editingItem?.landedCost?.defaultCurrencyCode
                || this.receiptCashCurrencySymbol
                || '';
        },
        receiptHasReturns() {
            return this.receiptReturnedGoodsAmount > 0 || this.receiptLinkedReturns.length > 0;
        },
        showReceiptReturnsInfo() {
            if (!this.editingItemId || this.editingItem?.isFromPurchase) {
                return false;
            }
            return this.receiptLinkedReturns.length > 0 || this.receiptReturnAdjustedAmount > 0;
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
        receiptCashCurrencySymbol() {
            if (this.selectedReceiptCashRegister) {
                return this.selectedReceiptCashRegister.currencyCode ?? '';
            }
            const defaultCurrency = this.currencies.find((c) => c.isDefault);
            return defaultCurrency ? defaultCurrency.code : '';
        },
        receiptCashCurrencyId() {
            if (this.selectedReceiptCashRegister) {
                return this.selectedReceiptCashRegister.currencyId ?? null;
            }
            const defaultCurrency = this.currencies.find((c) => c.isDefault);
            return defaultCurrency?.id ?? null;
        },
        selectedReceiptCashRegister() {
            if (!this.cashId) {
                return null;
            }
            return this.allCashRegisters?.find((c) => Number(c.id) === Number(this.cashId)) || null;
        },
        isReceiptCashCurrencyDefault() {
            const def = this.currencies.find((c) => c.isDefault);
            if (!def || !this.receiptCashCurrencyId) {
                return true;
            }
            return Number(def.id) === Number(this.receiptCashCurrencyId);
        },
        receiptFooterGoodsFormatted() {
            const sym = this.editingItem?.landedCost?.defaultCurrencyCode
                || this.receiptCashCurrencySymbol
                || '';
            if (this.receiptHasReturns && this.receiptNetGoodsAmount != null) {
                const net = formatCurrencyForDisplay(this.receiptNetGoodsAmount, sym, true);
                const orig = formatCurrencyForDisplay(this.receiptGoodsTotalOriginal, sym, true);
                return `${net} (${this.$t('receiptWasAmount', { amount: orig })})`;
            }
            const landed = this.editingItem?.landedCost;
            if (landed && landed.goodsSubtotalDefault != null && !Number.isNaN(Number(landed.goodsSubtotalDefault))) {
                return formatCurrencyForDisplay(
                    landed.goodsSubtotalDefault,
                    landed.defaultCurrencyCode ?? '',
                    false,
                );
            }
            return formatCurrencyForDisplay(this.receiptOrigAmount, this.receiptCashCurrencySymbol, true);
        },
        receiptEffectiveDocumentToDefaultFactor() {
            if (this.isReceiptCashCurrencyDefault) {
                return 1;
            }
            const factor = Number(this.receiptDocumentToDefaultFactor);
            return factor > 1 ? factor : 1;
        },
        receiptFooterDefaultTotal() {
            if (this.isReceiptCashCurrencyDefault) {
                return 0;
            }
            const factor = this.receiptEffectiveDocumentToDefaultFactor;
            let sum = 0;
            for (const product of this.products || []) {
                const lineDefault = resolveLineSubtotalInDefaultCurrency({
                    amountDefault: product.amountDefault,
                    lineSubtotalDefault: product.lineSubtotalDefault,
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
        receiptFooterDefHint() {
            if (this.editingItem?.landedCost) {
                return null;
            }
            if (this.isReceiptCashCurrencyDefault) {
                return null;
            }
            const def = this.currencies.find((c) => c.isDefault);
            const defAmount = this.receiptFooterDefaultTotal;
            if (!defAmount) {
                return null;
            }
            const formatted = formatCurrencyForDisplay(defAmount, def?.code ?? '', true);
            return this.$t('productSearchEquivDefaultCurrency', { amount: formatted });
        },
        receiptFooterTotals() {
            const zeroExpense = this.formatReceiptExpenseZero();
            return {
                goods: this.receiptFooterGoodsFormatted,
                logistics: this.normalizeReceiptExpenseTotal(this.receiptTabTotals.logistics, zeroExpense),
                other: this.normalizeReceiptExpenseTotal(this.receiptTabTotals.other, zeroExpense),
            };
        },
        clientBalances() {
            return this.selectedClient?.balances ?? [];
        },
        transactionTabClientBalances() {
            return balancesForDocumentPayment(this.clientBalances, this.clientBalanceId);
        },
    },
    watch: {
        receiptCashCurrencyId: {
            handler() {
                this.refreshReceiptDocumentToDefaultFactor();
            },
            immediate: true,
        },
        date() {
            this.refreshReceiptDocumentToDefaultFactor();
        },
        allCashRegisters: {
            handler(newRegisters) {
                if (newRegisters?.length && this.clientBalanceId && this.clientBalanceSelected) {
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
                if (this.purchaseContext?.warehouseId) {
                    this.warehouseId = this.purchaseContext.warehouseId;
                }
                if (
                    this.purchaseContext?.initialProducts?.length
                    && !this.products?.length
                ) {
                    this.products = [...this.purchaseContext.initialProducts];
                }
            }

            await this.fetchReceiptExpenseTotals();
            await this.refreshReceiptDocumentToDefaultFactor();
            this.saveInitialState();
        });
    },
    methods: {
        formatLineOrigThenBaseQty,
        formatReceiptExpenseZero() {
            return formatCurrencyForDisplay(0, this.receiptCashCurrencySymbol, true);
        },
        normalizeReceiptExpenseTotal(value, zeroFormatted) {
            if (!value || value === '—') {
                return zeroFormatted;
            }
            return value;
        },
        receiptExpenseTabTotalsDefaults() {
            const zero = this.formatReceiptExpenseZero();
            return { goods: '—', logistics: zero, other: zero };
        },
        async fetchReceiptExpenseTotals() {
            if (!this.editingItemId) {
                this.receiptTabTotals = this.receiptExpenseTabTotalsDefaults();
                return;
            }
            try {
                const response = await TransactionController.getItems(
                    1,
                    null,
                    'all_time',
                    null,
                    null,
                    null,
                    null,
                    null,
                    50,
                    null,
                    null,
                    null,
                    null,
                    null,
                    this.editingItemId,
                );
                const list = response?.items || [];
                this.receiptTabTotals = {
                    goods: this.formatExpenseBucketTotalsFromTransactions(list, RECEIPT_GOODS_CATEGORY_ID),
                    logistics: this.formatExpenseBucketTotalsFromTransactions(list, RECEIPT_DELIVERY_CATEGORY_ID, true),
                    other: this.formatExpenseBucketTotalsFromTransactions(list, null, true),
                };
            } catch {
                this.receiptTabTotals = this.receiptExpenseTabTotalsDefaults();
            }
        },
        formatExpenseBucketTotalsFromTransactions(list, fixedCategoryId, emptyAsZero = false) {
            const byCurrency = {};
            for (const t of list) {
                if (t?.isDeleted || Number(t.type) !== 0 || Number(t.isDebt) === 1) {
                    continue;
                }
                const cid = t.categoryId != null ? Number(t.categoryId) : null;
                if (fixedCategoryId != null) {
                    if (cid !== fixedCategoryId) {
                        continue;
                    }
                } else if (cid === RECEIPT_GOODS_CATEGORY_ID || cid === RECEIPT_DELIVERY_CATEGORY_ID) {
                    continue;
                }
                const amount = Math.abs(Number(t.origAmount) || 0);
                if (amount <= 0) {
                    continue;
                }
                const key = String(t.origCurrencyId ?? '');
                const symbol = t.origCurrencyCode || '';
                if (!byCurrency[key]) {
                    byCurrency[key] = { total: 0, symbol };
                }
                byCurrency[key].total += amount;
                if (!byCurrency[key].symbol && symbol) {
                    byCurrency[key].symbol = symbol;
                }
            }

            const parts = Object.values(byCurrency)
                .filter((entry) => entry.total > 0)
                .map((entry) => formatCurrencyForDisplay(entry.total, entry.symbol, true));
            if (parts.length) {
                return parts.join(' · ');
            }
            return emptyAsZero ? this.formatReceiptExpenseZero() : '—';
        },
        async refreshReceiptDocumentToDefaultFactor() {
            this.receiptDocumentToDefaultFactor = await fetchDocumentToDefaultFactor(
                this.receiptCashCurrencyId,
                this.currencies,
                this.date,
            );
        },
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
            const sym = this.editingItem?.landedCost?.defaultCurrencyCode ?? '';
            return formatCurrencyForDisplay(Number(value), sym, true);
        },
        formatReturnAmount(value) {
            const sym = this.editingItem?.landedCost?.defaultCurrencyCode
                || this.receiptCashCurrencySymbol
                || '';
            return formatCurrencyForDisplay(Number(value ?? 0), sym, true);
        },
        formatReceiptQuantity(value) {
            return formatQuantity(value);
        },
        statusLabel(status) {
            const labels = {
                draft: this.$t('receiptStatusDraft'),
                approved: this.$t('purchaseStatusApproved'),
                completed: this.$t('receiptStatusCompleted'),
            };
            return labels[status] || this.$t('receiptStatusDraft');
        },
        async onReceiptFinanceChanged() {
            if (!this.editingItemId) {
                return;
            }
            const dto = await WarehouseReceiptController.getItem(this.editingItemId);
            this.status = dto.status ?? this.status;
            this.applyReceiptDocumentTotals(dto);
            await this.fetchReceiptExpenseTotals();
            this.$emit('receipt-refreshed', dto);
        },
        onReceiptTotalsChanged(totals) {
            const zero = this.formatReceiptExpenseZero();
            this.receiptTabTotals = {
                goods: totals?.goods || '—',
                logistics: this.normalizeReceiptExpenseTotal(totals?.logistics, zero),
                other: this.normalizeReceiptExpenseTotal(totals?.other, zero),
            };
        },
        async onWaybillsChanged() {
            await this.$store.dispatch('invalidateCache', { type: 'products' });
            await this.$store.dispatch('loadAllProducts');
        },
        async save() {
            return crudFormMixin.methods.save.call(this);
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
                await this.refreshReceiptDocumentToDefaultFactor();
                return;
            }
            await this.$store.dispatch('loadCurrencies');
            this.currencies = this.$store.getters.currencies;
            await this.refreshReceiptDocumentToDefaultFactor();
        },
        async fetchAllCashRegisters() {
            if (this.$store.getters.cashRegisters?.length) {
                this.allCashRegisters = this.$store.getters.cashRegisters;
            } else {
                await this.$store.dispatch('loadCashRegisters');
                this.allCashRegisters = this.$store.getters.cashRegisters;
            }
            if (!this.cashId && !this.clientBalanceSelected) {
                this.cashId = this.resolveInitialCashId();
            }
        },
        resolveInitialCashId() {
            return this.allCashRegisters?.length ? this.allCashRegisters[0].id : '';
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

            const invalidProducts = this.products.filter((p) => {
                const price = warehouseLinePriceForSave(p);
                return !p.productId || !p.quantity || p.quantity <= 0 || price < 0;
            });

            if (invalidProducts?.length) {
                validationErrors.push('• У некоторых товаров не заполнены обязательные поля (ID, количество, цена)');
            }

            if (validationErrors?.length) {
                this.emitSavedError(validationErrors.join('\n'));
                throw new Error(validationErrors.join('\n'));
            }

            const productsData = this.products.map((product) => ({
                productId: product.productId,
                quantity: product.quantity,
                price: warehouseLinePriceForSave(product),
                ...lineOrigSavePayload(product),
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
        applyReceiptDocumentTotals(receipt) {
            const dto = receipt instanceof WarehouseReceiptDto
                ? receipt
                : WarehouseReceiptDto.fromApi(receipt);
            if (!dto) {
                return;
            }
            this.receiptOrigAmount = dto.origAmount;
            if (dto.products?.length) {
                this.products = dto.products;
            }
        },
        async performSave(data) {
            let resp;
            if (this.editingItemId != null) {
                resp = await WarehouseReceiptController.updateItem(this.editingItemId, {
                    date: data.date,
                    note: data.note,
                    status: data.status,
                    products: data.products,
                });
            } else {
                resp = await WarehouseReceiptController.storeItem(data);
            }
            this.applyReceiptDocumentTotals(resp.item);
            return resp;
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
            this.cashId = this.resolveInitialCashId();
            this.currentTab = 'info';
            this.transactionsTabVisited = false;
            this.receiptTabTotals = this.receiptExpenseTabTotalsDefaults();
            this.receiptOrigAmount = null;
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
                this.clientBalanceId = newEditingItem.clientBalanceId ?? null;
                this.products = newEditingItem.products || [];
                this.cashId = newEditingItem.cashId ;
                this.status = newEditingItem.status || 'draft';
                this.applyReceiptDocumentTotals(newEditingItem);
                this.receiptTabTotals = this.receiptExpenseTabTotalsDefaults();
                this.fetchReceiptExpenseTotals();
            } else if (this.purchaseContext?.purchaseId) {
                this.selectedClient = this.purchaseContext.supplier || null;
                this.warehouseId = this.purchaseContext.warehouseId || this.warehouseId;
                this.products = [...(this.purchaseContext.initialProducts || [])];
                this.note = '';
                this.status = 'draft';
                this.receiptTabTotals = this.receiptExpenseTabTotalsDefaults();
            }
        },
    }
};
</script>

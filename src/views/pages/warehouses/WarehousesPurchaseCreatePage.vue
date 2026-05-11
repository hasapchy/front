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

        <div>
          <label>{{ $t('date') }}</label>
          <input
            v-model="date"
            type="datetime-local"
            :disabled="!canEditMainInfo"
            :min="getMinDate()"
          >
        </div>

        <div class="mt-2">
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
          :allow-all-warehouse-products="true"
          required
        />
      </div>

      <div v-show="currentTab === 'transactions'">
        <div class="flex flex-wrap gap-2 items-end mb-3">
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-500 dark:text-gray-400">{{ $t('amount') }}</label>
            <input
              v-model.number="payment.amount"
              type="number"
              min="0"
              step="0.00001"
              class="h-[38px] w-40 px-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[var(--surface-secondary)]"
              :disabled="!canPay"
            >
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-500 dark:text-gray-400">{{ $t('cashRegister') }}</label>
            <input
              v-model.number="payment.cashId"
              type="number"
              min="1"
              class="h-[38px] w-36 px-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[var(--surface-secondary)]"
              :disabled="!canPay"
            >
          </div>
          <PrimaryButton
            :onclick="payForGoods"
            icon="fas fa-money-bill-wave"
            :disabled="!canPay"
          >
            {{ $t('payForGoods') }}
          </PrimaryButton>
        </div>
        <div class="overflow-x-auto border rounded-md">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b">
                <th class="text-left p-2">ID</th>
                <th class="text-left p-2">{{ $t('date') }}</th>
                <th class="text-left p-2">{{ $t('amount') }}</th>
                <th class="text-left p-2">{{ $t('inDebt') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="tx in transactions"
                :key="tx.id"
                class="border-b last:border-b-0"
              >
                <td class="p-2">{{ tx.id }}</td>
                <td class="p-2">{{ tx.date }}</td>
                <td class="p-2">{{ tx.orig_amount }}</td>
                <td class="p-2">{{ tx.is_debt ? $t('yes') : $t('no') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-show="currentTab === 'receipts'">
        <div class="overflow-x-auto border rounded-md">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b">
                <th class="text-left p-2">ID</th>
                <th class="text-left p-2">{{ $t('date') }}</th>
                <th class="text-left p-2">{{ $t('status') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="receipt in receipts"
                :key="receipt.id"
                class="border-b last:border-b-0"
              >
                <td class="p-2">{{ receipt.id }}</td>
                <td class="p-2">{{ receipt.date }}</td>
                <td class="p-2">{{ receipt.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>
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
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import notificationMixin from '@/mixins/notificationMixin';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import { dateFormMixin } from '@/utils/dateUtils';

export default {
    components: {
        PrimaryButton,
        AlertDialog,
        ClientSearch,
        ProductSearch,
        TabBar,
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
            note: this.editingItem?.note || '',
            status: this.editingItem?.status || 'draft',
            products: this.mapProductsFromItem(this.editingItem?.products || []),
            transactions: this.editingItem?.transactions || [],
            receipts: this.editingItem?.receipts || [],
            payment: {
                amount: null,
                cashId: null,
            },
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
    },
    mounted() {
        this.$nextTick(() => {
            this.saveInitialState();
        });
    },
    methods: {
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
        onBalanceChanged(balanceId) {
            this.clientBalanceId = balanceId ?? null;
        },
        getFormState() {
            return {
                selectedClientId: this.selectedClient?.id ?? null,
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
            this.note = '';
            this.status = 'draft';
            this.products = [];
            this.transactions = [];
            this.receipts = [];
            this.payment.amount = null;
            this.payment.cashId = null;
            this.currentTab = 'info';
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        async payForGoods() {
            if (!this.canPay || !this.payment.amount || !this.payment.cashId) {
                return;
            }
            try {
                await WarehousePurchaseController.pay(this.editingItemId, {
                    amount: this.payment.amount,
                    cashId: this.payment.cashId,
                });
                const fresh = await WarehousePurchaseController.getItem(this.editingItemId);
                this.transactions = fresh?.transactions || [];
                this.receipts = fresh?.receipts || [];
                this.status = fresh?.status || this.status;
                this.payment.amount = null;
                this.payment.cashId = null;
            } catch (error) {
                this.showNotification(this.$t('error'), this.getApiErrorMessage(error), true);
            }
        },
        onEditingItemChanged(newEditingItem) {
            if (!newEditingItem) {
                return;
            }
            this.selectedClient = newEditingItem.supplier || null;
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

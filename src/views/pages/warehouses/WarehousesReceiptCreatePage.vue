<template>
  <div class="flex flex-col h-full min-h-0">
    <div class="flex-1 min-h-0 overflow-y-auto p-4">
      <ClientSearch
        v-model:selected-client="selectedClient"
        :only-suppliers="true"
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
            v-if="allWarehouses.length"
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
          <select
            v-else
            v-model="warehouseId"
            :disabled="!!editingItemId"
          >
            <option value="">
              {{ $t('no') }}
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

      <div class="mt-2">
        <label class="block mb-1 required">{{ $t('paymentType') }}</label>
        <div class="flex space-x-4">
          <label class="inline-flex items-center">
            <input
              v-model="type"
              type="radio"
              value="cash"
              :disabled="!!editingItemId"
            >
            <i
              class="fas fa-cash-register ml-2 mr-1"
              style="color: #337AB7;"
            />
            <span>{{ $t('toCash') }}</span>
          </label>
          <label class="inline-flex items-center">
            <input
              v-model="type"
              type="radio"
              value="balance"
              :disabled="!!editingItemId"
            >
            <i
              class="fas fa-handshake ml-2 mr-1"
              style="color: #F0AD4E;"
            />
            <span>{{ $t('inDebt') }}</span>
          </label>
        </div>
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
        :disabled="!!editingItemId"
        :show-quantity="true"
        :show-price="true"
        :is-receipt="true"
        :show-amount="editingItemId == null"
        :only-products="true"
        :warehouse-id="warehouseId"
        :allow-all-warehouse-products="true"
        required
      />
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
import WarehouseReceiptDto from '@/dto/warehouse/WarehouseReceiptDto';
import { filterCashRegistersByClientBalance } from '@/utils/clientBalanceCashUtils';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import ProductSearch from '@/views/components/app/search/ProductSearch.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from "@/mixins/crudFormMixin";
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import { dateFormMixin } from '@/utils/dateUtils';

export default {
    components: { PrimaryButton, AlertDialog, ClientSearch, ProductSearch },
    mixins: [getApiErrorMessage, crudFormMixin, dateFormMixin, sideModalFooterPortal],
    props: {
        editingItem: { type: WarehouseReceiptDto, required: false, default: null }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    data() {
        return {
            date: this.editingItem?.date ? this.getFormattedDate(this.editingItem.date) : this.getCurrentLocalDateTime(),
            note: this.editingItem ? this.editingItem.note : '',
            warehouseId: this.editingItem ? this.editingItem.warehouseId  : '',
            type: this.editingItem ? this.editingItem.type : 'cash',
            cashId: this.editingItem ? this.editingItem.cashId : '',
            products: this.editingItem ? this.editingItem.products : [],
            selectedClient: this.editingItem ? this.editingItem.client : null,
            clientBalanceId: this.editingItem?.clientBalanceId ?? this.editingItem?.client_balance_id ?? null,
            allWarehouses: [],
            currencies: [],
            allCashRegisters: [],
        }
    },
    computed: {
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
            
            if (!this.type || (this.type !== 'cash' && this.type !== 'balance')) {
                validationErrors.push('• Выберите тип оплаты (В кассу или В кредит)');
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
                type: this.type,
                products: productsData
            };
        },
        async performSave(data) {
            if (this.editingItemId != null) {
                return await WarehouseReceiptController.updateItem(this.editingItemId, data);
            } else {
                return await WarehouseReceiptController.storeItem(data);
            }
        },
        async performDelete() {
            const resp = await WarehouseReceiptController.deleteItem(this.editingItemId);
            if (!resp.message) {
                throw new Error('Failed to delete receipt');
            }
            return resp;
        },
        onSaveSuccess(response) {
            if (response && response.message) {
                this.$store.dispatch('invalidateCache', { type: 'products' }).then(() => {
                    return this.$store.dispatch('loadAllProducts');
                });
                this.clearForm();
            }
        },
        clearForm() {
            this.date = this.getCurrentLocalDateTime();
            this.note = '';
            this.warehouseId = '';
            this.currencyId = '';
            this.selectedClient = null;
            this.clientBalanceId = null;
            this.products = [];
            this.type = 'cash';
            this.cashId = this.allCashRegisters?.length ? this.allCashRegisters[0].id : '';
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            if (newEditingItem) {
                this.date = newEditingItem.date ;
                this.note = newEditingItem.note ;
                this.warehouseId = newEditingItem.warehouseId ;
                this.currencyId = newEditingItem.currencyId ;
                this.selectedClient = newEditingItem.client || null;
                this.clientBalanceId = newEditingItem.clientBalanceId ?? newEditingItem.client_balance_id ?? null;
                this.products = newEditingItem.products || [];
                this.cashId = newEditingItem.cashId ;
                this.type = newEditingItem.type || (newEditingItem.cashId ? 'cash' : 'balance');
            }
        },
    }
}
</script>
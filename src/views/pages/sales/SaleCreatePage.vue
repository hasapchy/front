<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="flex min-h-0 flex-1 flex-col overflow-auto p-4">
      <ClientSearch
        v-model:selected-client="selectedClient"
        :disabled="!!editingItemId"
        :balance-id="clientBalanceId"
        @balance-changed="onBalanceChanged"
      />
      <div>
        <label>{{ $t('date') }}</label>
        <input
          v-model="date"
          type="datetime-local"
          :disabled="editingItemId && !canEditDate()"
          :min="getMinDate()"
        >
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
            v-for="parent in cashRegistersForSelect"
            :key="parent.id"
            :value="parent.id"
          >
            {{ parent.displayName || parent.name }} ({{ parent.currencySymbol  }})
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
              class="fas fa-wallet ml-2 mr-1"
              style="color: #337AB7;"
            />
            <span>{{ $t('toClientBalance') }}</span>
          </label>
        </div>
      </div>
      <div class="mt-2">
        <label class="block mb-1">{{ $t('project') }}</label>
        <select
          v-if="allProjects.length"
          v-model="projectId"
          :disabled="!!editingItemId"
        >
          <option value="">
            {{ $t('no') }}
          </option>
          <option
            v-for="parent in allProjects"
            :key="parent.id"
            :value="parent.id"
          >
            {{ parent.name }}
          </option>
        </select>
        <select
          v-else
          v-model="projectId"
          :disabled="!!editingItemId"
        >
          <option value="">
            {{ $t('no') }}
          </option>
        </select>
      </div>

      <div class="mt-2">
        <label>{{ $t('note') }}</label>
        <input
          v-model="note"
          type="text"
          :disabled="!!editingItemId"
        >
      </div>

      <div class="mt-2">
        <label class="block mb-1 required">{{ $t('warehouse') }}</label>
        <div class="flex items-center space-x-2">
          <select
            v-if="allWarehouses.length"
            v-model="warehouseId"
            required
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
            required
            :disabled="!!editingItemId"
          >
            <option value="">
              {{ $t('no') }}
            </option>
          </select>
        </div>
      </div>
      <ProductSearch
        v-model="products"
        v-model:discount="discount"
        :disabled="!!editingItemId"
        v-model:discount-type="discountType"
        :show-quantity="true"
        :show-price="true"
        :show-price-type="true"
        :is-sale="true"
        :currency-symbol="currencySymbol"
        :warehouse-id="warehouseId"
        required
      />
    </div>
        
    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton
          v-if="editingItemId != null"
          :onclick="showDeleteDialog"
          :is-danger="true"
          :is-loading="deleteLoading"
          icon="fas fa-trash"
          :disabled="!$store.getters.hasPermission('sales_delete')"
        />
        <PrimaryButton
          icon="fas fa-save"
          :onclick="save"
          :is-loading="saveLoading"
          :disabled="(editingItemId != null && !$store.getters.hasPermission('sales_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('sales_create'))"
          :aria-label="$t('save')"
        />
      </div>
    </teleport>
    <AlertDialog
      :dialog="deleteDialog"
      :descr="$t('deleteSaleConfirm')"
      :confirm-text="$t('deleteSale')"
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
import SaleController from "@/api/SaleController";
import SaleDto from "@/dto/sale/SaleDto";
import { filterCashRegistersByClientBalance } from "@/utils/clientBalanceCashUtils";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import AlertDialog from "@/views/components/app/dialog/AlertDialog.vue";
import ClientSearch from "@/views/components/app/search/ClientSearch.vue";
import ProductSearch from "@/views/components/app/search/ProductSearch.vue";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import crudFormMixin from "@/mixins/crudFormMixin";
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import { dateFormMixin } from '@/utils/dateUtils';
import storeDataLoaderMixin from "@/mixins/storeDataLoaderMixin";


export default {
    components: { PrimaryButton, AlertDialog, ClientSearch, ProductSearch },
    mixins: [getApiErrorMessage, crudFormMixin, dateFormMixin, storeDataLoaderMixin, sideModalFooterPortal],
    props: {
        editingItem: { type: SaleDto, required: false, default: null, },
    },
    emits: ["saved", "saved-error", "deleted", "deleted-error", "close-request"],
    data() {
        return {
            date: this.getCurrentLocalDateTime(),
            note: "",
            type: "cash",
            warehouseId: "",
            currencyId: "",
            projectId: "",
            cashId: "",
            products: [],
            discount: 0,
            discountType: "fixed",
            selectedClient: null,
            clientBalanceId: this.editingItem?.clientBalanceId ?? this.editingItem?.client_balance_id ?? null,
            allWarehouses: [],
            allProjects: [],
            allCashRegisters: [],
            currencies: [],
        };
    },
    computed: {
        selectedCurrency() {
            return this.currencies.find((currency) => currency.id == this.currencyId);
        },
        selectedCash() {
            return this.allCashRegisters.find((c) => c.id == this.cashId);
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
        subtotal() {
            return this.products.reduce((sum, p) => {
                return sum + (Number(p.price) || 0) * (Number(p.quantity) || 0);
            }, 0);
        },
        discountAmount() {
            const disc = Number(this.discount) || 0;
            if (!disc) return 0;
            if (this.discountType === "percent") {
                return (this.subtotal * disc) / 100;
            }
            return disc;
        },
        defaultCurrency() {
            return this.currencies.find((c) => c.isDefault);
        },
        currencySymbol() {
            if (this.type === "cash") {
                return this.selectedCash?.currencySymbol || "";
            } else {
                return this.defaultCurrency?.symbol || "";
            }
        }
    },
    watch: {
        cashId: {
            handler(newCashId) {
                if (this.balanceLocksCurrencyCash) {
                    return;
                }
                if (!newCashId || !this.allCashRegisters?.length) {
                    return;
                }
                const selectedCash = this.allCashRegisters.find((c) => c.id == newCashId);
                if (selectedCash?.currencyId) {
                    this.currencyId = selectedCash.currencyId;
                }
            },
            immediate: true,
        },
        type: {
            handler(newType, oldType) {
                if (newType === "balance") {
                    if (!this.balanceLocksCurrencyCash) {
                        const defaultCurrency = this.currencies.find((c) => c.isDefault);
                        if (defaultCurrency) {
                            this.currencyId = defaultCurrency.id;
                        }
                    }
                } else if (newType === "cash" && oldType === "balance") {
                    if (!this.cashId && this.allCashRegisters?.length) {
                        this.cashId = this.allCashRegisters[0].id;
                    }
                }
            },
        },
        // Отслеживаем изменения в store
        '$store.state.warehouses': {
            handler(newVal) {
                this.allWarehouses = newVal;
                if (newVal?.length && !this.warehouseId && !this.editingItem) {
                    this.warehouseId = newVal[0].id;
                }
            },
            immediate: true
        },
        '$store.state.cashRegisters': {
            handler(newVal) {
                this.allCashRegisters = newVal;
                if (newVal?.length && this.clientBalanceId && this.balanceLocksCurrencyCash) {
                    this.applyBalanceDefaults(this.clientBalanceId);
                }
                if (newVal?.length && !this.cashId && !this.editingItem && !this.balanceLocksCurrencyCash) {
                    this.cashId = newVal[0].id;
                }
            },
            immediate: true
        },
        '$store.state.projects': {
            handler(newVal) {
                // Фильтруем только активные проекты
                this.allProjects = newVal.filter(p => p.statusId !== 3 && p.statusId !== 4);
            },
            immediate: true
        },
        '$store.state.currencies': {
            handler(newVal) {
                this.currencies = newVal;
            },
            immediate: true
        },
        '$store.state.clients': {
            handler(newClients) {
                if (this.selectedClient?.id && newClients?.length) {
                    const updated = newClients.find(c => c.id === this.selectedClient.id);
                    if (updated) {
                        this.selectedClient = updated;
                    }
                }
            },
            immediate: true,
            deep: true
        },
    },
    mounted() {
        this.$nextTick(async () => {
            await Promise.all([
                this.fetchCurrencies(),
                this.fetchAllWarehouses(),
                this.fetchAllProjects(),
                this.fetchAllCashRegisters(),
                this.fetchClients()
            ]);
            
            // Инициализация по умолчанию для нового элемента происходит через watchers на Store
            // (allWarehouses, allCashRegisters автоматически установят первые значения)
            if (!this.editingItem) {
                const defaultCurrency = this.currencies.find((c) => c.isDefault);
                if (defaultCurrency && !this.currencyId) {
                    this.currencyId = defaultCurrency.id;
                }
            }

            await this.$nextTick();
            this.saveInitialState();
        });
    },
    methods: {
        applyBalanceDefaults(balanceId) {
            const row = this.clientBalances.find((b) => Number(b.id) === Number(balanceId));
            if (!row) {
                return;
            }
            const curId = row.currencyId ?? row.currency?.id;
            if (curId != null) {
                this.currencyId = curId;
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
                selectedClient: this.selectedClient?.id || null,
                date: this.date,
                type: this.type,
                cashId: this.cashId,
                clientBalanceId: this.clientBalanceId,
                projectId: this.projectId,
                note: this.note,
                warehouseId: this.warehouseId,
                products: this.products.map(p => ({
                    productId: p.productId,
                    quantity: p.quantity,
                    price: p.price
                })),
                discount: this.discount,
                discountType: this.discountType,
            };
        },
        async fetchAllWarehouses() {
            await this.loadStoreData({
                getterName: 'warehouses',
                dispatchName: 'loadWarehouses',
                localProperty: 'allWarehouses',
                defaultValue: []
            });
        },
    async fetchAllProjects() {
      await this.loadStoreData({
        getterName: 'activeProjects',
        dispatchName: 'loadProjects',
        onLoaded: (activeProjects) => {
          if (this.editingItem?.projectId && this.editingItem?.projectName) {
            const hasProject = activeProjects.some(p => p.id === this.editingItem.projectId);
            if (!hasProject) {
              this.allProjects = [
                ...activeProjects,
                { id: this.editingItem.projectId, name: this.editingItem.projectName }
              ];
              return;
            }
          }
          this.allProjects = activeProjects;
        }
      });
    },
        async fetchCurrencies() {
            await this.loadStoreData({
                getterName: 'currencies',
                dispatchName: 'loadCurrencies',
                localProperty: 'currencies',
                defaultValue: []
            });
        },
        async fetchAllCashRegisters() {
            await this.loadStoreData({
                getterName: 'cashRegisters',
                dispatchName: 'loadCashRegisters',
                localProperty: 'allCashRegisters',
                defaultValue: []
            });
        },
        async fetchClients() {
            await this.loadStoreData({
                getterName: 'clients',
                dispatchName: 'loadClients'
            });
        },
        prepareSave() {
            if (!this.selectedClient?.id) {
                throw new Error('Необходимо выбрать клиента');
            }
            if (!this.warehouseId) {
                throw new Error('Необходимо выбрать склад');
            }
            if (!this.products?.length) {
                throw new Error('Необходимо добавить товары');
            }

            const calculatedDiscount = this.discountAmount;
            if (calculatedDiscount > this.subtotal) {
                throw new Error('Скидка не может превышать сумму продажи');
            }

            return {
                clientId: this.selectedClient?.id,
                clientBalanceId: this.clientBalanceId || null,
                projectId: this.projectId || null,
                warehouseId: this.warehouseId,
                currencyId: this.type === "cash" ? this.selectedCash?.currencyId : this.currencyId,
                cashId: this.cashId,
                type: this.type,
                date: this.date,
                note: this.note,
                discount: this.discount,
                discountType: this.discountType,
                products: this.products.map((p) => ({
                    productId: p.productId,
                    quantity: p.quantity,
                    price: p.price,
                })),
            };
        },
        async performSave(data) {
            if (this.editingItemId != null) {
                return await SaleController.updateItem(this.editingItemId, data);
            } else {
                return await SaleController.storeItem(data);
            }
        },
        async performDelete() {
            const resp = await SaleController.deleteItem(this.editingItemId);
            if (!resp.message) {
                throw new Error('Failed to delete sale');
            }
            return resp;
        },
        clearForm() {
            this.date = this.getCurrentLocalDateTime();
            this.note = "";
            this.type = "cash";
            this.warehouseId = this.allWarehouses?.[0]?.id || "";
            this.currencyId = "";
            this.projectId = "";
            this.cashId = this.allCashRegisters?.[0]?.id || "";
            this.selectedClient = null;
            this.clientBalanceId = null;
            this.products = [];
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            if (newEditingItem) {
                this.date = newEditingItem.date ? this.getFormattedDate(newEditingItem.date) : this.getCurrentLocalDateTime();
                this.note = newEditingItem.note || "";
                this.type = newEditingItem.cashId || newEditingItem.transactionId ? "cash" : "balance";
                this.warehouseId = newEditingItem.warehouseId || this.allWarehouses?.[0]?.id || "";
                this.currencyId = newEditingItem.currencyId || "";
                this.projectId = newEditingItem.projectId || "";
                this.cashId = newEditingItem.cashId || this.allCashRegisters?.[0]?.id || "";
                this.selectedClient = newEditingItem.client || null;
                this.clientBalanceId = newEditingItem.clientBalanceId ?? newEditingItem.client_balance_id ?? null;
                this.products = newEditingItem.products || [];
                this.discount = newEditingItem.discount || 0;
                this.discountType = newEditingItem.discountType || "fixed";
            }
        },
    },
};
</script>

<template>
  <div class="mt-4">
    <transition
      name="fade"
      mode="out-in"
    >
      <div
        v-if="editingItem && !loading"
        key="table"
      >
        <DraggableTable
          :table-key="`client.operations.${selectedFilter}`"
          :columns-config="columnsConfig"
          :table-data="tableData || []"
          :item-mapper="itemMapper"
          :on-item-click="handleItemClick"
        >
          <template #tableSettingsAdditional>
            <FiltersContainer
              :has-active-filters="hasActiveFilters"
              :active-filters-count="getActiveFiltersCount()"
              @reset="resetFilters"
              @apply="applyFilters"
            >
              <div>
                <label class="block mb-2 text-xs font-semibold">{{ $t('type') }}</label>
                <div class="flex flex-col gap-2">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      v-model="selectedFilter"
                      type="radio"
                      value="orders"
                      class="rounded"
                    >
                    <span>{{ $t('orders') }}</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      v-model="selectedFilter"
                      type="radio"
                      value="sales"
                      class="rounded"
                    >
                    <span>{{ $t('sales') }}</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      v-model="selectedFilter"
                      type="radio"
                      value="receipts"
                      class="rounded"
                    >
                    <span>{{ $t('warehouseReceipts') }}</span>
                  </label>
                </div>
              </div>
            </FiltersContainer>
          </template>
        </DraggableTable>
      </div>
      <div
        v-else
        key="loader"
        class="min-h-64"
      >
        <TableSkeleton />
      </div>
    </transition>

    <SideModalDialog
      :show-form="entityModalOpen"
      :title="clientOperationsEntityTitle"
      :onclose="closeEntityModal"
      :level="2"
    >
      <template v-if="entityLoading">
        <div class="min-h-64">
          <TableSkeleton />
        </div>
      </template>
      <template v-else>
        <OrderCreatePage 
          v-if="selectedFilter === 'orders' && selectedEntity"
          :editing-item="selectedEntity"
          @saved="onEntitySaved"
          @saved-error="onEntitySavedError"
          @deleted="onEntityDeleted"
          @deleted-error="onEntityDeletedError"
        />
        <SaleCreatePage 
          v-if="selectedFilter === 'sales' && selectedEntity"
          :editing-item="selectedEntity"
          @saved="onEntitySaved"
          @saved-error="onEntitySavedError"
          @deleted="onEntityDeleted"
          @deleted-error="onEntityDeletedError"
        />
        <WarehouseReceiptCreatePage 
          v-if="selectedFilter === 'receipts' && selectedEntity"
          :editing-item="selectedEntity"
          @saved="onEntitySaved"
          @saved-error="onEntitySavedError"
          @deleted="onEntityDeleted"
          @deleted-error="onEntityDeletedError"
        />
      </template>
    </SideModalDialog>
  </div>
</template>

<script>
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import FiltersContainer from "@/views/components/app/forms/FiltersContainer.vue";
import TableSkeleton from "@/views/components/app/TableSkeleton.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import OrderController from "@/api/OrderController";
import SaleController from "@/api/SaleController";
import WarehouseReceiptController from "@/api/WarehouseReceiptController";
import OrderCreatePage from "@/views/pages/orders/OrderCreatePage.vue";
import SaleCreatePage from "@/views/pages/sales/SaleCreatePage.vue";
import WarehouseReceiptCreatePage from "@/views/pages/warehouses/WarehousesReceiptCreatePage.vue";
import ClientDto from "@/dto/client/ClientDto";
import { translateOrderStatus } from '@/utils/translationUtils';

import listQueryMixin from '@/mixins/listQueryMixin';
export default {
    components: {
        DraggableTable,
        FiltersContainer,
        TableSkeleton,
        SideModalDialog,
        OrderCreatePage,
        SaleCreatePage,
        WarehouseReceiptCreatePage,
    },
    mixins: [listQueryMixin],
    props: {
        editingItem: { 
            required: false,
            default: null,
            validator: function(value) {
                return value === null || (value && value.id !== undefined);
            }
        },
    },
    data() {
        return {
            selectedFilter: 'orders',
            loading: false,
            tableData: [],
            lastFetchedClientId: null,
            lastFetchedFilter: null,
            entityModalOpen: false,
            entityLoading: false,
            selectedEntity: null,
            currencySymbol: '',
            columnsConfig: [],
        };
    },
    computed: {
        clientOperationsEntityTitle() {
            if (!this.entityModalOpen) {
                return '';
            }
            if (this.entityLoading) {
                return this.$t('loading');
            }
            if (this.selectedFilter === 'orders' && this.selectedEntity) {
                return this.$t('editOrder');
            }
            if (this.selectedFilter === 'sales' && this.selectedEntity) {
                return this.$t('editSale');
            }
            if (this.selectedFilter === 'receipts' && this.selectedEntity) {
                return this.$t('editReceipt');
            }
            return '';
        },
    },
    watch: {
        'editingItem.id': {
            handler(newId) {
                if (newId) {
                    this.fetchData();
                } else {
                    this.tableData = [];
                    this.lastFetchedClientId = null;
                    this.selectedEntity = null;
                    this.entityModalOpen = false;
                }
            },
            immediate: true,
        },
        selectedFilter() {
            this.updateColumnsConfig();
            if (this.editingItem && this.editingItem.id) {
                this.fetchData();
            }
        },
    },
    async mounted() {
        await this.fetchDefaultCurrency();
        this.updateColumnsConfig();
    },
    methods: {
        updateColumnsConfig() {
            const baseColumns = [
                { name: "id", label: "№", size: 60 },
                { name: "name", label: this.$t("name"), size: 200 },
            ];
            
            if (this.selectedFilter === 'orders') {
                this.columnsConfig = [
                    ...baseColumns,
                    { name: "status", label: this.$t("status"), size: 120 },
                    { name: "dateUser", label: this.$t("dateUser"), size: 150 },
                    { name: "amount", label: this.$t("amount"), size: 130, html: true },
                ];
            } else {
                this.columnsConfig = [
                    ...baseColumns,
                    { name: "dateUser", label: this.$t("dateUser"), size: 150 },
                    { name: "amount", label: this.$t("amount"), size: 130, html: true },
                ];
            }
        },
        async fetchDefaultCurrency() {
            try {
                await this.$store.dispatch('loadCurrencies');
                const currencies = this.$store.getters.currencies;
                const defaultCurrency = currencies.find(c => c.isDefault);
                this.currencySymbol = defaultCurrency ? defaultCurrency.symbol : '';
            } catch (error) {
                this.currencySymbol = '';
            }
        },
        async fetchData() {
            if (!this.editingItem || !this.editingItem.id) return;
            
            if (this.lastFetchedClientId === this.editingItem.id && 
                this.selectedFilter === this.lastFetchedFilter) {
                return;
            }
            
            this.loading = true;
            try {
                const clientId = this.editingItem.id;
                const perPage = 50;
                let response;
                if (this.selectedFilter === 'orders') {
                    response = await OrderController.getItems(1, null, 'all_time', null, null, '', '', clientId, perPage);
                } else if (this.selectedFilter === 'sales') {
                    response = await SaleController.getItems(1, null, 'all_time', null, null, perPage, clientId);
                } else if (this.selectedFilter === 'receipts') {
                    response = await WarehouseReceiptController.getItems(1, perPage, clientId);
                }
                const items = response?.items || [];
                this.tableData = items.map((item) => this.mapOperationToRow(item));
                this.lastFetchedClientId = clientId;
                this.lastFetchedFilter = this.selectedFilter;
            } catch (error) {
                console.error('Error fetching data:', error);
                this.tableData = [];
            } finally {
                this.loading = false;
            }
        },
        formatDateUser(item) {
            const creatorName = item.creator?.name ;
            return item.formatDate ? `${item.formatDate()} / ${creatorName}` : (item.date ? `${new Date(item.date).toLocaleString()} / ${creatorName}` : '');
        },
        mapOperationToRow(item) {
            const type = this.selectedFilter;
            let name = item.note ;
            let amount = 0;
            let status = '';
            if (type === 'orders') {
                name = name || item.description || `Заказ #${item.id}`;
                amount = item.totalPrice || item.price || 0;
                status = translateOrderStatus(item.statusName || item.status?.name, this.$t) ;
            } else if (type === 'sales') {
                name = name || `Продажа #${item.id}`;
                amount = item.totalPrice || item.price || 0;
            } else if (type === 'receipts') {
                name = name || `Оприходование #${item.id}`;
                amount = item.amount || 0;
            }
            return {
                id: item.id,
                name,
                status,
                dateUser: this.formatDateUser(item),
                amount,
                currencySymbol: item.currencySymbol || this.currencySymbol,
                originalData: item,
            };
        },
        itemMapper(item, column) {
            switch (column) {
                case "id":
                    return item.id ;
                case "name":
                    return item.name ;
                case "status":
                    return item.status ;
                case "dateUser":
                    return item.dateUser ;
                case "amount": {
                    const amount = parseFloat(item.amount || 0);
                    const symbol = item.currencySymbol || this.currencySymbol ;
                    return `<span class="font-semibold">${this.$formatNumber(amount, null, true)} ${symbol}</span>`;
                }
                default:
                    return item[column] ;
            }
        },
        async handleItemClick(item) {
            if (!this.editingItem || !this.editingItem.id) return;
            
            try {
                this.entityLoading = true;
                
                if (this.selectedFilter === 'orders') {
                    const order = await OrderController.getItem(item.id);
                    this.selectedEntity = order;
                } else if (this.selectedFilter === 'sales') {
                    const sale = await SaleController.getItem(item.id);
                    this.selectedEntity = sale;
                } else if (this.selectedFilter === 'receipts') {
                    const receipt = await WarehouseReceiptController.getItem(item.id);
                    this.selectedEntity = receipt;
                }
                
                this.entityModalOpen = true;
            } catch (error) {
                console.error('Error loading item:', error);
                this.$notify?.({ type: 'error', text: this.$t('display.errorLoadingTabData') });
            } finally {
                this.entityLoading = false;
            }
        },
        closeEntityModal() {
            this.entityModalOpen = false;
            this.selectedEntity = null;
            this.entityLoading = false;
        },
        getActiveFiltersCount() {
            return this.getActiveFiltersCountFromConfig([
                { value: this.selectedFilter, defaultValue: 'orders' }
            ]);
        },
        resetFilters() {
            this.resetFiltersFromConfig(
                { selectedFilter: 'orders' },
                () => {
                    if (this.editingItem?.id) {
                        this.fetchData();
                    }
                }
            );
        },
        applyFilters() {
            if (this.editingItem?.id) this.fetchData();
        },
        async onEntitySaved() {
            this.closeEntityModal();
            if (this.editingItem && this.editingItem.id) {
                await this.$store.dispatch('invalidateCache', { type: 'clients' });
                await this.$store.dispatch('loadClients');
                this.lastFetchedFilter = null;
                this.fetchData();
            }
        },
        onEntitySavedError(error) {
            console.error('Error saving entity:', error);
        },
        async onEntityDeleted() {
            this.closeEntityModal();
            if (this.editingItem && this.editingItem.id) {
                await this.$store.dispatch('invalidateCache', { type: 'clients' });
                await this.$store.dispatch('loadClients');
                this.lastFetchedFilter = null;
                this.fetchData();
            }
        },
        onEntityDeletedError(error) {
            console.error('Error deleting entity:', error);
        },
    },
};
</script>


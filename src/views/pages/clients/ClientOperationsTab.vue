<template>
    <div class="mt-4">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-md font-semibold">{{ $t('operations') }}</h3>
            <div class="flex gap-2">
                <button 
                    @click="selectedFilter = 'orders'"
                    :class="[
                        'px-4 py-2 rounded transition-colors',
                        selectedFilter === 'orders' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    ]">
                    {{ $t('orders') }}
                </button>
                <button 
                    @click="selectedFilter = 'sales'"
                    :class="[
                        'px-4 py-2 rounded transition-colors',
                        selectedFilter === 'sales' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    ]">
                    {{ $t('sales') }}
                </button>
                <button 
                    @click="selectedFilter = 'receipts'"
                    :class="[
                        'px-4 py-2 rounded transition-colors',
                        selectedFilter === 'receipts' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    ]">
                    {{ $t('warehouseReceipts') }}
                </button>
            </div>
        </div>

        <div v-if="loading" class="text-gray-500">{{ $t('loading') }}</div>
        <div v-else-if="!tableData || tableData.length === 0" class="text-gray-500">
            {{ $t('noData') }}
        </div>
        <DraggableTable 
            v-if="!loading && tableData && tableData.length > 0 && editingItem" 
            :table-key="`client.operations.${selectedFilter}`"
            :columns-config="columnsConfig" 
            :table-data="tableData" 
            :item-mapper="itemMapper"
            :onItemClick="handleItemClick" />

        <SideModalDialog :showForm="entityModalOpen" :onclose="closeEntityModal">
            <template v-if="entityLoading">
                <div class="p-8 flex justify-center items-center min-h-[200px]">
                    <svg class="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                </div>
            </template>
            <template v-else>
                <OrderCreatePage 
                    v-if="selectedFilter === 'orders' && selectedEntity"
                    :editingItem="selectedEntity"
                    @saved="onEntitySaved"
                    @saved-error="onEntitySavedError"
                    @deleted="onEntityDeleted"
                    @deleted-error="onEntityDeletedError" />
                <SaleCreatePage 
                    v-if="selectedFilter === 'sales' && selectedEntity"
                    :editingItem="selectedEntity"
                    @saved="onEntitySaved"
                    @saved-error="onEntitySavedError"
                    @deleted="onEntityDeleted"
                    @deleted-error="onEntityDeletedError" />
                <WarehouseReceiptCreatePage 
                    v-if="selectedFilter === 'receipts' && selectedEntity"
                    :editingItem="selectedEntity"
                    @saved="onEntitySaved"
                    @saved-error="onEntitySavedError"
                    @deleted="onEntityDeleted"
                    @deleted-error="onEntityDeletedError" />
            </template>
        </SideModalDialog>
    </div>
</template>

<script>
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import OrderController from "@/api/OrderController";
import SaleController from "@/api/SaleController";
import WarehouseReceiptController from "@/api/WarehouseReceiptController";
import ClientDto from "@/dto/client/ClientDto";
import { defineAsyncComponent } from 'vue';

const OrderCreatePage = defineAsyncComponent(() => 
    import("@/views/pages/orders/OrderCreatePage.vue")
);
const SaleCreatePage = defineAsyncComponent(() => 
    import("@/views/pages/sales/SaleCreatePage.vue")
);
const WarehouseReceiptCreatePage = defineAsyncComponent(() => 
    import("@/views/pages/warehouses/WarehousesReceiptCreatePage.vue")
);

export default {
    components: {
        DraggableTable,
        SideModalDialog,
        OrderCreatePage,
        SaleCreatePage,
        WarehouseReceiptCreatePage,
    },
    props: {
        editingItem: { 
            required: false,
            default: null,
            validator: function(value) {
                return value === null || (value && typeof value === 'object' && value.id !== undefined);
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
            currencyCode: '',
            columnsConfig: [],
        };
    },
    async mounted() {
        await this.fetchDefaultCurrency();
        this.updateColumnsConfig();
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
                    { name: "date", label: this.$t("date"), size: 150 },
                    { name: "amount", label: this.$t("amount"), size: 130, html: true },
                ];
            } else {
                this.columnsConfig = [
                    ...baseColumns,
                    { name: "date", label: this.$t("date"), size: 150 },
                    { name: "amount", label: this.$t("amount"), size: 130, html: true },
                ];
            }
        },
        async fetchDefaultCurrency() {
            try {
                await this.$store.dispatch('loadCurrencies');
                const currencies = this.$store.getters.currencies;
                const defaultCurrency = currencies.find(c => c.isDefault);
                this.currencyCode = defaultCurrency ? defaultCurrency.symbol : '';
            } catch (error) {
                this.currencyCode = '';
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
                let response;
                
                if (this.selectedFilter === 'orders') {
                    response = await OrderController.getItems(
                        1, 
                        null, 
                        'all_time', 
                        null, 
                        null, 
                        '', 
                        '', 
                        this.editingItem.id, 
                        1000
                    );
                    this.tableData = response.items.map(order => ({
                        id: order.id,
                        name: order.note || order.description || `Заказ #${order.id}`,
                        status: order.statusName || '-',
                        date: order.formatDate ? order.formatDate() : (order.date ? new Date(order.date).toLocaleString() : '-'),
                        amount: order.totalPrice || order.price || 0,
                        currencySymbol: order.currencySymbol || this.currencyCode,
                        originalData: order,
                    }));
                } else if (this.selectedFilter === 'sales') {
                    response = await SaleController.getItems(1, null, 'all_time', null, null, 1000);
                    const sales = response.items.filter(sale => 
                        sale.client && sale.client.id === this.editingItem.id
                    );
                    this.tableData = sales.map(sale => ({
                        id: sale.id,
                        name: sale.note || `Продажа #${sale.id}`,
                        date: sale.formatDate ? sale.formatDate() : (sale.date ? new Date(sale.date).toLocaleString() : '-'),
                        amount: sale.totalPrice || sale.price || 0,
                        currencySymbol: sale.currencySymbol || this.currencyCode,
                        originalData: sale,
                    }));
                } else if (this.selectedFilter === 'receipts') {
                    response = await WarehouseReceiptController.getItems(1, 1000);
                    const receipts = response.items.filter(receipt => 
                        receipt.client && receipt.client.id === this.editingItem.id
                    );
                    this.tableData = receipts.map(receipt => ({
                        id: receipt.id,
                        name: receipt.note || `Оприходование #${receipt.id}`,
                        date: receipt.formatDate ? receipt.formatDate() : (receipt.date ? new Date(receipt.date).toLocaleString() : '-'),
                        amount: receipt.amount || 0,
                        currencySymbol: receipt.currencySymbol || this.currencyCode,
                        originalData: receipt,
                    }));
                }
                
                this.lastFetchedClientId = this.editingItem.id;
                this.lastFetchedFilter = this.selectedFilter;
            } catch (error) {
                console.error('Error fetching data:', error);
                this.tableData = [];
            } finally {
                this.loading = false;
            }
        },
        itemMapper(item, column) {
            switch (column) {
                case "id":
                    return item.id || '-';
                case "name":
                    return item.name || '-';
                case "status":
                    return item.status || '-';
                case "date":
                    return item.date || '-';
                case "amount": {
                    const amount = parseFloat(item.amount || 0);
                    const symbol = item.currencySymbol || this.currencyCode || '';
                    return `<span class="font-semibold">${this.$formatNumber(amount, null, true)} ${symbol}</span>`;
                }
                default:
                    return item[column] || '-';
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
                this.$notify?.({ type: 'error', text: 'Ошибка при загрузке данных' });
            } finally {
                this.entityLoading = false;
            }
        },
        closeEntityModal() {
            this.entityModalOpen = false;
            this.selectedEntity = null;
            this.entityLoading = false;
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


<template>
    <div class="mt-4">
        <h3 class="text-md font-semibold mb-2">История баланса</h3>
        <div class="mb-2 flex items-center gap-2">
            <span>Итоговый баланс:</span>
            <span :class="{
                'text-[#5CB85C] font-bold': editingItem && editingItem.balanceNumeric() >= 0,
                'text-[#EE4F47] font-bold': editingItem && editingItem.balanceNumeric() < 0
            }">
                {{ editingItem ? editingItem.balanceFormatted() : "0.00" }} TMT
            </span>
        </div>

        <div v-if="balanceLoading" class="text-gray-500">Загрузка...</div>
        <div v-else-if="balanceHistory.length === 0" class="text-gray-500">
            История отсутствует
        </div>
        <DraggableTable v-if="!balanceLoading && balanceHistory.length" table-key="client.balance"
            :columns-config="columnsBalance" :table-data="balanceHistory" :item-mapper="itemMapperBalance"
            :onItemClick="handleBalanceItemClick" />

        <!-- Модалка для entity -->
        <SideModalDialog :showForm="entityModalOpen" :onclose="closeEntityModal">
            <template v-if="selectedEntity">
                <component :is="getModalComponent(selectedEntity.type)" v-bind="getModalProps(selectedEntity)" />
            </template>
        </SideModalDialog>
    </div>
</template>

<script>
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import TransactionCreatePage from "@/views/pages/transactions/TransactionCreatePage.vue";
import SaleCreatePage from "@/views/pages/sales/SaleCreatePage.vue";
import OrderCreatePage from "@/views/pages/orders/OrderCreatePage.vue";
import WarehousesReceiptCreatePage from "@/views/pages/warehouses/WarehousesReceiptCreatePage.vue";
import TransactionController from "@/api/TransactionController";
import ClientController from "@/api/ClientController";

export default {
    components: {
        DraggableTable,
        SideModalDialog,
        TransactionCreatePage,
        SaleCreatePage,
        OrderCreatePage,
        WarehousesReceiptCreatePage,
    },
    props: {
        editingItem: { required: true },
    },
    data() {
        return {
            balanceLoading: false,
            balanceHistory: [],
            selectedEntity: null,
            entityModalOpen: false,
            columnsBalance: [
                { name: "date", label: "Дата", size: 100 },
                { name: "type", label: "Тип" },
                { name: "description", label: "Описание", size: 300 },
                { name: "amount", label: "Сумма", size: 120, html: true },
            ],
        };
    },
    mounted() {
        this.fetchBalanceHistory();
    },
    methods: {
        async fetchBalanceHistory() {
            if (!this.editingItem) return;
            this.balanceLoading = true;
            try {
                this.balanceHistory = await ClientController.getBalanceHistory(
                    this.editingItem.id
                );
            } catch (e) {
                console.error("Ошибка при загрузке истории баланса:", e);
                this.balanceHistory = [];
            }
            this.balanceLoading = false;
        },
        itemMapperBalance(i, c) {
            switch (c) {
                case "date":
                    return i.formatDate();
                case "type":
                    return i.label?.() ?? i.type;
                case "description":
                    return i.description;
                case "amount":
                    return i.formatAmountWithColor?.();
                default:
                    return i[c];
            }
        },
        async handleBalanceItemClick(item) {
            switch (item.source) {
                case "transaction":
                    try {
                        const resp = await TransactionController.getItem(item.sourceId);
                        this.selectedEntity = {
                            type: "transaction",
                            data: resp.item,
                        };
                        this.entityModalOpen = true;
                    } catch (e) {
                        console.error("Ошибка при загрузке транзакции:", e);
                    }
                    break;
                case "sale":
                case "order":
                case "receipt":
                    this.selectedEntity = {
                        type: item.source,
                        id: item.sourceId,
                    };
                    this.entityModalOpen = true;
                    break;
                default:
                    this.selectedEntity = null;
            }
        },
        getModalProps(entity) {
            if (entity.type === "transaction") {
                return {
                    editingItem: entity.data,
                };
            }
            return {
                editingItemId: entity.id,
            };
        },
        getModalComponent(type) {
            switch (type) {
                case "sale":
                    return SaleCreatePage;
                case "order":
                    return OrderCreatePage;
                case "transaction":
                    return TransactionCreatePage;
                case "receipt":
                    return WarehousesReceiptCreatePage;
                default:
                    return null;
            }
        },
        closeEntityModal() {
            this.entityModalOpen = false;
            this.selectedEntity = null;
        },
    },
    watch: {
        editingItem: {
            handler() {
                this.fetchBalanceHistory();
            },
            immediate: true,
        },
    },
};
</script>

<template>
    <div class="flex justify-between items-center mb-2">
        <div class="flex items-center">
            <PrimaryButton :onclick="() => showModal(null)" icon="fas fa-plus">
                {{ $t('addOrder') }}
            </PrimaryButton>
            
            <div class="ml-4">
                <select v-model="dateFilter" @change="fetchItems" class="w-full p-2 pl-10 border rounded">
                    <option value="all_time">{{ $t('allTime') }}</option>
                    <option value="today">{{ $t('today') }}</option>
                    <option value="yesterday">{{ $t('yesterday') }}</option>
                    <option value="this_week">{{ $t('thisWeek') }}</option>
                    <option value="this_month">{{ $t('thisMonth') }}</option>
                    <option value="last_week">{{ $t('lastWeek') }}</option>
                    <option value="last_month">{{ $t('lastMonth') }}</option>
                    <option value="custom">{{ $t('selectDates') }}</option>
                </select>
            </div>
            <div v-if="dateFilter === 'custom'" class="flex space-x-2 items-center ml-4">
                <input type="date" v-model="startDate" @change="fetchItems" class="w-full p-2 border rounded" />
                <input type="date" v-model="endDate" @change="fetchItems" class="w-full p-2 border rounded" />
            </div>

            <div class="ml-4">
                <CheckboxFilter 
                    v-model="statusFilter"
                    :options="statusOptions"
                    placeholder="allStatuses"
                    @change="fetchItems"
                />
            </div>

            <div class="ml-4">
                <OrderPaymentFilter 
                    v-model="paidOrdersFilter"
                    :orders="data ? data.items : []"
                    :statusId="4"
                    @change="handlePaidOrdersFilterChange"
                />
            </div>

            <div class="ml-4">
                <PrimaryButton 
                    :onclick="resetFilters"
                    icon="fas fa-trash"
                    :isLight="true">
                    {{ $t('resetFilters') }}
                </PrimaryButton>
            </div>
        </div>
        <Pagination v-if="data" :currentPage="data.currentPage" :lastPage="data.lastPage" @changePage="fetchItems" />
    </div>
    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()"
        :show-batch-status-select="showBatchStatusSelect" :statuses="statuses"
        :handle-change-status="handleChangeStatus" :show-status-select="true" />
    <transition name="fade" mode="out-in">
        <div v-if="data && !loading" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="admin.orders" :columns-config="translatedColumnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" :onItemClick="(i) => showModal(i)" @selectionChange="selectedIds = $event" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i>
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose" :timelineCollapsed="timelineCollapsed" 
        :showTimelineButton="!!editingItem" @toggle-timeline="toggleTimeline">
        <OrderCreatePage ref="ordercreatepageForm" @saved="handleSaved" @saved-silent="handleSavedSilent" @saved-error="handleSavedError"
            @deleted="handleDeleted" @deleted-error="handleDeletedError" @close-request="closeModal" :editingItem="editingItem" />

        <template #timeline>
            <TimelinePanel v-if="editingItem && !timelineCollapsed" ref="timelinePanel" :type="'order'" :id="editingItem.id" @toggle-timeline="toggleTimeline" />
        </template>
    </SideModalDialog>

    <SideModalDialog :showForm="invoiceModalDialog" :onclose="handleInvoiceModalClose">
        <InvoiceCreatePage 
            ref="invoiceCreateForm" 
            @saved="handleInvoiceSaved" 
            @saved-error="handleInvoiceSavedError"
            @close-request="closeInvoiceModal" 
            :preselectedOrderIds="selectedIds"
        />
        <div v-if="selectedIds.length > 0" class="p-2 bg-yellow-100 text-xs">
            Debug: Передаем заказы: {{ selectedIds.join(', ') }}
        </div>
    </SideModalDialog>

    <SideModalDialog :showForm="transactionModal" :onclose="() => transactionModal = false">
        <TransactionCreatePage 
            v-if="editingTransaction"
            :editingItem="null"
            :initial-client="editingTransaction.client"
            :initial-project-id="editingTransaction.projectId"
            :order-id="editingTransaction.orderId"
            :default-cash-id="editingTransaction.cashId"
            :prefill-amount="editingTransaction.prefillAmount"
            :is-payment-modal="true"
            @saved="handleTransactionSaved"
            @saved-error="handleTransactionSavedError"
            @close-request="() => transactionModal = false"
        />
    </SideModalDialog>

    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" @close="closeNotification" />
            <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDeleteSelected')} (${selectedIds.length})?`" :confirm-text="$t('deleteSelected')"
                  :leave-text="$t('cancel')" @confirm="confirmDeleteItems" @leave="deleteDialog = false" />
</template>

<script>
import NotificationToast from "@/views/components/app/dialog/NotificationToast.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import Pagination from "@/views/components/app/buttons/Pagination.vue";
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import OrderController from "@/api/OrderController";
import OrderCreatePage from "@/views/pages/orders/OrderCreatePage.vue";
import InvoiceCreatePage from "@/views/pages/invoices/InvoiceCreatePage.vue";
import TransactionCreatePage from "@/views/pages/transactions/TransactionCreatePage.vue";
import ClientButtonCell from "@/views/components/app/buttons/ClientButtonCell.vue";
import OrderStatusController from "@/api/OrderStatusController";
import { markRaw } from "vue";
import BatchButton from "@/views/components/app/buttons/BatchButton.vue";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import crudEventMixin from "@/mixins/crudEventMixin";
import notificationMixin from "@/mixins/notificationMixin";
import batchActionsMixin from "@/mixins/batchActionsMixin";
import modalMixin from "@/mixins/modalMixin";
import tableTranslationMixin from "@/mixins/tableTranslationMixin";
import AlertDialog from "@/views/components/app/dialog/AlertDialog.vue";
import { defineAsyncComponent } from "vue";
import { eventBus } from "@/eventBus";
import CheckboxFilter from "@/views/components/app/forms/CheckboxFilter.vue";
import OrderPaymentFilter from "@/views/components/app/forms/OrderPaymentFilter.vue";
import StatusSelectCell from "@/views/components/app/buttons/StatusSelectCell.vue";

const TimelinePanel = defineAsyncComponent(() => 
    import("@/views/components/app/dialog/TimelinePanel.vue")
);

export default {
    mixins: [getApiErrorMessage, crudEventMixin, notificationMixin, modalMixin, batchActionsMixin, tableTranslationMixin],
    components: { NotificationToast, SideModalDialog, PrimaryButton, Pagination, DraggableTable, OrderCreatePage, InvoiceCreatePage, TransactionCreatePage, ClientButtonCell, OrderStatusController, BatchButton, AlertDialog, TimelinePanel, CheckboxFilter, OrderPaymentFilter, StatusSelectCell },
    data() {
        return {
            data: null,
            loading: false,
            statuses: [],
            selectedIds: [],
            showBatchStatusSelect: false,
            timelineCollapsed: true,
            editingItem: null,
            invoiceModalDialog: false,
            loadingDelete: false,
            controller: OrderController,
            savedSuccessText: this.$t('orderSaved'),
            savedErrorText: this.$t('errorSavingOrder'),
            deletedSuccessText: this.$t('orderDeleted'),
            deletedErrorText: this.$t('errorDeletingOrder'),
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: "id", label: "№", size: 20 },
                { name: "dateUser", label: 'dateUser' },
                { name: "client", label: 'client', component: markRaw(ClientButtonCell), props: (i) => ({ client: i.client, }), },
                { name: "statusName", label: 'status', component: markRaw(StatusSelectCell), props: (i) => ({ id: i.id, value: i.statusId, statuses: this.statuses, onChange: (newStatusId) => this.handleChangeStatus([i.id], newStatusId), }), },
                { name: "cashName", label: 'cashRegister' },
                { name: "warehouseName", label: 'warehouse' },
                { name: "products", label: 'products', html: true },
                { name: "totalPrice", label: 'orderAmount' },
                { name: "note", label: 'note' },
                { name: "description", label: 'description' },
                { name: "projectName", label: 'project' },
            ],
            dateFilter: 'all_time',
            startDate: null,
            endDate: null,
            statusFilter: [],
            statusOptions: [],
            paidOrdersFilter: false,
            transactionModal: false,
            editingTransaction: null,
        };
    },
    created() {
        this.fetchItems();
        this.fetchStatuses();

        this.$store.commit("SET_SETTINGS_OPEN", false);
        
        eventBus.on('global-search', this.handleSearch);
    },

    beforeUnmount() {
        eventBus.off('global-search', this.handleSearch);
    },

    computed: {
        searchQuery() {
            return this.$store.state.searchQuery;
        }
    },
    methods: {
        itemMapper(i, c) {
            switch (c) {
                case "products":
                    return i.productsHtmlList();
                case "dateUser":
                    return `${i.formatDate()} / ${i.userName}`;
                case "client":
                    if (!i.client) return '<span class="text-gray-500">' + this.$t('notSpecified') + '</span>';
                    const name = i.client.fullName();
                    const phone = i.client.phones?.[0]?.phone;
                    return phone ? `<div>${name} (<span>${phone}</span>)</div>` : name;
                case "statusName":
                    return i.statusName || "-";
                case "cashName":
                    return i.cashName || "-";
                case "warehouseName":
                    return i.warehouseName || "-";
                case "totalPrice":
                    return i.priceInfo
                        ? i.priceInfo()
                        : `${i.totalPrice} ${i.currencySymbol || ""}`;
                case "note":
                    return i.note || "";
                case "description":
                    return i.description || "";
                case "projectName":
                    return i.projectName || "-";

                default:
                    return i[c];
            }
        },
        handleModalClose() {
            const formRef = this.$refs.ordercreatepageForm;
            if (formRef && formRef.handleCloseRequest) {
                formRef.handleCloseRequest();
            } else {
                this.closeModal();
            }
        },

        handleSearch(query) {
            this.$store.dispatch('setSearchQuery', query);
            this.fetchItems(1, false);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) this.loading = true;
            try {
                let currentStatusFilter = [...this.statusFilter];
                if (this.paidOrdersFilter) {
                    if (!currentStatusFilter.includes(4)) {
                        currentStatusFilter.push(4);
                    }
                }
                
                const newData = await OrderController.getItemsPaginated(page, this.searchQuery, this.dateFilter, this.startDate, this.endDate, currentStatusFilter);
                this.data = newData;
            } catch (error) {
                this.showNotification(this.$t('errorGettingOrderList'), error.message, true);
            }
            if (!silent) this.loading = false;
        },

        handleSavedSilent() {
            this.showNotification(this.$t('orderSaved'), "", false);
            this.fetchItems(this.data.currentPage, true);
            if (this.$refs.timelinePanel && !this.timelineCollapsed) {
                this.$refs.timelinePanel.refreshTimeline();
            }
        },


        
        async fetchStatuses() {
            this.statuses = await OrderStatusController.getAllItems();
            this.statusOptions = this.statuses.map(status => ({
                value: status.id,
                label: status.name
            }));
        },

        async handleChangeStatus(ids, statusId) {
            if (!ids.length) return;
            this.loading = true;
            try {
                const result = await OrderController.batchUpdateStatus({ ids, status_id: statusId });
                
                // Проверяем, если это ответ о недостающей оплате
                if (result && result.needs_payment) {
                    this.showPaymentModal(result);
                    this.loading = false;
                    return;
                }
                
                await this.fetchItems(this.data.currentPage, true);
                this.showNotification(this.$t('statusUpdated'), "", false);
                
                if (this.editingItem && ids.includes(this.editingItem.id) && this.$refs.timelinePanel && !this.timelineCollapsed) {
                    this.$refs.timelinePanel.refreshTimeline();
                }
            } catch (e) {
                // Проверяем, если это ошибка 422 с информацией о недостающей оплате
                if (e.response && e.response.status === 422 && e.response.data && e.response.data.needs_payment) {
                    this.showPaymentModal(e.response.data);
                } else {
                    const errors = this.getApiErrorMessage(e);
                    this.showNotification(this.$t('errorChangingStatus'), errors.join("\n"), true);
                }
            }
            this.loading = false;
            this.selectedIds = [];
            this.showBatchStatusSelect = false;
        },

        showPaymentModal(paymentData) {
            // Находим заказ, который нужно оплатить
            const order = this.data.items.find(item => item.id === paymentData.order_id);
            if (order) {
                // Показываем уведомление с информацией о недостающей сумме
                this.showNotification(
                    this.$t('orderNeedsPayment'), 
                    `${this.$t('remainingAmount')}: ${paymentData.remaining_amount} ${order.currencySymbol || ''}`, 
                    true
                );
                
                // Открываем модалку создания транзакции напрямую
                this.editingTransaction = {
                    orderId: order.id,
                    client: order.client,
                    projectId: order.projectId,
                    cashId: order.cashId,
                    prefillAmount: paymentData.remaining_amount
                };
                this.transactionModal = true;
            }
        },

        toggleTimeline() {
            this.timelineCollapsed = !this.timelineCollapsed;
        },

        showModal(item) {
            this.editingItem = item;
            this.modalDialog = true;
            this.timelineCollapsed = true;
        },
        closeModal() {
            this.modalDialog = false;
            this.editingItem = null;
            this.timelineCollapsed = true;
        },
        resetFilters() {
            this.dateFilter = 'all_time';
            this.startDate = '';
            this.endDate = '';
            this.statusFilter = [];
            this.paidOrdersFilter = false;
            this.fetchItems();
        },

        handlePaidOrdersFilterChange(isActive) {
            this.paidOrdersFilter = isActive;
            this.fetchItems();
        },

        createInvoiceFromOrders() {
            if (this.selectedIds.length === 0) {
                this.showNotification(this.$t('error'), this.$t('selectOrdersFirst'), true);
                return;
            }
            
            this.invoiceModalDialog = true;
        },

        getBatchActions() {
            return [
                {
                    label: this.$t('createInvoice'),
                    icon: "fas fa-file-invoice",
                    type: "info",
                    action: this.createInvoiceFromOrders,
                    disabled: false,
                },
                {
                    label: this.$t('delete'),
                    icon: "fas fa-trash",
                    type: "danger",
                    action: this.deleteItems,
                    disabled: this.loadingBatch,
                },
                {
                    label: this.$t('changeStatus'), 
                    icon: "fas fa-edit",
                    type: "light",
                    action: null, 
                    render: true, 
                },
            ];
        },

        handleInvoiceModalClose() {
            this.invoiceModalDialog = false;
        },

        closeInvoiceModal() {
            this.invoiceModalDialog = false;
        },

        handleInvoiceSaved() {
            this.showNotification(this.$t('success'), this.$t('invoiceCreated'), false);
            this.invoiceModalDialog = false;
            this.selectedIds = [];
        },

        handleInvoiceSavedError(error) {
            this.showNotification(this.$t('error'), error, true);
        },

        handleTransactionSaved() {
            this.showNotification(this.$t('success'), this.$t('transactionSaved'), false);
            this.transactionModal = false;
            this.editingTransaction = null;
            // Обновляем список заказов
            this.fetchItems(this.data.currentPage, true);
        },

        handleTransactionSavedError(error) {
            this.showNotification(this.$t('error'), error, true);
        }
    }
};
</script>
<template>
    <div class="flex justify-between items-center mb-2">
        <div class="flex items-center space-x-3">
            <PrimaryButton 
                :onclick="() => showModal(null)" 
                icon="fas fa-plus"
                :disabled="!$store.getters.hasPermission('orders_create')">
            </PrimaryButton>

            <!-- Переключатель вида -->
            <div class="flex items-center border border-gray-300 rounded overflow-hidden">
                <button 
                    @click="viewMode = 'table'"
                    class="px-3 py-2 transition-colors"
                    :class="viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'">
                    <i class="fas fa-table"></i>
                </button>
                <button 
                    @click="viewMode = 'kanban'"
                    class="px-3 py-2 transition-colors"
                    :class="viewMode === 'kanban' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'">
                    <i class="fas fa-columns"></i>
                </button>
            </div>
            
            <div>
                <select v-model="dateFilter" @change="() => fetchItems(1)" class="p-2 border border-gray-300 rounded bg-white">
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

            <div>
                <select v-model="statusFilter" @change="() => fetchItems(1)" class="p-2 border border-gray-300 rounded bg-white">
                    <option value="">{{ $t('allStatuses') }}</option>
                    <option v-for="status in statuses" :key="status.id" :value="status.id">
                        {{ status.name }}
                    </option>
                </select>
            </div>

            <div>
                <select v-model="projectFilter" @change="() => fetchItems(1)" class="p-2 border border-gray-300 rounded bg-white">
                    <option value="">{{ $t('allProjects') }}</option>
                    <option v-for="project in projects" :key="project.id" :value="project.id">
                        {{ project.name }}
                    </option>
                </select>
            </div>

            <div>
                <select v-model="clientFilter" @change="() => fetchItems(1)" class="p-2 border border-gray-300 rounded bg-white">
                    <option value="">{{ $t('allClients') }}</option>
                    <option v-for="client in clients" :key="client.id" :value="client.id">
                        {{ client.fullName() }}
                    </option>
                </select>
            </div>

            <div v-if="hasActiveFilters">
                <PrimaryButton 
                    :onclick="resetFilters"
                    icon="fas fa-filter-circle-xmark"
                    :isLight="true">
                </PrimaryButton>
            </div>
            
            <div v-if="dateFilter === 'custom'" class="flex space-x-2 items-center">
                <input type="date" v-model="startDate" @change="() => fetchItems(1)" class="p-2 border border-gray-300 rounded" />
                <input type="date" v-model="endDate" @change="() => fetchItems(1)" class="p-2 border border-gray-300 rounded" />
            </div>
        </div>
        
        <div class="flex items-center space-x-3">
            <div>
                <OrderPaymentFilter 
                    v-model="paidOrdersFilter"
                    :orders="data ? data.items : []"
                    :statusId="4"
                    :currencySymbol="currencySymbol"
                    @change="handlePaidOrdersFilterChange"
                />
            </div>
            <Pagination v-if="data && viewMode === 'table'" :currentPage="data.currentPage" :lastPage="data.lastPage" 
                :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
                @changePage="fetchItems" @perPageChange="handlePerPageChange" />
        </div>
    </div>
    
    <BatchButton v-if="selectedIds.length && viewMode === 'table'" :selected-ids="selectedIds" :batch-actions="getBatchActions()"
        :show-batch-status-select="showBatchStatusSelect" :statuses="statuses"
        :handle-change-status="handleChangeStatus" :show-status-select="true" />
    
    <transition name="fade" mode="out-in">
        <!-- Табличный вид -->
        <div v-if="data && !loading && viewMode === 'table'" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="admin.orders" :columns-config="translatedColumnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" :onItemClick="(i) => showModal(i)" @selectionChange="selectedIds = $event" />
        </div>

        <!-- Канбан вид -->
        <div v-else-if="data && !loading && viewMode === 'kanban'" key="kanban-view" class="kanban-view-container">
            <KanbanBoard
                :orders="data.items"
                :statuses="statuses"
                :projects="projects"
                :selected-ids="selectedIds"
                :loading="loading"
                :currency-symbol="currencySymbol"
                :batch-status-id="batchStatusId"
                @order-moved="handleOrderMoved"
                @card-dblclick="showModal"
                @card-select-toggle="toggleSelectRow"
                @column-select-toggle="handleColumnSelectToggle"
                @batch-status-change="handleBatchStatusChangeFromToolbar"
                @batch-delete="() => deleteItems(selectedIds)"
                @clear-selection="() => selectedIds = []"
            />
        </div>

        <!-- Загрузка -->
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i>
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose" :timelineCollapsed="timelineCollapsed" 
        :showTimelineButton="!!editingItem" @toggle-timeline="toggleTimeline">
        <OrderCreatePage v-if="modalDialog" ref="ordercreatepageForm" @saved="handleSaved" @saved-silent="handleSavedSilent" @saved-error="handleSavedError"
            @deleted="handleDeleted" @deleted-error="handleDeletedError" @close-request="closeModal" :editingItem="editingItem" />

        <template #timeline>
            <TimelinePanel v-if="editingItem && !timelineCollapsed" ref="timelinePanel" :type="'order'" :id="editingItem.id" @toggle-timeline="toggleTimeline" />
        </template>
    </SideModalDialog>

    <SideModalDialog :showForm="invoiceModalDialog" :onclose="handleInvoiceModalClose">
        <InvoiceCreatePage 
            v-if="invoiceModalDialog"
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
            :min-amount="editingTransaction.minAmount"
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
import KanbanBoard from "@/views/components/app/kanban/KanbanBoard.vue";
import OrderController from "@/api/OrderController";
import OrderCreatePage from "@/views/pages/orders/OrderCreatePage.vue";
import InvoiceCreatePage from "@/views/pages/invoices/InvoiceCreatePage.vue";
import TransactionCreatePage from "@/views/pages/transactions/TransactionCreatePage.vue";
import ClientButtonCell from "@/views/components/app/buttons/ClientButtonCell.vue";
import OrderStatusController from "@/api/OrderStatusController";
import ProjectController from "@/api/ProjectController";
import ClientController from "@/api/ClientController";
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
import OrderPaymentFilter from "@/views/components/app/forms/OrderPaymentFilter.vue";
import StatusSelectCell from "@/views/components/app/buttons/StatusSelectCell.vue";
import debounce from "lodash.debounce";
import companyChangeMixin from "@/mixins/companyChangeMixin";

const TimelinePanel = defineAsyncComponent(() => 
    import("@/views/components/app/dialog/TimelinePanel.vue")
);

export default {
    mixins: [getApiErrorMessage, crudEventMixin, notificationMixin, modalMixin, batchActionsMixin, tableTranslationMixin, companyChangeMixin],
    components: { NotificationToast, SideModalDialog, PrimaryButton, Pagination, DraggableTable, KanbanBoard, OrderCreatePage, InvoiceCreatePage, TransactionCreatePage, ClientButtonCell, OrderStatusController, BatchButton, AlertDialog, TimelinePanel, OrderPaymentFilter, StatusSelectCell },
    data() {
        return {
            // data, loading, perPage, perPageOptions - из crudEventMixin
            // selectedIds - из batchActionsMixin
            viewMode: 'table', // 'table' или 'kanban'
            statuses: [],
            projects: [],
            clients: [],
            showBatchStatusSelect: false,
            timelineCollapsed: true,
            editingItem: null,
            invoiceModalDialog: false,
            loadingDelete: false,
            controller: OrderController,
            cacheInvalidationType: 'orders',
            savedSuccessText: this.$t('orderSaved'),
            savedErrorText: this.$t('errorSavingOrder'),
            deletedSuccessText: this.$t('orderDeleted'),
            deletedErrorText: this.$t('errorDeletingOrder'),
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: "id", label: "№", size: 20 },
                { name: "statusName", label: 'status', component: markRaw(StatusSelectCell), props: (i) => ({ id: i.id, value: i.statusId, statuses: this.statuses, onChange: (newStatusId) => this.handleChangeStatus([i.id], newStatusId) }), },
                { name: "cashName", label: 'cashRegister' },
                { name: "warehouseName", label: 'warehouse' },
                { name: "dateUser", label: 'dateUser' },
                { name: "client", label: 'client', component: markRaw(ClientButtonCell), props: (i) => ({ client: i.client, searchQuery: this.searchQuery }), },
                { name: "projectName", label: 'project' },
                { name: "products", label: 'products', html: true },
                { name: "note", label: 'note', html: true },
                { name: "description", label: 'description' },
                { name: "totalPrice", label: 'orderAmount' },
            ],
            dateFilter: 'all_time',
            startDate: null,
            endDate: null,
            statusFilter: '',
            projectFilter: '',
            clientFilter: '',
            paidOrdersFilter: false,
            transactionModal: false,
            editingTransaction: null,
            savedCurrencySymbol: '',
            pendingStatusUpdates: new Map(), // Для debounce обновлений статусов
            batchStatusId: '', // Для массового изменения статуса в канбане
        };
    },
    created() {
        this.fetchItems();
        this.fetchStatuses();
        
        // Projects и Clients уже загружаются глобально в App.vue через loadCompanyData
        // Просто берем их из store
        this.projects = this.$store.getters.projects || [];
        this.clients = this.$store.getters.clients || [];

        this.$store.commit("SET_SETTINGS_OPEN", false);
        
        eventBus.on('global-search', this.handleSearch);
    },

    beforeUnmount() {
        eventBus.off('global-search', this.handleSearch);
    },

    computed: {
        searchQuery() {
            return this.$store.state.searchQuery;
        },
        currencySymbol() {
            // Получаем символ валюты из первого заказа (если есть)
            if (this.data && this.data.items && this.data.items.length > 0) {
                return this.data.items[0].currencySymbol || '';
            }
            // Если нет заказов в текущем результате, используем сохраненный символ
            return this.savedCurrencySymbol || '';
        },
        hasActiveFilters() {
            return this.dateFilter !== 'all_time' ||
                   this.startDate !== null ||
                   this.endDate !== null ||
                   this.statusFilter !== '' ||
                   this.projectFilter !== '' ||
                   this.clientFilter !== '' ||
                   this.paidOrdersFilter !== false;
        }
    },
    watch: {
        // Обновляем clients и projects когда они загружаются в store
        '$store.state.clients'(newClients) {
            if (newClients && newClients.length > 0) {
                this.clients = newClients;
            }
        },
        '$store.state.projects'(newProjects) {
            if (newProjects && newProjects.length > 0) {
                this.projects = newProjects;
            }
        },
        viewMode(newMode) {
            // Сохраняем режим просмотра в localStorage
            localStorage.setItem('orders_viewMode', newMode);
            
            // В режиме канбана загружаем все заказы (без пагинации)
            if (newMode === 'kanban') {
                this.perPage = 1000; // Большое число для загрузки всех заказов
                this.fetchItems(1, false);
            } else {
                // Возвращаем обычную пагинацию для таблицы
                const savedPerPage = localStorage.getItem('ordersPerPage');
                this.perPage = savedPerPage ? parseInt(savedPerPage) : 10;
                this.fetchItems(1, false);
            }
        }
    },
    methods: {
        highlightText(text, search) {
            if (!text || !search) return text;
            const searchStr = String(search).trim();
            if (!searchStr) return text;
            
            const textStr = String(text);
            const regex = new RegExp(`(${searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            return textStr.replace(regex, '<mark style="background-color: #ffeb3b; padding: 2px 4px; border-radius: 3px; font-weight: bold;">$1</mark>');
        },
        itemMapper(i, c) {
            const search = this.searchQuery;
            
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
                    if (!i.note) return "";
                    return search ? this.highlightText(i.note, search) : i.note;
                case "description":
                    return i.description || "";
                case "projectName":
                    return i.projectName || "-";

                default:
                    return i[c];
            }
        },

        handleSearch(query) {
            this.$store.dispatch('setSearchQuery', query);
            this.fetchItems(1, false);
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        async handleCompanyChanged(companyId) {
            // ✅ Очищаем фильтры и данные при смене компании
            this.dateFilter = 'all_time';
            this.startDate = null;
            this.endDate = null;
            this.statusFilter = '';
            this.projectFilter = '';
            this.clientFilter = '';
            this.selectedIds = [];
            this.batchStatusId = '';
            this.paidOrdersFilter = false;
            
            // Перезагружаем данные со страницы 1
            await this.fetchItems(1, false);
            
            // Уведомляем пользователя о смене компании
            this.$store.dispatch('showNotification', {
              title: 'Компания изменена',
              isDanger: false
            });
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) this.loading = true;
            try {
                let currentStatusFilter = this.statusFilter;
                if (this.paidOrdersFilter) {
                    currentStatusFilter = '4'; // Статус "Оплачен"
                }
                
                const newData = await OrderController.getItemsPaginated(page, this.searchQuery, this.dateFilter, this.startDate, this.endDate, currentStatusFilter, this.projectFilter, this.clientFilter, this.perPage);
                this.data = newData;
                
                // Сохраняем символ валюты из первого заказа, если он есть
                if (newData && newData.items && newData.items.length > 0 && newData.items[0].currencySymbol) {
                    this.savedCurrencySymbol = newData.items[0].currencySymbol;
                }
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

        // Переопределяем метод из crudEventMixin для обновления timeline
        handleSaved() {
            // Вызываем метод из миксина
            this.$options.mixins.find(m => m.methods?.handleSaved)?.methods.handleSaved.call(this);
            // Добавляем специфическую логику - обновление timeline
            if (this.$refs.timelinePanel && !this.timelineCollapsed) {
                this.$refs.timelinePanel.refreshTimeline();
            }
        },

        
        async fetchStatuses() {
            // Используем данные из store
            await this.$store.dispatch('loadOrderStatuses');
            this.statuses = this.$store.getters.orderStatuses;
        },

        // fetchProjects и fetchClients удалены - данные берутся из store через watch

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
                    prefillAmount: paymentData.remaining_amount,
                    minAmount: paymentData.remaining_amount // Минимальная сумма для оплаты
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
            this.statusFilter = '';
            this.projectFilter = '';
            this.clientFilter = '';
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
        },

        // Обработчик перемещения заказа в канбане
        handleOrderMoved(updateData) {
            try {
                if (updateData.type === 'status') {
                    // Сначала обновляем локально для плавности
                    const order = this.data.items.find(o => o.id === updateData.orderId);
                    if (order) {
                        order.statusId = updateData.statusId;
                        const status = this.statuses.find(s => s.id === updateData.statusId);
                        if (status) {
                            order.statusName = status.name;
                        }
                    }
                    
                    // Сохраняем в очередь для debounce
                    this.pendingStatusUpdates.set(updateData.orderId, updateData.statusId);
                    
                    // Вызываем debounced функцию
                    this.debouncedStatusUpdate();
                    
                } else if (updateData.type === 'project') {
                    // Сначала обновляем локально
                    const order = this.data.items.find(o => o.id === updateData.orderId);
                    if (order) {
                        order.projectId = updateData.projectId;
                        const project = this.projects.find(p => p.id === updateData.projectId);
                        if (project) {
                            order.projectName = project.name;
                        }
                    }
                    
                    // Отправляем на сервер в фоне
                    OrderController.updateItem(updateData.orderId, {
                        project_id: updateData.projectId
                    }).then(() => {
                        this.showNotification(this.$t('success'), this.$t('orderUpdated'), false);
                    }).catch(error => {
                        const errors = this.getApiErrorMessage(error);
                        this.showNotification(this.$t('error'), errors.join("\n"), true);
                        this.fetchItems(this.data.currentPage, true);
                    });
                }
            } catch (error) {
                const errors = this.getApiErrorMessage(error);
                this.showNotification(this.$t('error'), errors.join("\n"), true);
                this.fetchItems(this.data.currentPage, true);
            }
        },

        // Debounced функция для отправки обновлений статусов
        debouncedStatusUpdate: debounce(function() {
            if (this.pendingStatusUpdates.size === 0) return;
            
            // Группируем обновления по статусам
            const updatesByStatus = new Map();
            this.pendingStatusUpdates.forEach((statusId, orderId) => {
                if (!updatesByStatus.has(statusId)) {
                    updatesByStatus.set(statusId, []);
                }
                updatesByStatus.get(statusId).push(orderId);
            });
            
            // Очищаем очередь
            this.pendingStatusUpdates.clear();
            
            // Отправляем батч-запросы для каждого статуса
            const promises = [];
            updatesByStatus.forEach((orderIds, statusId) => {
                const promise = OrderController.batchUpdateStatus({ 
                    ids: orderIds, 
                    status_id: statusId 
                }).then(() => {
                    // Обновляем timeline если открыт один из обновленных заказов
                    if (this.editingItem && orderIds.includes(this.editingItem.id) && this.$refs.timelinePanel && !this.timelineCollapsed) {
                        this.$refs.timelinePanel.refreshTimeline();
                    }
                }).catch(error => {
                    const errors = this.getApiErrorMessage(error);
                    this.showNotification(this.$t('error'), errors.join("\n"), true);
                    this.fetchItems(this.data.currentPage, true);
                });
                promises.push(promise);
            });
            
            // Показываем уведомление после всех обновлений
            Promise.all(promises).then(() => {
                this.showNotification(this.$t('success'), this.$t('statusUpdated'), false);
            });
        }, 500),

        // Переключение выбора строки (для канбана)
        toggleSelectRow(id) {
            if (this.selectedIds.includes(id)) {
                this.selectedIds = this.selectedIds.filter(x => x !== id);
            } else {
                this.selectedIds = [...this.selectedIds, id];
            }
        },

        // Обработка выбора всех карточек в колонке
        handleColumnSelectToggle(orderIds, select) {
            if (select) {
                // Добавляем все ID колонки к выбранным
                const newSelectedIds = [...this.selectedIds];
                orderIds.forEach(id => {
                    if (!newSelectedIds.includes(id)) {
                        newSelectedIds.push(id);
                    }
                });
                this.selectedIds = newSelectedIds;
            } else {
                // Убираем все ID колонки из выбранных
                this.selectedIds = this.selectedIds.filter(id => !orderIds.includes(id));
            }
        },

        // Массовое изменение статуса в канбане
        handleBatchStatusChange() {
            if (!this.batchStatusId || this.selectedIds.length === 0) return;
            
            this.handleChangeStatus(this.selectedIds, this.batchStatusId);
            this.batchStatusId = '';
            this.selectedIds = [];
        },

        // Обработка смены статуса из toolbar канбана
        handleBatchStatusChangeFromToolbar(statusId) {
            if (!statusId || this.selectedIds.length === 0) return;
            
            this.handleChangeStatus(this.selectedIds, statusId);
            this.batchStatusId = '';
            this.selectedIds = [];
        }
    },
    mounted() {
        // Восстанавливаем режим просмотра из localStorage
        const savedViewMode = localStorage.getItem('orders_viewMode');
        if (savedViewMode && ['table', 'kanban'].includes(savedViewMode)) {
            this.viewMode = savedViewMode;
            
            // Если восстанавливаем канбан режим, загружаем больше заказов
            if (savedViewMode === 'kanban') {
                this.perPage = 1000;
            }
        }
    }
};
</script>

<style scoped>
/* Контейнер для канбана - изолируем канбан */
.kanban-view-container {
    width: 100%;
    /* Не добавляем overflow здесь - канбан сам управляет своим скроллом */
}
</style>
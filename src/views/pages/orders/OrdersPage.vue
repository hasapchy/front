<template>
    <div class="flex justify-between items-center mb-2">
        <div class="flex items-center">
            <PrimaryButton :onclick="() => showModal(null)" icon="fas fa-plus">
                Добавить заказ
            </PrimaryButton>
        </div>
        <Pagination v-if="data" :currentPage="data.currentPage" :lastPage="data.lastPage" @changePage="fetchItems" />
    </div>
    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()"
        :show-batch-status-select="showBatchStatusSelect" :statuses="statuses"
        :handle-change-status="handleChangeStatus" :show-status-select="true" />
    <transition name="fade" mode="out-in">
        <div v-if="data && !loading" key="table">
            <DraggableTable table-key="admin.orders" :columns-config="columnsConfig" :table-data="data.items"
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
            <TimelinePanel ref="timelinePanel" v-if="editingItem && !timelineCollapsed" :type="'order'" :id="editingItem.id" @toggle-timeline="toggleTimeline" />
        </template>
    </SideModalDialog>

    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" @close="closeNotification" />
    <AlertDialog :dialog="deleteDialog" :descr="`Удалить выбранные (${selectedIds.length})?`" :confirm-text="'Удалить'"
        :leave-text="'Отмена'" @confirm="confirmDeleteItems" @leave="deleteDialog = false" />
</template>

<script>
import NotificationToast from "@/views/components/app/dialog/NotificationToast.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import Pagination from "@/views/components/app/buttons/Pagination.vue";
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import OrderController from "@/api/OrderController";
import OrderCreatePage from "@/views/pages/orders/OrderCreatePage.vue";
import ClientButtonCell from "@/views/components/app/buttons/ClientButtonCell.vue";
import OrderStatusController from "@/api/OrderStatusController";
import { markRaw } from "vue";
import BatchButton from "@/views/components/app/buttons/BatchButton.vue";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import notificationMixin from "@/mixins/notificationMixin";
import batchActionsMixin from "@/mixins/batchActionsMixin";
import modalMixin from "@/mixins/modalMixin";
import AlertDialog from "@/views/components/app/dialog/AlertDialog.vue";
import TimelinePanel from "@/views/components/app/dialog/TimelinePanel.vue";
import { eventBus } from "@/eventBus";

export default {
    mixins: [getApiErrorMessage, notificationMixin, modalMixin, batchActionsMixin],
    components: { NotificationToast, SideModalDialog, PrimaryButton, Pagination, DraggableTable, OrderCreatePage, ClientButtonCell, BatchButton, AlertDialog, TimelinePanel },
    data() {
        return {
            data: null,
            loading: false,
            statuses: [],
            selectedIds: [],
            showBatchStatusSelect: false,
            timelineCollapsed: true, // По умолчанию таймлайн свернут
            editingItem: null, // Добавлено для SideModalDialog и OrderCreatePage
            loadingDelete: false,
            controller: OrderController,
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: "id", label: "№", size: 20 },
                { name: "dateUser", label: "Дата / Пользователь" },
                { name: "client", label: "Клиент", component: markRaw(ClientButtonCell), props: (i) => ({ client: i.client, }), },
                { name: "statusName", label: "Статус", component: "StatusSelectCell", props: (i) => ({ id: i.id, value: i.statusId, statuses: this.statuses, onChange: (newStatusId) => this.handleChangeStatus([i.id], newStatusId), }), },
                { name: "categoryName", label: "Тип" },
                { name: "cashName", label: "Касса" },
                { name: "warehouseName", label: "Склад" },
                { name: "products", label: "Товары", html: true },
                { name: "totalPrice", label: "Сумма заказа" },
                { name: "note", label: "Примечание" },
                { name: "description", label: "Описание" },
                { name: "projectName", label: "Проект" },
            ],
        };
    },
    created() {
        this.fetchItems();
        this.fetchStatuses();

        this.$store.commit("SET_SETTINGS_OPEN", false);
        
        // Слушаем события поиска через eventBus
        eventBus.on('global-search', this.handleSearch);
    },
    beforeUnmount() {
        // Удаляем слушатель события
        eventBus.off('global-search', this.handleSearch);
    },
    computed: {
        searchQuery() {
            return this.$store.state.searchQuery;
        },
    },
    methods: {
        itemMapper(i, c) {
            switch (c) {
                case "products":
                    return i.productsHtmlList();
                case "dateUser":
                    return `${i.formatDate()} / ${i.userName}`;
                case "client":
                    if (!i.client) return '<span class="text-gray-500">Не указан</span>';
                    const name = i.client.fullName();
                    const phone = i.client.phones?.[0]?.phone;
                    return phone ? `<div>${name} (<span>${phone}</span>)</div>` : name;
                case "statusName":
                    return i.statusName || "-";
                case "categoryName":
                    return i.categoryName || "-";
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
            // Проверяем, есть ли изменения в форме
            const formRef = this.$refs.ordercreatepageForm;
            if (formRef && formRef.handleCloseRequest) {
                formRef.handleCloseRequest();
            } else {
                this.closeModal();
            }
        },

        handleSearch(query) {
            // Обновляем store напрямую
            this.$store.dispatch('setSearchQuery', query);
            this.fetchItems(1, false);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) this.loading = true;
            try {
                const newData = await OrderController.getItemsPaginated(page, this.searchQuery);
                this.data = newData;
            } catch (error) {
                this.showNotification("Ошибка получения списка заказов", error.message, true);
            }
            if (!silent) this.loading = false;
        },

        handleSaved() {
            this.showNotification("Заказ сохранён", "", false);
            this.fetchItems(this.data.currentPage, true);
            // Обновляем таймлайн если он открыт
            if (this.$refs.timelinePanel && !this.timelineCollapsed) {
                this.$refs.timelinePanel.refreshTimeline();
            }
            this.closeModal();
        },

        handleSavedError(err) {
            this.showNotification("Ошибка сохранения заказа", err, true);
        },

        handleDeleted() {
            this.showNotification("Заказ удалён", "", false);
            this.fetchItems(this.data.currentPage, true);
            // Закрываем таймлайн при удалении заказа
            this.timelineCollapsed = true;
            this.closeModal();
        },

        handleDeletedError(err) {
            this.showNotification("Ошибка удаления заказа", err, true);
        },

        handleSavedSilent() {
            this.showNotification("Заказ сохранён", "", false);
            this.fetchItems(this.data.currentPage, true);
            // Обновляем таймлайн если он открыт
            if (this.$refs.timelinePanel && !this.timelineCollapsed) {
                this.$refs.timelinePanel.refreshTimeline();
            }
        },


        
        async fetchStatuses() {
            this.statuses = await OrderStatusController.getAllItems();
        },

        async handleChangeStatus(ids, statusId) {
            if (!ids.length) return;
            this.loading = true;
            try {
                await OrderController.batchUpdateStatus({ ids, status_id: statusId });
                await this.fetchItems(this.data.currentPage, true);
                this.showNotification("Статус обновлён", "", false);
                
                // Обновляем таймлайн если редактируемый заказ был изменен
                if (this.editingItem && ids.includes(this.editingItem.id) && this.$refs.timelinePanel && !this.timelineCollapsed) {
                    this.$refs.timelinePanel.refreshTimeline();
                }
            } catch (e) {
                const errors = this.getApiErrorMessage(e);
                this.showNotification("Ошибка смены статуса", errors.join("\n"), true);
            }
            this.loading = false;
            this.selectedIds = [];
            this.showBatchStatusSelect = false;
        },

        toggleTimeline() {
            // Переключаем состояние таймлайна
            this.timelineCollapsed = !this.timelineCollapsed;
        },

        showModal(item) {
            this.editingItem = item;
            this.modalDialog = true;
            // Сбрасываем состояние таймлайна при открытии нового заказа
            this.timelineCollapsed = true;
        },
        closeModal() {
            this.modalDialog = false;
            this.editingItem = null;
            // Закрываем таймлайн при закрытии модального окна
            this.timelineCollapsed = true;
        },
    },
};
</script>
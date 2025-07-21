<template>
    <div class="flex justify-between items-center mb-2">
        <div class="flex justify-start items-center">
            <PrimaryButton :onclick="() => { showModal(null) }" icon="fas fa-plus">Оприходовать</PrimaryButton>
        </div>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            @changePage="fetchItems" />
    </div>
    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" key="table">
            <DraggableTable table-key="admin.warehouse_receipts" :columns-config="columnsConfig"
                :table-data="data.items" :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="(i) => { showModal(i) }" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i><br>
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="closeModal">
        <WarehousesReceiptCreatePage @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
            @deleted-error="handleDeletedError" :editingItem="editingItem" />
    </SideModalDialog>
    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" @close="closeNotification" />
    <AlertDialog :dialog="deleteDialog" :descr="`Удалить выбранные (${selectedIds.length})?`" :confirm-text="'Удалить'"
        :leave-text="'Отмена'" @confirm="confirmDeleteItems" @leave="deleteDialog = false" />
</template>

<script>
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import WarehouseReceiptController from '@/api/WarehouseReceiptController';
import WarehousesReceiptCreatePage from '@/views/pages/warehouses/WarehousesReceiptCreatePage.vue';
import ClientButtonCell from '@/views/components/app/buttons/ClientButtonCell.vue';
import { markRaw } from 'vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';

export default {
    mixins: [modalMixin, notificationMixin, batchActionsMixin, getApiErrorMessageMixin],
    components: {
        NotificationToast,
        PrimaryButton,
        SideModalDialog,
        Pagination,
        DraggableTable,
        WarehousesReceiptCreatePage,
        ClientButtonCell,
        BatchButton,
        AlertDialog
    },
    data() {
        return {
            data: null,
            loading: false,
            selectedIds: [],
            controller: WarehouseReceiptController,
            //editingItem: null,
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: '№', size: 60 },
                { name: 'dateUser', label: 'Дата / пользователь' },
                { name: 'client', label: 'Поставщик', component: markRaw(ClientButtonCell), props: (item) => ({ client: item.client, }) },
                { name: 'warehouseName', label: 'Склад' },
                { name: 'cashName', label: 'Касса' },
                { name: 'products', label: 'Товары', html: true },
                { name: 'amount', label: 'Общая стоимость' },
                { name: 'note', label: 'Примечание' },
            ],
        }
    },
    created() {
        this.fetchItems();
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },
    methods: {
        itemMapper(i, c) {
            if (c === 'cashName') {
                return i.cashNameDisplay();
            }
            switch (c) {
                case 'products':
                    return i.productsHtmlList();
                case 'dateUser':
                    return `${i.formatDate()} / ${i.userName}`;
                case 'client':
                    return i.client?.fullName() || 'Не указан';
                case 'amount':
                    return i.priceInfo();
                default:
                    return i[c];
            }
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const new_data = await WarehouseReceiptController.getStocks(page);
                this.data = new_data;
            } catch (error) {
                this.showNotification('Ошибка получения списка оприходований', error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        handleSaved() {
            this.showNotification('Товары оприходованы', '', false);
            this.fetchItems(this.data?.currentPage || 1, true);
            this.closeModal();
        },
        handleSavedError(m) {
            this.showNotification('Ошибка сохранения записи', m, true);
        },
        handleDeleted() {
            this.showNotification('Запись успешно удалена', '', false);
            this.fetchItems(this.data?.currentPage || 1, true);
            this.closeModal();
        },
        handleDeletedError(m) {
            this.showNotification('Ошибка удаления записи', m, true);
        }
    },
    computed: {
    },
}
</script>
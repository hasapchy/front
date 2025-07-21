<template>
    <div class="flex justify-between items-center mb-4">
        <PrimaryButton :onclick="() => { showModal(null) }" icon="fas fa-plus">Добавить статус</PrimaryButton>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            @changePage="fetchItems" />
    </div>
    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" key="table">
            <DraggableTable table-key="admin.order_statuses" :columns-config="columnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="(i) => { showModal(i) }" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i>
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="closeModal">
        <OrderStatusCreatePage @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
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
import OrderStatusController from '@/api/OrderStatusController';
import OrderStatusCreatePage from './OrderStatusCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';

export default {
    mixins: [modalMixin, notificationMixin],
    components: {
        NotificationToast, PrimaryButton, SideModalDialog, OrderStatusCreatePage, Pagination, DraggableTable, AlertDialog
    },
    data() {
        return {
            data: null,
            loading: false,
            selectedIds: [],
            controller: OrderStatusController,
            //editingItem: null,
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: '№', size: 60 },
                { name: 'name', label: 'Название' },
                { name: 'categoryName', label: 'Категория' },
                { name: 'createdAt', label: 'Дата создания' }
            ],
        }
    },
    created() {
        this.fetchItems();
    },
    methods: {
        itemMapper(i, c) {
            switch (c) {
                case 'createdAt':
                    return i.formatCreatedAt ? i.formatCreatedAt() : i.createdAt;
                default:
                    return i[c];
            }
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) this.loading = true;
            try {
                this.data = await OrderStatusController.getItems(page);
            } catch (error) {
                this.showNotification('Ошибка получения списка статусов', error.message, true);
            }
            if (!silent) this.loading = false;
        },
        showNotification(title, subtitle, isDanger = false) {
            this.notificationTitle = title;
            this.notificationSubtitle = subtitle;
            this.notificationIsDanger = isDanger;
            this.notification = true;
            setTimeout(() => { this.notification = false; }, 10000);
        },
        handleSaved() {
            this.showNotification('Статус успешно добавлен', '', false);
            this.fetchItems(this.data?.currentPage || 1, true);
            this.closeModal();
        },
        handleSavedError(m) {
            this.showNotification('Ошибка сохранения статуса', m, true);
        },
        handleDeleted() {
            this.showNotification('Статус успешно удален', '', false);
            this.fetchItems(this.data?.currentPage || 1, true);
            this.closeModal();
        },
        handleDeletedError(m) {
            this.showNotification('Ошибка удаления статуса', m, true);
        }
    }
}
</script>

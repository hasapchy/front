<template>
    <!-- Добавить + пагинация -->
    <div class="flex justify-between items-center mb-2">
        <div class="flex items-center">
            <PrimaryButton :onclick="() => showModal(null)" icon="fas fa-plus">
                Добавить заказ
            </PrimaryButton>
        </div>
        <Pagination v-if="data" :currentPage="data.currentPage" :lastPage="data.lastPage" @changePage="fetchItems" />
    </div>

    <!-- Таблица -->
    <transition name="fade" mode="out-in">
        <div v-if="data && !loading" key="table">
            <DraggableTable table-key="admin.orders" :columns-config="columnsConfig" :table-data="data.items"
                :filter-query="searchQuery" :item-mapper="itemMapper" :onItemClick="i => showModal(i)" :all-statuses="allStatuses"
                @delete-rows="handleDeleteRows" @change-status="handleChangeStatus" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i>
        </div>
    </transition>

    <!-- Модальное окно создания/редактирования -->
    <SideModalDialog :showForm="modalDialog" :onclose="closeModal">
        <OrderCreatePage @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
            @deleted-error="handleDeletedError" :editingItem="editingItem" />
    </SideModalDialog>

    <!-- Уведомления -->
    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" />
</template>

<script>
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import OrderController from '@/api/OrderController';
import OrderCreatePage from '@/views/pages/orders/OrderCreatePage.vue';
import AppController from '@/api/AppController';


export default {
    components: {
        NotificationToast,
        SideModalDialog,
        PrimaryButton,
        Pagination,
        DraggableTable,
        OrderCreatePage
    },
    data() {
        return {
            data: null,
            loading: false,
            allStatuses: [],
            notification: false,
            notificationTitle: '',
            notificationSubtitle: '',
            notificationIsDanger: false,

            modalDialog: false,
            editingItem: null,

            columnsConfig: [
                { name: 'id', label: '#' },
                { name: 'date', label: 'Дата / Пользователь' },
                { name: 'client', label: 'Клиент', html: true },
                { name: 'statusName', label: 'Статус' },
                { name: 'categoryName', label: 'Категория' },
                { name: 'cashName', label: 'Касса' },
                { name: 'warehouseName', label: 'Склад' },
                { name: 'products', label: 'Товары', html: true },
                { name: 'totalPrice', label: 'Сумма заказа' },
                { name: 'note', label: 'Примечание' },
                { name: 'description', label: 'Описание' },
                { name: 'projectName', label: 'Проект' },
            ]
        };
    },
    created() {
        this.fetchItems();
        this.fetchStatuses();
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },
    computed: {
        searchQuery() {
            return this.$store.state.searchQuery;
        }
    },
    methods: {
        itemMapper(item, col) {
            switch (col) {
                case 'products':
                    return item.productsHtmlList();
                case 'date':
                    return `${item.formatDate()} / ${item.userName}`;
                case 'client':
                    if (!item.client) return '<span class="text-gray-500">Не указан</span>';
                    const name = item.client.fullName();
                    const phone = item.client.phones?.[0]?.phone;
                    return phone
                        ? `<div>${name} (<span>${phone}</span>)</div>`
                        : name;
                case 'statusName':
                    return item.statusName || '-';
                case 'categoryName':
                    return item.categoryName || '-';
                case 'cashName':
                    return item.cashName || '-';
                case 'warehouseName':
                    return item.warehouseName || '-';
                case 'totalPrice':
                    return item.priceInfo
                        ? item.priceInfo()
                        : `${item.totalPrice} ${item.currencySymbol || ''}`;
                case 'note':
                    return item.note || '';
                case 'description':
                    return item.description || '';
                case 'discountInfo':
                    if (item.discount && item.discount > 0) {
                        return `${item.totalPrice} ${item.currencySymbol} (скидка: ${item.discount} ${item.currencySymbol})`;
                    }
                    return '-';
                case 'projectName':
                    return item.projectName || '-';

                default:
                    return item[col];
            }
        },

        async fetchItems(page = 1, silent = false) {
            if (!silent) this.loading = true;
            try {
                const newData = await OrderController.getItemsPaginated(page);
                this.data = newData;
            } catch (error) {
                this.showNotification('Ошибка получения списка заказов', error.message, true);
            }
            if (!silent) this.loading = false;
        },

        async handleDeleteRows(selectedRows) {
            if (!selectedRows.length) return;
            this.loading = true;
            try {
                for (const row of selectedRows) {
                    if (row.id) {
                        await OrderController.deleteItem(row.id);
                    }
                }
                await this.fetchItems(this.data.currentPage, true);
                this.showNotification('Выбранные заказы удалены', '', false);
            } catch (error) {
                this.showNotification('Ошибка при удалении заказов', error.message, true);
            }
            this.loading = false;
        },

        showModal(item = null) {
            this.modalDialog = true;
            this.editingItem = item;
        },

        closeModal() {
            this.modalDialog = false;
        },

        handleSaved() {
            this.showNotification('Заказ сохранён', '', false);
            this.fetchItems(this.data.currentPage, true);
            this.closeModal();
        },

        handleSavedError(err) {
            this.showNotification('Ошибка сохранения заказа', err.message, true);
        },

        handleDeleted() {
            this.showNotification('Заказ удалён', '', false);
            this.fetchItems(this.data.currentPage, true);
            this.closeModal();
        },

        handleDeletedError(err) {
            this.showNotification('Ошибка удаления заказа', err.message, true);
        },

        showNotification(title, subtitle = '', isDanger = false) {
            this.notificationTitle = title;
            this.notificationSubtitle = subtitle;
            this.notificationIsDanger = isDanger;
            this.notification = true;
            setTimeout(() => {
                this.notification = false;
            }, 3000);
        },
        async fetchStatuses() {
            this.allStatuses = await AppController.getOrderStatuses();
        },

        async handleChangeStatus(ids, statusId) {
            if (!ids.length) return;
            this.loading = true;
            try {
                await OrderController.batchUpdateStatus({ ids, status_id: statusId });
                await this.fetchItems(this.data.currentPage, true);
                this.showNotification('Статус обновлён', '', false);
            } catch (e) {
                this.showNotification('Ошибка смены статуса', e.message, true);
            }
            this.loading = false;
        },
    }
};
</script>

<style>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s;
}

.fade-enter,
.fade-leave-to {
    opacity: 0;
}
</style>

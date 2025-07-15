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
                :item-mapper="itemMapper" :onItemClick="i => showModal(i)" />
            <!--@delete-rows="handleDeleteRows" @change-status="handleChangeStatus" :all-statuses="allStatuses"  :filter-query="searchQuery"-->
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
import ClientButtonCell from '@/views/components/app/buttons/ClientButtonCell.vue';
import OrderStatusController from '@/api/OrderStatusController';
import { markRaw } from 'vue';

export default {
    components: {
        NotificationToast,
        SideModalDialog,
        PrimaryButton,
        Pagination,
        DraggableTable,
        OrderCreatePage,
        ClientButtonCell
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
                { name: 'dateUser', label: 'Дата / Пользователь' },
                {
                    name: 'client',
                    label: 'Клиент',
                    component: markRaw(ClientButtonCell),
                    props: (i) => ({
                        client: i.client,

                    })
                },
                {
                    name: 'statusName',
                    label: 'Статус',
                    component: 'StatusSelectCell',
                    props: (i) => ({
                        id: i.id,
                        value: i.statusId,
                        allStatuses: this.allStatuses,
                        onChange: (newStatusId) => this.handleChangeStatus([i.id], newStatusId),
                    })
                },
                { name: 'categoryName', label: 'Тип' },
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
        itemMapper(i, c) {
            switch (c) {
                case 'products':
                    return i.productsHtmlList();
                case 'dateUser':
                    return `${i.formatDate()} / ${i.userName}`;
                case 'client':
                    if (!i.client) return '<span class="text-gray-500">Не указан</span>';
                    const name = i.client.fullName();
                    const phone = i.client.phones?.[0]?.phone;
                    return phone
                        ? `<div>${name} (<span>${phone}</span>)</div>`
                        : name;
                case 'statusName':
                    return i.statusName || '-';
                case 'categoryName':
                    return i.categoryName || '-';
                case 'cashName':
                    return i.cashName || '-';
                case 'warehouseName':
                    return i.warehouseName || '-';
                case 'totalPrice':
                    return i.priceInfo
                        ? i.priceInfo()
                        : `${i.totalPrice} ${i.currencySymbol || ''}`;
                case 'note':
                    return i.note || '';
                case 'description':
                    return i.description || '';
                case 'projectName':
                    return i.projectName || '-';

                default:
                    return i[c];
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

        // async handleDeleteRows(selectedRows) {
        //     if (!selectedRows.length) return;
        //     this.loading = true;
        //     try {
        //         for (const row of selectedRows) {
        //             if (row.id) {
        //                 await OrderController.deleteItem(row.id);
        //             }
        //         }
        //         await this.fetchItems(this.data.currentPage, true);
        //         this.showNotification('Выбранные заказы удалены', '', false);
        //     } catch (error) {
        //         this.showNotification('Ошибка при удалении заказов', error.message, true);
        //     }
        //     this.loading = false;
        // },

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
            }, 10000);
        },
        async fetchStatuses() {
            this.allStatuses = await OrderStatusController.getAllItems();
        },

        async handleChangeStatus(ids, statusId) {
            if (!ids.length) return;
            this.loading = true;
            try {
                await OrderController.batchUpdateStatus({ ids, status_id: statusId });
                await this.fetchItems(this.data.currentPage, true);
                this.showNotification('Статус обновлён', '', false);
            } catch (e) {
                const errors = this.getApiErrorMessage(e);
                this.showNotification('Ошибка смены статуса', errors.join('\n'), true);
            }
            this.loading = false;
        },

        getApiErrorMessage(e) {
            if (e?.response && e.response.data) {
                if (e.response.data.errors) {
                    return Object.values(e.response.data.errors).flat();
                }
                if (e.response.data.message) {
                    return [e.response.data.message];
                }
            }
            if (e?.message) return [e.message];
            return ["Ошибка"];
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

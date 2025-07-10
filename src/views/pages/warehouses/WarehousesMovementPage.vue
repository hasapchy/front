<template>
    <!-- Добавить + пагинация -->
    <div class="flex justify-between items-center mb-2">
        <div class="flex justify-start items-center">
            <PrimaryButton :onclick="() => { showModal(null) }" icon="fas fa-plus">Переместить</PrimaryButton>
            <!-- <div class="mr-2">
                <select v-model="warehouseId" @change="fetchItems">'
                    <option value="">Все склады</option>
                    <option v-if="allWarehouses.length" v-for="parent in allWarehouses" :value="parent.id">
                        {{ parent.name }}
                    </option>
                </select>
            </div>
            <div class="mr-2">
                <select v-model="categoryId" @change="fetchItems">'
                    <option value="">Все категории</option>
                    <option v-if="allCategories.length" v-for="parent in allCategories" :value="parent.id">
                        {{ parent.name }}
                    </option>
                </select>
            </div> -->
        </div>
        <!-- <PrimaryButton :onclick="() => { showModal(null) }" icon="fas fa-plus">Добавить товар</PrimaryButton> -->
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            @changePage="fetchItems" />
    </div>
    <!-- Таблица с заглушкой -->
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" key="table">
            <DraggableTable table-key="admin.warehouse_movements" :columns-config="columnsConfig"
                :table-data="data.items" :item-mapper="itemMapper" :onItemClick="(i) => { showModal(i) }" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i><br>
        </div>
    </transition>
    <!-- Модальное окно форма создания/редактирования -->
    <SideModalDialog :showForm="modalDialog" :onclose="closeModal">
        <WarehousesMovementCreatePage @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
            @deleted-error="handleDeletedError" :editingItem="editingItem" /> <!--@delete-rows="handleDeleteRows" -->
    </SideModalDialog>
    <!-- Компонент уведомлений -->
    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" />
</template>

<script>
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import WarehouseMovementController from '@/api/WarehouseMovementController';
import WarehousesMovementCreatePage from '@/views/pages/warehouses/WarehousesMovementCreatePage.vue';

export default {
    components: {
        NotificationToast,
        PrimaryButton,
        SideModalDialog,
        Pagination,
        DraggableTable,
        WarehousesMovementCreatePage
    },
    data() {
        return {
            data: null,
            loading: false,
            notification: false,
            notificationTitle: '',
            notificationSubtitle: '',
            notificationIsDanger: false,
            modalDialog: false,
            editingItem: null,
            // table config
            columnsConfig: [
                { name: 'id', label: '#' },
                { name: 'dateUser', label: 'Дата / Пользователь' },
                { name: 'direction', label: 'Направление', html: true },
                { name: 'products', label: 'Товары', html: true },
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
            switch (c) {
                case 'direction':
                    return i.direction();
                case 'products':
                    return i.productsHtmlList();
                case 'dateUser':
                    return `${i.formatDate()} / ${i.userName}`;
                default:
                    return i[c];
            }
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const new_data = await WarehouseMovementController.getItems(page);
                this.data = new_data;
            } catch (error) {
                this.showNotification('Ошибка получения списка перемещений', error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        // async handleDeleteRows(selectedRows) {
        //     if (!selectedRows.length) return;

        //     this.loading = true;
        //     try {
        //         for (const row of selectedRows) {
        //             if (row.id) {
        //                 await SaleController.deleteItem(row.id);
        //             }
        //         }
        //         await this.fetchItems(this.data?.currentPage || 1, true);
        //         this.showNotification('Выбранные продажи успешно удалены', '', false);
        //     } catch (error) {
        //         this.showNotification('Ошибка при удалении продаж', error.message, true);
        //     }
        //     this.loading = false;
        // },
        showNotification(title, subtitle, isDanger = false) {
            this.notificationTitle = title;
            this.notificationSubtitle = subtitle;
            this.notificationIsDanger = isDanger;
            this.notification = true;
            setTimeout(() => {
                this.notification = false;
            }, 10000);
        },
        showModal(item = null) {
            this.modalDialog = true;
            this.editingItem = item;
        },
        closeModal() {
            this.modalDialog = false;
        },
        handleSaved() {
            this.showNotification('Товары перемещены', '', false);
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

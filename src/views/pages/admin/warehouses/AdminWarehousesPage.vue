<template>
    <!-- Добавить + пагинация -->
    <div class="flex justify-between items-center mb-4">
        <PrimaryButton :onclick="() => { showModal(null) }" icon="fas fa-plus">Добавить склад</PrimaryButton>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            @changePage="fetchItems" />
    </div>
    <!-- Таблица с заглушкой -->
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" key="table">
            <DraggableTable table-key="admin.warehouses" :columns-config="columnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" :onItemClick="(i) => { showModal(i) }" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i><br>
        </div>
    </transition>
    <!-- Модальное окно форма создания/редактирования -->
    <SideModalDialog :showForm="modalDialog" :onclose="closeModal">
        <AdminWarehouseCreatePage @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
            @deleted-error="handleDeletedError" :warehouse="editingItem" />
    </SideModalDialog>
    <!-- Компонент уведомлений -->
    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" />
</template>
<script>
import WarehouseController from '@/api/WarehouseController';
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import AdminWarehouseCreatePage from '@/views/pages/admin/warehouses/AdminWarehouseCreatePage.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';

export default {
    components: {
        NotificationToast,
        PrimaryButton,
        SideModalDialog,
        AdminWarehouseCreatePage,
        Pagination,
        DraggableTable
    },
    data() {
        return {
            data: null,
            //
            loading: false,
            notification: false,
            notificationTitle: '',
            notificationSubtitle: '',
            notificationIsDanger: false,
            //
            modalDialog: false,
            editingItem: null,
            // table config
            columnsConfig: [
                { name: 'name', label: 'Название' },
                { name: 'users', label: 'Доступ' },
                { name: 'createdAt', label: 'Дата создания' }
            ],
        }
    },
    created() {
        this.fetchItems();
        this.$store.commit('SET_SETTINGS_OPEN', true);
    },
    methods: {
        // table mapper
        itemMapper(i, c) {
            switch (c) {
                case 'users':
                    return (i.users || '').length + ' пользователей(-ль)';
                case 'createdAt':
                    return i.formatCreatedAt();
                default:
                    return i[c];
            }
        },
        //
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const new_data = await WarehouseController.getWarehouses(page);
                this.data = new_data;
            } catch (error) {
                this.showNotification('Ошибка получения списка складов', error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
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
            this.showNotification('Склад успешно добавлен', '', false);
            this.fetchItems(this.data?.currentPage || 1, true);
            this.closeModal();
        },
        handleSavedError(m) {
            this.showNotification('Ошибка сохранения склада', m, true);
        },
        handleDeleted() {
            this.showNotification('Склад успешно удален', '', false);
            this.fetchItems(this.data?.currentPage || 1, true);
            this.closeModal();
        },
        handleDeletedError(m) {
            this.showNotification('Ошибка удаления склада', m, true);
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
.fade-leave-to

/* .fade-leave-active in <2.1.8 */
    {
    opacity: 0;
}
</style>
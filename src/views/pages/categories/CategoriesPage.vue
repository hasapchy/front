<template>
    <div class="flex justify-between items-center mb-4">
        <PrimaryButton :onclick="() => { showModal(null) }" :disabled="!$store.getters.hasPermission('sales_create')"
            icon="fas fa-plus">Добавить категорию</PrimaryButton>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            @changePage="fetchItems" />
    </div>
    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" key="table">
            <DraggableTable table-key="admin.categories" :columns-config="columnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="(i) => { showModal(i) }" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i><br>
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="closeModal">
        <AdminCategoryCreatePage @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
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
import CategoryController from '@/api/CategoryController';
import AdminCategoryCreatePage from './CategoriesCreatePage.vue';
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
        AdminCategoryCreatePage,
        Pagination,
        DraggableTable,
        BatchButton,
        AlertDialog
    },
    data() {
        return {
            data: null,
            loading: false,
            selectedIds: [],
            controller: CategoryController,
            //editingItem: null,
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: '№', size: 60 },
                { name: 'name', label: 'Название' },
                { name: 'parentName', label: 'Родительская категория' },
                { name: 'users', label: 'Доступ' },
                { name: 'userName', label: 'Создатель' },
                { name: 'createdAt', label: 'Дата создания' }
            ],
        }
    },
    created() {
        this.fetchItems();
        this.$store.commit('SET_SETTINGS_OPEN', true);
    },
    methods: {
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
                const new_data = await CategoryController.getItems(page);
                this.data = new_data;
            } catch (error) {
                this.showNotification('Ошибка получения списка категорий', error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        handleSaved() {
            this.showNotification('Категория успешно добавлена', '', false);
            this.fetchItems(this.data?.currentPage || 1, true);
            this.closeModal();
        },
        handleSavedError(m) {
            this.showNotification('Ошибка сохранения категории', m, true);
        },
        handleDeleted() {
            this.showNotification('Категория успешно удалена', '', false);
            this.fetchItems(this.data?.currentPage || 1, true);
            this.closeModal();
        },
        handleDeletedError(m) {
            this.showNotification('Ошибка удаления категории', m, true);
        }
    },
    computed: {
    },
}
</script>

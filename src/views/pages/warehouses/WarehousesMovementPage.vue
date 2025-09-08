<template>
    <div class="flex justify-between items-center mb-2">
        <div class="flex justify-start items-center">
            <PrimaryButton :onclick="() => { showModal(null) }" icon="fas fa-plus">{{ $t('addMovement') }}</PrimaryButton>
        </div>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            @changePage="fetchItems" />
    </div>
    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" key="table">
            <DraggableTable table-key="admin.warehouse_movements" :columns-config="translatedColumnsConfig"
                :table-data="data.items" :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="(i) => { showModal(i) }" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i><br>
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <WarehousesMovementCreatePage ref="warehousesmovementcreatepageForm" @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
            @deleted-error="handleDeletedError" @close-request="closeModal" :editingItem="editingItem" />
    </SideModalDialog>
    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" @close="closeNotification" />
            <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDeleteSelected')} (${selectedIds.length})?`" :confirm-text="$t('deleteSelected')"
                  :leave-text="$t('cancel')" @confirm="confirmDeleteItems" @leave="deleteDialog = false" />
</template>

<script>
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import WarehouseMovementController from '@/api/WarehouseMovementController';
import WarehousesMovementCreatePage from '@/views/pages/warehouses/WarehousesMovementCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import tableTranslationMixin from '@/mixins/tableTranslationMixin';

export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, tableTranslationMixin],
    components: { NotificationToast, PrimaryButton, SideModalDialog, Pagination, DraggableTable, WarehousesMovementCreatePage, BatchButton, AlertDialog },
    data() {
        return {
            data: null,
            loading: false,
            selectedIds: [],
            controller: WarehouseMovementController,
            editingItem: null,
            savedSuccessText: this.$t('movementSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingMovement'),
            deletedSuccessText: this.$t('movementSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingMovement'),
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60 },
                { name: 'dateUser', label: 'dateUser' },
                { name: 'direction', label: 'direction', html: true },
                { name: 'products', label: 'products', html: true },
                { name: 'note', label: 'note' },
            ],
        }
    },
    computed: {
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },

    mounted() {
        this.fetchItems();
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
        handleModalClose() {
            const formRef = this.$refs.warehousesmovementcreatepageForm;
            if (formRef && formRef.handleCloseRequest) {
                formRef.handleCloseRequest();
            } else {
                this.closeModal();
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
        }
    }
}
</script>
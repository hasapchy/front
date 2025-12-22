<template>
    <div class="flex justify-between items-center mb-4">
        <div class="flex items-center gap-2">
            <PrimaryButton 
                :onclick="() => { showModal(null) }" 
                icon="fas fa-plus"
                :disabled="!$store.getters.hasPermission('order_statuscategories_create')">
            </PrimaryButton>
            <transition name="fade">
                <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
            </transition>
        </div>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
            @changePage="fetchItems" @perPageChange="handlePerPageChange" />
    </div>
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="admin.order_status_categories" :columns-config="columnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="(i) => { showModal(i) }" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <SpinnerIcon />
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <OrderStatusCategoryCreatePage ref="orderstatuscategorycreatepageForm" @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
            @deleted-error="handleDeletedError" @close-request="closeModal" :editingItem="editingItem" />
    </SideModalDialog>
    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" @close="closeNotification" />
    <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDelete')} (${selectedIds.length})?`" :confirm-text="$t('delete')"
        :leave-text="$t('cancel')" @confirm="confirmDeleteItems" @leave="deleteDialog = false" />
</template>

<script>
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import OrderStatusCategoryController from '@/api/OrderStatusCategoryController';
import OrderStatusCategoryCreatePage from './OrderStatusCategoryCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import { translateOrderStatusCategory } from '@/utils/translationUtils';


export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin],
    components: {
        NotificationToast,
        PrimaryButton,
        SideModalDialog,
        OrderStatusCategoryCreatePage,
        Pagination,
        DraggableTable,
        BatchButton,
        AlertDialog
    },
    data() {
        return {
            controller: OrderStatusCategoryController,
            cacheInvalidationType: 'orderStatusCategories',
            savedSuccessText: this.$t('orderStatusCategorySuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingOrderStatusCategory'),
            deletedSuccessText: this.$t('orderStatusCategorySuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingOrderStatusCategory'),
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60 },
                { name: 'name', label: 'name' },
                { name: 'color', label: 'color', html: true },
                { name: 'createdAt', label: 'creationDate' }
            ]
        }
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', true);
    },

    mounted() {
        this.fetchItems();
    },
    methods: {
        translateOrderStatusCategory,
        itemMapper(i, c) {
            switch (c) {
                case 'color':
                    if (i.color) {
                        return `<div style="width: 20px; height: 20px; background-color: ${i.color}; border-radius: 4px; display: inline-block; border: 1px solid #ddd;"></div>`;
                    }
                    return '-';
                case 'createdAt':
                    return i.formatCreatedAt ? i.formatCreatedAt() : i.createdAt;
                case 'name':
                    return translateOrderStatusCategory(i.name, this.$t);
                default:
                    return i[c];
            }
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const per_page = this.perPage;
                
                const new_data = await OrderStatusCategoryController.getItems(page, per_page);
                this.data = new_data;
            } catch (error) {
                this.showNotification(this.$t('errorGettingOrderStatusCategories'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        }
    },
    computed: {
    },
}
</script>


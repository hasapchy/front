<template>
    <div class="flex justify-between items-center mb-4">
        <PrimaryButton :onclick="() => { showModal(null) }" icon="fas fa-plus">{{ $t('addService') }}</PrimaryButton>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            @changePage="fetchItems" />
    </div>
    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="admin.products" :columns-config="translatedColumnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="(i) => { showModal(i) }" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i><br>
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="closeModal">
        <ProductsCreatePage @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
            @deleted-error="handleDeletedError" :editingItem="editingItem" default-type="service" />
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
import ProductController from '@/api/ProductController';
import ProductsCreatePage from '@/views/pages/products/ProductsCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import tableTranslationMixin from '@/mixins/tableTranslationMixin';

export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, tableTranslationMixin],
    components: { NotificationToast, PrimaryButton, SideModalDialog, ProductsCreatePage, Pagination, DraggableTable, BatchButton, AlertDialog },
    data() {
        return {
            data: null,
            loading: false,
            selectedIds: [],
            controller: ProductController,
            savedSuccessText: this.$t('productSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingProduct'),
            deletedSuccessText: this.$t('productSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingProduct'),
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60 },
                { name: 'image', label: 'image', image: true },
                { name: 'name', label: 'name' },
                { name: 'sku', label: 'sku' },
                { name: 'barcode', label: 'barcode' },
                { name: 'category_name', label: 'category' },
                { name: 'retail_price', label: 'retailPrice' },
                { name: 'wholesale_price', label: 'wholesalePrice' }
            ],
        }
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', true);
    },

    mounted() {
        this.fetchItems();
    },
    methods: {
        itemMapper(i, c) {
            switch (c) {
                case 'retail_price':
                    return i.retailPriceFormatted();
                case 'wholesale_price':
                    return i.wholesalePriceFormatted();
                case 'image':
                    return i.image ? i.imgUrl() : null;
                default:
                    return i[c];
            }
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const new_data = await ProductController.getItems(page, false);
                this.data = new_data;
            } catch (error) {
                this.showNotification(this.$t('errorGettingProductList'), error.message, true);
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

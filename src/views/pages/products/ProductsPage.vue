<template>
    <div class="flex justify-between items-center mb-4">
        <div class="flex items-center space-x-4">
            <PrimaryButton 
                :onclick="() => { showModal(null) }" 
                icon="fas fa-plus"
                :disabled="!$store.getters.hasPermission('products_create')">
            </PrimaryButton>
            
            <!-- Фильтр по категориям -->
            <div class="flex items-center space-x-2">
                <select v-model="selectedCategoryId" @change="onCategoryFilterChange" 
                        class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">{{ $t('allCategoriesFilter') }}</option>
                    <option v-for="category in categories" :key="category.id" :value="category.id">
                        {{ category.name }}
                    </option>
                </select>
            </div>
        </div>
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
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <ProductsCreatePage ref="productForm" @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
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
import ProductController from '@/api/ProductController';
import CategoryController from '@/api/CategoryController';
import ProductsCreatePage from '@/views/pages/products/ProductsCreatePage.vue';
import { eventBus } from '@/eventBus';
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
    components: { NotificationToast, PrimaryButton, SideModalDialog, ProductsCreatePage, Pagination, DraggableTable, BatchButton, AlertDialog },
    data() {
        return {
            data: null,
            loading: false,
            selectedIds: [],
            categories: [],
            selectedCategoryId: '',
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
                { name: 'wholesale_price', label: 'wholesalePrice' },
                { name: 'dateUser', label: 'dateUser' },
            ],
        }
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', true);
        
        eventBus.on('global-search', this.handleSearch);
    },

    mounted() {
        this.fetchCategories();
        this.fetchItems();
    },

    beforeUnmount() {
        eventBus.off('global-search', this.handleSearch);
    },

    methods: {
        async fetchCategories() {
            try {
                this.categories = await CategoryController.getAllItems();
            } catch (error) {
                console.error('Ошибка при загрузке категорий:', error);
            }
        },

        onCategoryFilterChange() {
            this.fetchItems(1);
        },

        handleSearch(query) {
            this.$store.dispatch('setSearchQuery', query);
            this.fetchItems(1, false);
        },
        itemMapper(i, c) {
            switch (c) {
                case 'retail_price':
                    return i.retailPriceFormatted();
                case 'wholesale_price':
                    return i.wholesalePriceFormatted();
                case 'image':
                    return i.image ? i.imgUrl() : null;
                case 'category_name':
                    // Показываем основную категорию или все категории
                    return i.getCategoryDisplayName();
                case 'dateUser':
                    return `${i.formatDate()} / ${i.creator?.name || this.$t('notSpecified')}`;
                default:
                    return i[c];
            }
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const params = {};
                if (this.selectedCategoryId) {
                    params.category_id = this.selectedCategoryId;
                }
                if (this.searchQuery) {
                    params.search = this.searchQuery;
                }
                
                const new_data = await ProductController.getItems(page, true, params);
                this.data = new_data;
            } catch (error) {
                this.showNotification(this.$t('errorGettingProductList'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        handleModalClose() {
            if (this.$refs.productForm && this.$refs.productForm.handleCloseRequest) {
                this.$refs.productForm.handleCloseRequest();
            } else {
                this.closeModal();
            }
        }
    },
    computed: {
        searchQuery() {
            return this.$store.state.searchQuery;
        },
    },
}
</script>

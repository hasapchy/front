<template>
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="admin.products" :columns-config="columnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="onItemClick">
                <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                    <TableControlsBar
                        :show-filters="true"
                        :has-active-filters="hasActiveFilters"
                        :active-filters-count="getActiveFiltersCount()"
                        :on-filters-reset="resetFilters"
                        :show-pagination="true"
                        :pagination-data="data ? { currentPage: data.currentPage, lastPage: data.lastPage, perPage: perPage, perPageOptions: perPageOptions } : null"
                        :on-page-change="fetchItems"
                        :on-per-page-change="handlePerPageChange"
                        :resetColumns="resetColumns"
                        :columns="columns"
                        :toggleVisible="toggleVisible"
                        :log="log">
                        <template #left>
                            <PrimaryButton 
                                :onclick="() => { showModal(null) }" 
                                icon="fas fa-plus"
                                :disabled="!$store.getters.hasPermission('products_create')">
                            </PrimaryButton>
                            
                            <transition name="fade">
                                <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
                            </transition>
                            
                            <FiltersContainer
                                :has-active-filters="hasActiveFilters"
                                :active-filters-count="getActiveFiltersCount()"
                                @reset="resetFilters"
                                @apply="applyFilters">
                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('category') || 'Категория' }}</label>
                                    <select v-model="selectedCategoryId" class="w-full">
                                        <option value="">{{ $t('allCategoriesFilter') }}</option>
                                        <option v-for="category in categories" :key="category.id" :value="category.id">
                                            {{ category.name }}
                                        </option>
                                    </select>
                                </div>
                            </FiltersContainer>
                        </template>

                        <template #right>
                            <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
                                :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
                                @changePage="fetchItems" @perPageChange="handlePerPageChange" />
                        </template>

                        <template #gear="{ resetColumns, columns, toggleVisible, log }">
                            <TableFilterButton v-if="columns && columns.length" :onReset="resetColumns">
                                <ul>
                                    <draggable v-if="columns.length" class="dragArea list-group w-full" :list="columns"
                                        @change="log">
                                        <li v-for="(element, index) in columns" :key="element.name"
                                            @click="toggleVisible(index)"
                                            class="flex items-center hover:bg-gray-100 p-2 rounded">
                                            <div class="space-x-2 flex flex-row justify-between w-full select-none">
                                                <div>
                                                    <i class="text-sm mr-2 text-[#337AB7]"
                                                        :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"></i>
                                                    {{ $te(element.label) ? $t(element.label) : element.label }}
                                                </div>
                                                <div><i
                                                        class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab"></i>
                                                </div>
                                            </div>
                                        </li>
                                    </draggable>
                                </ul>
                            </TableFilterButton>
                        </template>
                    </TableControlsBar>
                </template>
            </DraggableTable>
        </div>
        <div v-else key="loader" class="min-h-64">
            <TableSkeleton />
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <ProductsCreatePage v-if="modalDialog" :key="editingItem ? editingItem.id : 'new-product'" ref="productForm" @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
            @deleted-error="handleDeletedError" @close-request="closeModal" :editingItem="editingItem" :defaultType="'product'" />
    </SideModalDialog>
            <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDelete')} (${selectedIds.length})?`" :confirm-text="$t('delete')"
            :leave-text="$t('cancel')" @confirm="confirmDeleteItems" @leave="deleteDialog = false" />
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import ProductController from '@/api/ProductController';
import ProductsCreatePage from '@/views/pages/products/ProductsCreatePage.vue';
import { eventBus } from '@/eventBus';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';

import companyChangeMixin from '@/mixins/companyChangeMixin';
import searchMixin from '@/mixins/searchMixin';
import filtersMixin from '@/mixins/filtersMixin';
import storeDataLoaderMixin from '@/mixins/storeDataLoaderMixin';
import { highlightMatches } from '@/utils/searchUtils';

export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin,  companyChangeMixin, searchMixin, filtersMixin, storeDataLoaderMixin],
    components: { PrimaryButton, SideModalDialog, ProductsCreatePage, Pagination, DraggableTable, BatchButton, AlertDialog, TableControlsBar, TableFilterButton, TableSkeleton, FiltersContainer, draggable: VueDraggableNext },
    data() {
        return {
            // data, loading, perPage, perPageOptions - из crudEventMixin
            // selectedIds - из batchActionsMixin
            categories: [],
            selectedCategoryId: '',
            controller: ProductController,
            cacheInvalidationType: 'products',
            itemViewRouteName: 'ProductView',
            baseRouteName: 'Products',
            errorGettingItemText: this.$t('errorGettingProduct'),
            deletePermission: 'products_delete',
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
            ]
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
    watch: {
        '$route.params.id': {
            immediate: true,
            handler(value) {
                this.handleRouteItem(value);
            }
        }
    },

    beforeUnmount() {
        eventBus.off('global-search', this.handleSearch);
    },

    methods: {
        async fetchCategories() {
            await this.loadStoreData({
                getterName: 'categories',
                dispatchName: 'loadCategories',
                localProperty: 'categories',
                defaultValue: []
            });
        },

        onCategoryFilterChange() {
            this.fetchItems(1);
        },

        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        async handleCompanyChanged(companyId) {
            this.selectedCategoryId = '';
            this.selectedIds = [];
            
            // Перезагружаем категории и данные
            await this.fetchCategories();
            await this.fetchItems(1, false);
            
            // Уведомляем пользователя о смене компании
            this.$store.dispatch('showNotification', {
              title: 'Компания изменена',
              isDanger: false
            });
        },
        itemMapper(i, c) {
            const search = this.searchQuery;
            switch (c) {
                case 'retail_price':
                    return i.retailPriceFormatted();
                case 'wholesale_price':
                    return i.wholesalePriceFormatted();
                case 'image':
                    return i.image ? i.imgUrl() : null;
                case 'category_name':
                    // Показываем основную категорию или все категории
                    return search ? highlightMatches(i.getCategoryDisplayName() || '', search) : i.getCategoryDisplayName();
                case 'dateUser':
                    return `${i.formatDate()} / ${i.creator?.name || this.$t('notSpecified')}`;
                case 'name':
                    return search ? highlightMatches(i.name || '', search) : (i.name || '');
                case 'sku':
                    return search ? highlightMatches(i.sku || '', search) : (i.sku || '');
                case 'barcode':
                    return search ? highlightMatches(i.barcode || '', search) : (i.barcode || '');
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
                
               
                const per_page = this.perPage;
                
                const new_data = await ProductController.getItems(page, true, params, per_page);
                this.data = new_data;
            } catch (error) {
                this.showNotification(this.$t('errorGettingProductList'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        resetFilters() {
            this.resetFiltersFromConfig({
                selectedCategoryId: ''
            });
        },
        getActiveFiltersCount() {
            return this.getActiveFiltersCountFromConfig([
                { value: this.selectedCategoryId, defaultValue: '' }
            ]);
        },
        closeModal(skipScrollRestore = false) {
            modalMixin.methods.closeModal.call(this, skipScrollRestore);
            if (this.$route.params.id) {
                this.$router.replace({ name: 'Products' });
            }
        },
    },
    computed: {
        searchQuery() {
            return this.$store.state.searchQuery;
        },
        hasActiveFilters() {
            return this.selectedCategoryId !== '';
        }
    },
}
</script>

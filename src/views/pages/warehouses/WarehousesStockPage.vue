<template>
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" key="table">
            <DraggableTable table-key="admin.warehouse_stocks" :columns-config="columnsConfig"
                :table-data="data.items" :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="(i) => { showModal(i) }">
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
                                :onclick="openCreateWarehouse" 
                                icon="fas fa-plus"
                                :disabled="!$store.getters.hasPermission('warehouses_create')">
                                Склад
                            </PrimaryButton>
                            <PrimaryButton 
                                :onclick="openCreateProduct" 
                                icon="fas fa-plus"
                                :disabled="!$store.getters.hasPermission('products_create')">
                                Товар
                            </PrimaryButton>
                            
                            <FiltersContainer
                                :has-active-filters="hasActiveFilters"
                                :active-filters-count="getActiveFiltersCount()"
                                @reset="resetFilters">
                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('warehouse') || 'Склад' }}</label>
                                    <select v-model="warehouseId" @change="fetchItems(1)" class="w-full">
                                        <option value="">{{ $t('allWarehouses') }}</option>
                                        <option v-for="warehouse in allWarehouses" :key="warehouse.id" :value="warehouse.id">
                                            {{ warehouse.name }}
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('category') || 'Категория' }}</label>
                                    <select v-model="categoryId" @change="fetchItems(1)" class="w-full">
                                        <option value="">{{ $t('allCategories') }}</option>
                                        <option v-for="category in allCategories" :key="category.id" :value="category.id">
                                            {{ category.name }}
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('availability') || 'Наличие' }}</label>
                                    <select v-model="availabilityFilter" @change="fetchItems(1)" class="w-full">
                                        <option value="all">{{ $t('allProducts') || 'Все товары' }}</option>
                                        <option value="in_stock">{{ $t('inStock') || 'В наличии' }}</option>
                                        <option value="out_of_stock">{{ $t('outOfStock') || 'Нет в наличии' }}</option>
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
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <SpinnerIcon />
        </div>
    </transition>
    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" @close="closeNotification" />
    <SideModalDialog :showForm="modalCreateWarehouse" :onclose="() => modalCreateWarehouse = false" :level="1">
        <AdminWarehouseCreatePage @saved="onWarehouseSaved" @saved-error="() => modalCreateWarehouse = false" />
    </SideModalDialog>

    <SideModalDialog :showForm="modalCreateProduct" :onclose="() => modalCreateProduct = false" :level="1">
        <ProductsCreatePage :defaultType="'product'" @saved="onProductSaved" @saved-error="handleSavedError" />
    </SideModalDialog>

    <SideModalDialog :showForm="modalDialog" :onclose="closeModal">
        <ProductsCreatePage :editingItem="editingItem" @saved="onProductEdited" @saved-error="handleSavedError" />
    </SideModalDialog>
</template>

<script>
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import WarehouseStockController from '@/api/WarehouseStockController';
import ProductsCreatePage from '@/views/pages/products/ProductsCreatePage.vue';
import CategoryController from '@/api/CategoryController';
import AdminWarehouseCreatePage from '@/views/pages/admin/warehouses/AdminWarehouseCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';

import ProductController from '@/api/ProductController';
import { eventBus } from '@/eventBus';
import { formatQuantity } from '@/utils/numberUtils';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import searchMixin from '@/mixins/searchMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import { highlightMatches } from '@/utils/searchUtils';

export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, companyChangeMixin, searchMixin],
    components: { NotificationToast, PrimaryButton, SideModalDialog, ProductsCreatePage, Pagination, DraggableTable, AdminWarehouseCreatePage, TableControlsBar, TableFilterButton, FiltersContainer, draggable: VueDraggableNext },
    data() {
        return {
            cacheInvalidationType: 'stocks',
            allWarehouses: [],
            allCategories: [],
            warehouseId: '',
            categoryId: '',
            availabilityFilter: 'all',
            modalCreateWarehouse: false,
            modalCreateProduct: false,
            editingItem: null,
            modalDialog: false,
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60 },
                { name: 'warehouseName', label: 'warehouse', html: true },
                { name: 'image', label: 'image', image: true },
                { name: 'productName', label: 'product', html: true },
                { name: 'quantity', label: 'quantity' },
                { name: 'categoryName', label: 'category', html: true },
                { name: 'createdAt', label: 'createdAt' }
            ]
        }
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
        eventBus.on('global-search', this.handleSearch);
    },

    mounted() {
        this.fetchItems();
        this.fetchAllCategories();
        this.fetchAllWarehouses();
    },
    beforeUnmount() {
        eventBus.off('global-search', this.handleSearch);
    },
    methods: {
        async fetchAllCategories() {
            this.allCategories = await CategoryController.getAllItems();
        },
        async fetchAllWarehouses() {
            // Используем данные из store
            await this.$store.dispatch('loadWarehouses');
            this.allWarehouses = this.$store.getters.warehouses;
        },
        itemMapper(i, c) {
            switch (c) {
                case 'warehouseName':
                    return this.searchQuery ? highlightMatches(i.warehouseName || '', this.searchQuery) : (i.warehouseName || '');
                case 'productName':
                    return this.searchQuery ? highlightMatches(i.productName || '', this.searchQuery) : (i.productName || '');
                case 'categoryName':
                    return this.searchQuery ? highlightMatches(i.categoryName || '', this.searchQuery) : (i.categoryName || '');
                case 'image':
                    return i.productImage ? i.imgUrl() : null;
                case 'quantity':
                    return formatQuantity(i.quantity) + ' ' + i.unitShortName;
                case 'createdAt':
                    return i.formatCreatedAt();
                default:
                    return i[c];
            }
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        async handleCompanyChanged(companyId) {
            // ✅ Очищаем фильтры при смене компании
            this.warehouseId = '';
            this.categoryId = '';
            this.availabilityFilter = 'all';
            this.modalCreateWarehouse = false;
            this.modalCreateProduct = false;
            this.editingItem = null;
            this.modalDialog = false;
            
            // Перезагружаем данные со страницы 1
            await this.fetchAllCategories();
            await this.fetchAllWarehouses();
            await this.fetchItems(1, false);
            
            // Уведомляем пользователя о смене компании
            this.$store.dispatch('showNotification', {
              title: 'Компания изменена',
              isDanger: false
            });
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            var category_id = this.categoryId != '' ? this.categoryId : null;
            var warehouse_id = this.warehouseId != '' ? this.warehouseId : null;
            try {
               
                const per_page = this.perPage;
                
                const new_data = await WarehouseStockController.getItems(page, warehouse_id, category_id, per_page, this.searchQuery, this.availabilityFilter);
                this.data = new_data;
            } catch (error) {
                this.showNotification('Ошибка получения списка товаров на складе', error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        resetFilters() {
            this.warehouseId = '';
            this.categoryId = '';
            this.availabilityFilter = 'all';
            this.fetchItems(1);
        },
        getActiveFiltersCount() {
            let count = 0;
            if (this.warehouseId !== '') count++;
            if (this.categoryId !== '') count++;
            if (this.availabilityFilter !== 'all') count++;
            return count;
        },
        openCreateWarehouse() {
            this.modalCreateWarehouse = true;
        },
        onWarehouseSaved() {
            this.modalCreateWarehouse = false;
            this.fetchAllWarehouses();
            this.showNotification('Склад успешно добавлен', '');
        },

        openCreateProduct() {
            this.modalCreateProduct = true;
        },
        onProductSaved() {
            this.modalCreateProduct = false;
            this.fetchItems();
            this.showNotification('Товар успешно добавлен', '');
        },
        onProductEdited() {
            this.closeModal();
            this.editingItem = null;
            this.fetchItems();
            this.showNotification('Товар успешно обновлен', '');
        },
        handleSavedError(err) {
            this.showNotification('Ошибка сохранения товара', err, true);
        },
        async showModal(item) {
            try {
                // Используем поиск по имени товара (быстрее чем загружать все страницы)
                const searchResults = await ProductController.searchItems(item.productName);
                const product = searchResults.find(p => p.id === item.productId);
                
                if (product) {
                    this.editingItem = product;
                    this.modalDialog = true;
                } else {
                    this.showNotification('Товар не найден', '', true);
                }
            } catch (error) {
                this.showNotification('Ошибка загрузки товара', error.message, true);
            }
        },
    },
    computed: {
        searchQuery() {
            return this.$store.state.searchQuery;
        },
        hasActiveFilters() {
            return this.warehouseId !== '' || this.categoryId !== '' || this.availabilityFilter !== 'all';
        }
    },
}
</script>
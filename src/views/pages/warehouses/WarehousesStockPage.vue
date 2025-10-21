<template>
    <div class="flex justify-between items-center mb-4">
        <div class="flex justify-start items-center">
            <PrimaryButton :onclick="openCreateWarehouse" icon="fas fa-plus"
                :disabled="!$store.getters.hasPermission('warehouses_create')">
            </PrimaryButton>
            <PrimaryButton :onclick="openCreateProduct" icon="fas fa-plus" class="ml-2"
                :disabled="!$store.getters.hasPermission('products_create')">
            </PrimaryButton>
            <div class="ml-2">
                <select v-model="warehouseId" @change="fetchItems" class="p-2 border rounded">
                    <option value="">{{ $t('allWarehouses') }}</option>
                    <template v-if="allWarehouses.length">
                        <option v-for="parent in allWarehouses" :key="parent.id" :value="parent.id">
                            {{ parent.name }}
                        </option>
                    </template>
                </select>
            </div>
            <div class="ml-2">
                <select v-model="categoryId" @change="fetchItems" class="p-2 border rounded">
                    <option value="">{{ $t('allCategories') }}</option>
                    <template v-if="allCategories.length">
                        <option v-for="parent in allCategories" :key="parent.id" :value="parent.id">
                            {{ parent.name }}
                        </option>
                    </template>
                </select>
            </div>
        </div>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
            @changePage="fetchItems" @perPageChange="handlePerPageChange" />
    </div>
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" key="table">
            <DraggableTable table-key="admin.warehouse_stocks" :columns-config="translatedColumnsConfig"
                :table-data="data.items" :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="(i) => { showModal(i) }" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i><br>
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
import WarehouseStockController from '@/api/WarehouseStockController';
import ProductsCreatePage from '@/views/pages/products/ProductsCreatePage.vue';
import CategoryController from '@/api/CategoryController';
import AdminWarehouseCreatePage from '@/views/pages/admin/warehouses/AdminWarehouseCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import tableTranslationMixin from '@/mixins/tableTranslationMixin';
import ProductController from '@/api/ProductController';
import { eventBus } from '@/eventBus';
import { formatQuantity } from '@/utils/numberUtils';

export default {
    mixins: [modalMixin, notificationMixin, tableTranslationMixin],
    components: { NotificationToast, PrimaryButton, SideModalDialog, ProductsCreatePage, Pagination, DraggableTable, AdminWarehouseCreatePage },
    data() {
        return {
            data: null,
            loading: false,
            cacheInvalidationType: 'stocks', // Тип кэша для инвалидации
            allWarehouses: [],
            allCategories: [],
            warehouseId: '',
            categoryId: '',
            modalCreateWarehouse: false,
            modalCreateProduct: false,
            editingItem: null,
            modalDialog: false,
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60 },
                { name: 'warehouseName', label: 'warehouse' },
                { name: 'image', label: 'image', image: true },
                { name: 'productName', label: 'product' },
                { name: 'quantity', label: 'quantity' },
                { name: 'categoryName', label: 'category' },
                { name: 'createdAt', label: 'createdAt' }
            ],
            perPage: 10,
            perPageOptions: [10, 25, 50, 100]
        }
    },
    computed: {
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
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            var category_id = this.categoryId != '' ? this.categoryId : null;
            var warehouse_id = this.warehouseId != '' ? this.warehouseId : null;
            try {
                const new_data = await WarehouseStockController.getStocks(page, warehouse_id, category_id, this.perPage, this.searchQuery);
                this.data = new_data;
            } catch (error) {
                this.showNotification('Ошибка получения списка товаров на складе', error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        handleSearch(query) {
            this.$store.dispatch('setSearchQuery', query);
            this.fetchItems(1, false);
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
    },
}
</script>
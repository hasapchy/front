<template>
    <div class="flex justify-between items-center mb-4">
        <div class="flex justify-start items-center">
            <PrimaryButton :onclick="openCreateWarehouse" icon="fas fa-plus">Добавить склад</PrimaryButton>
            <PrimaryButton :onclick="openCreateProduct" icon="fas fa-plus" class="ml-2">Добавить товар</PrimaryButton>
            <div class="ml-4">
                <select v-model="warehouseId" @change="fetchItems" class="p-2 border rounded">
                    <option value="">Все склады</option>
                    <template v-if="allWarehouses.length">
                        <option v-for="parent in allWarehouses" :key="parent.id" :value="parent.id">
                            {{ parent.name }}
                        </option>
                    </template>
                </select>
            </div>
            <div class="ml-2">
                <select v-model="categoryId" @change="fetchItems" class="p-2 border rounded">
                    <option value="">Все категории</option>
                    <template v-if="allCategories.length">
                        <option v-for="parent in allCategories" :key="parent.id" :value="parent.id">
                            {{ parent.name }}
                        </option>
                    </template>
                </select>
            </div>
        </div>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            @changePage="fetchItems" />
    </div>
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" key="table">
            <DraggableTable table-key="admin.warehouse_stocks" :columns-config="columnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
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
        <ProductsCreatePage :defaultType="'product'" @saved="onProductSaved"
            @saved-error="handleSavedError" />
    </SideModalDialog>

    <SideModalDialog :showForm="modalDialog" :onclose="closeModal">
        <ProductsCreatePage :editingItem="editingItem" @saved="onProductEdited"
            @saved-error="handleSavedError" />
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
import WarehouseController from '@/api/WarehouseController';
import AdminWarehouseCreatePage from '@/views/pages/admin/warehouses/AdminWarehouseCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import ProductController from '@/api/ProductController';

export default {
    mixins: [modalMixin, notificationMixin],
    components: { NotificationToast, PrimaryButton, SideModalDialog, ProductsCreatePage, Pagination, DraggableTable, AdminWarehouseCreatePage },
    data() {
        return {
            data: null,
            loading: false,
            //editingItem: null,
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
                { name: 'id', label: '№', size: 60 },
                { name: 'warehouseName', label: 'Склад' },
                { name: 'image', label: 'Изобр.', image: true },
                { name: 'productName', label: 'Товар' },
                { name: 'quantity', label: 'Количество' },
                { name: 'categoryName', label: 'Категория' },
                { name: 'createdAt', label: 'Дата создания' }
            ],
        }
    },
    created() {
        this.fetchItems();
        this.fetchAllCategories();
        this.fetchAllWarehouses();
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },
    methods: {
        async fetchAllCategories() {
            this.allCategories = await CategoryController.getAllItems();
        },
        async fetchAllWarehouses() {
            this.allWarehouses = await WarehouseController.getAllItems();
        },
        itemMapper(i, c) {
            switch (c) {
                case 'image':
                    return i.productImage ? i.imgUrl() : null;
                case 'quantity':
                    return i.quantity + ' ' + i.unitShortName;
                case 'createdAt':
                    return i.formatCreatedAt();
                default:
                    return i[c];
            }
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            var category_id = this.categoryId != '' ? this.categoryId : null;
            var warehouse_id = this.warehouseId != '' ? this.warehouseId : null;
            try {
                const new_data = await WarehouseStockController.getStocks(page, warehouse_id, category_id);
                this.data = new_data;
            } catch (error) {
                this.showNotification('Ошибка получения списка товаров на складе', error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
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
            // Получаем все товары на текущей странице (или ищем по id)
            const page = 1; // или текущая страница, если есть
            try {
                const productsPage = await ProductController.getItems(page);
                const found = productsPage.items.find(p => p.id === item.productId);
                if (found) {
                    this.editingItem = found;
                    this.modalDialog = true;
                } else {
                    this.showNotification('Товар не найден', '', true);
                }
            } catch (error) {
                this.showNotification('Ошибка загрузки товара', error.message, true);
            }
        },
    },
}
</script>
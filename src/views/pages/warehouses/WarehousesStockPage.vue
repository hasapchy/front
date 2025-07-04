<template>
    <div class="flex justify-between items-center mb-4">
        <div class="flex justify-start items-center">
            <!-- Кнопки -->
            <PrimaryButton :onclick="openCreateWarehouse" icon="fas fa-plus">Добавить склад</PrimaryButton>
            <PrimaryButton :onclick="openCreateProduct" icon="fas fa-plus" class="ml-2">Добавить товар</PrimaryButton>

            <!-- Селекты -->
            <div class="ml-4">
                <select v-model="warehouseId" @change="fetchItems" class="p-2 border rounded">
                    <option value="">Все склады</option>
                    <option v-if="allWarehouses.length" v-for="parent in allWarehouses" :value="parent.id">
                        {{ parent.name }}
                    </option>
                </select>
            </div>

            <div class="ml-2">
                <select v-model="categoryId" @change="fetchItems" class="p-2 border rounded">
                    <option value="">Все категории</option>
                    <option v-if="allCategories.length" v-for="parent in allCategories" :value="parent.id">
                        {{ parent.name }}
                    </option>
                </select>
            </div>
        </div>

        <!-- Пагинация -->
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            @changePage="fetchItems" />
    </div>


    <!-- Таблица с заглушкой -->
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" key="table">
            <DraggableTable table-key="admin.warehouse_stocks" :columns-config="columnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" :onItemClick="(i) => { showModal(i) }" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i><br>
        </div>
    </transition>
    <!-- Модальное окно форма создания/редактирования -->
    <!-- <SideModalDialog :showForm="modalDialog" :onclose="closeModal">
        <AdminProductsCreatePage @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
            @deleted-error="handleDeletedError" :editingItem="editingItem" />
    </SideModalDialog> -->
    <!-- Компонент уведомлений -->
    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" />
    <SideModalDialog :showForm="modalCreateWarehouse" :onclose="() => modalCreateWarehouse = false" :level="1">
        <AdminWarehouseCreatePage @saved="onWarehouseSaved" @saved-error="() => modalCreateWarehouse = false" />
    </SideModalDialog>

    <SideModalDialog :showForm="modalCreateProduct" :onclose="() => modalCreateProduct = false" :level="1">
        <AdminProductsCreatePage :editingItem="null" :defaultType="'product'" @saved="onProductSaved"
            @saved-error="() => modalCreateProduct = false" />
    </SideModalDialog>

</template>

<script>
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import WarehouseStockController from '@/api/WarehouseStockController';
import AdminProductsCreatePage from '@/views/pages/admin/products/AdminProductsCreatePage.vue';
import CategoryController from '@/api/CategoryController';
import WarehouseController from '@/api/WarehouseController';
import AdminWarehouseCreatePage from '@/views/pages/admin/warehouses/AdminWarehouseCreatePage.vue';

export default {
    components: {
        NotificationToast,
        PrimaryButton,
        SideModalDialog,
        AdminProductsCreatePage,
        Pagination,
        DraggableTable,
        AdminWarehouseCreatePage
    },
    data() {
        return {
            data: null,
            loading: false,
            notification: false,
            notificationTitle: '',
            notificationSubtitle: '',
            notificationIsDanger: false,
            modalDialog: false,
            editingItem: null,
            // filters
            allWarehouses: [],
            allCategories: [],
            warehouseId: '',
            categoryId: '',
            modalCreateWarehouse: false,
            modalCreateProduct: false,
            // table config
            columnsConfig: [
                { name: 'id', label: '#' },
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
        showNotification(title, subtitle, isDanger = false) {
            this.notificationTitle = title;
            this.notificationSubtitle = subtitle;
            this.notificationIsDanger = isDanger;
            this.notification = true;
            setTimeout(() => {
                this.notification = false;
            }, 3000);
        },
        showModal(item = null) {
            // this.modalDialog = true;
            // this.editingItem = item;
        },
        closeModal() {
            // this.modalDialog = false;
        },
        openCreateWarehouse() {
            this.modalCreateWarehouse = true;
        },
        onWarehouseSaved() {
            this.modalCreateWarehouse = false;
            this.fetchAllWarehouses(); // обновим список
            this.showNotification('Склад успешно добавлен', '');
        },

        openCreateProduct() {
            this.modalCreateProduct = true;
        },
        onProductSaved() {
            this.modalCreateProduct = false;
            this.fetchItems(); // если нужно обновить таблицу
            this.showNotification('Товар успешно добавлен', '');
        }

        // handleSaved() {
        //     this.showNotification('Товар на складе успешно добавлен', '', false);
        //     this.fetchItems(this.data?.currentPage || 1, true);
        //     this.closeModal();
        // },
        // handleSavedError(m) {
        //     this.showNotification('Ошибка сохранения товара на складе', m, true);
        // },
        // handleDeleted() {
        //     this.showNotification('Товар на складе успешно удален', '', false);
        //     this.fetchItems(this.data?.currentPage || 1, true);
        //     this.closeModal();
        // },
        // handleDeletedError(m) {
        //     this.showNotification('Ошибка удаления товара на складе', m, true);
        // }
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
.fade-leave-to {
    opacity: 0;
}
</style>

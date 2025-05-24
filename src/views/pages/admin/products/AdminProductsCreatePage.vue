<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">Товар | Услуга</h2>

        <div class="mt-2 flex items-center">
            <div>
                <div class="mt-2">
                    <label class="block mb-1">Тип</label>
                    <select v-model="type">
                        <option value="">Выберите тип</option>
                        <option value="product">Товар</option>
                        <option value="service">Услуга</option>
                    </select>
                </div>
                <div>
                    <label>Изображение</label>
                    <input type="file" @change="onFileChange" ref="imageInput">
                </div>
                <div class="mt-2">
                    <label>Название</label>
                    <input type="text" v-model="name" class="">
                </div>

            </div>
            <div v-if="selected_image" class="mt-2 ml-3 p-3 bg-gray-100 rounded">
                <img :src="selected_image" alt="Selected Image" class="w-32 h-32 object-cover rounded">
                <button @click="() => { this.selected_image = null; this.image = null }"
                    class="mt-2 text-red-500 text-sm">Удалить</button>
            </div>
            <div v-else-if="editingItem?.image" class="mt-2 ml-3 p-3 bg-gray-100 rounded">
                <img :src="editingItem?.imgUrl()" alt="Selected Image" class="w-32 h-32 object-cover rounded">
                <button @click="() => { this.editingItem.image = '' }"
                    class="mt-2 text-red-500 text-sm">Удалить</button>
            </div>
        </div>
        <div class="mt-2">
            <label class="block mb-1">Категория</label>
            <div class="flex items-center space-x-2">
                <select v-model="category_id">
                    <option value="">Нет</option>
                    <option v-if="allCategories.length" v-for="parent in allCategories" :value="parent.id">{{
                        parent.name }}
                    </option>
                </select>
                <PrimaryButton icon="fas fa-add" :is-info="true" :onclick="showModal" />
            </div>
        </div>
        <div class="mt-2">
            <label>Описание</label>
            <input type="text" v-model="description">
        </div>
        <div class=" mt-2">
            <label class="block mb-1">Единица измерения</label>
            <select v-model="unit_id">
                <option value="">Нет</option>
                <option v-if="units.length" v-for="parent in units" :value="parent.id">{{ parent.name }} ({{
                    parent.short_name }})
                </option>
            </select>
        </div>
        <div class="mt-2">
            <label>Артикул</label>
            <input type="text" v-model="sku" :disabled="editingItemId !== null">
        </div>

        <div class="mt-2">
            <label class="block mb-1">Статус</label>
            <select v-model="status_id">
                <option value="">Нет</option>
                <option v-if="statuses.length" v-for="s in statuses" :value="s.id">{{
                    s.name }}
                </option>
            </select>
        </div>
        <!-- <div class=" mt-2">
        <label class="block mb-1">Валюта</label>
        <select v-model="currency_id">
            <option value="">Нет</option>
            <option v-if="currencies.length" v-for="parent in currencies" :value="parent.id">{{ parent.name }}
            </option>
        </select>
    </div> -->
        <div class="mt-2 flex space-x-2">
            <div class="w-1/3">
                <label>Закупочная цена</label>
                <div class="flex items-center rounded-l">
                    <input type="number" v-model="purchase_price">
                    <!-- <span v-if="selectedCurrency" class="p-2 bg-gray-200 rounded-r ">{{ selectedCurrency?.symbol }}</span> -->
                </div>
            </div>
            <div class="w-1/3">
                <label>Оптовая цена</label>
                <div class="flex items-center rounded-l">
                    <input type="number" v-model="wholesale_price">
                    <!-- <span v-if="selectedCurrency" class="p-2 bg-gray-200 rounded-r ">{{ selectedCurrency?.symbol }}</span> -->
                </div>
            </div>
            <div class="w-1/3">
                <label>Розничная цена</label>
                <div class="flex items-center rounded-l">
                    <input type="number" v-model="retail_price">
                    <!-- <span v-if="selectedCurrency" class="p-2 bg-gray-200 rounded-r ">{{ selectedCurrency?.symbol }}</span> -->
                </div>
            </div>
        </div>
        <div class="mt-2">
            <label>Баркод (EAN-13)</label>
            <div class="flex items-center space-x-2">
                <input type="text" v-model="barcode" :disabled="editingItemId !== null">
                <PrimaryButton v-if="editingItemId == null" icon="fas fa-barcode" :is-info="true"
                    :onclick="generateBarcode" :is-full="true"> Сгенерировать </PrimaryButton>
            </div>
        </div>
    </div>
    <!-- {{ defaultType }} -->
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <!-- <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-remove">Удалить</PrimaryButton> -->
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">Сохранить</PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="'Подтвердите удаление категории'" :confirm-text="'Удалить категорию'" :leave-text="'Отмена'" />
    <!-- Модальное окно форма создания категории -->
    <SideModalDialog :showForm="modalDialog" :onclose="closeModal" :level="1">
        <AdminCategoryCreatePage @saved="handleSaved" @saved-error="handleSavedError" />
    </SideModalDialog>
</template>


<script>
import AppController from '@/api/AppController';
import ProductController from '@/api/ProductController';
import CategoryController from '@/api/CategoryController';
import ProductDto from '@/dto/product/ProductDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import AdminCategoryCreatePage from '@/views/pages/admin/categories/AdminCategoryCreatePage.vue';

export default {
    components: {
        PrimaryButton,
        AlertDialog,
        SideModalDialog,
        AdminCategoryCreatePage
    },
    props: {
        editingItem: {
            type: ProductDto,
            required: false,
            default: null
        },
        defaultType: {
            type: String,
            required: false,
            default: 'product'
        }
    },
    data() {
        return {
            type: this.editingItem ? this.editingItem.typeName() : this.defaultType || "product",
            name: this.editingItem ? this.editingItem.name : '',
            description: this.editingItem ? this.editingItem.description : '',
            sku: this.editingItem ? this.editingItem.sku : '',
            image: this.editingItem ? this.editingItem.image : '',
            selected_image: null,
            category_id: this.editingItem ? this.editingItem.category_id : '',
            unit_id: this.editingItem ? this.editingItem.unit_id : '',
            status_id: this.editingItem ? this.editingItem.status_id : '',
            barcode: this.editingItem ? this.editingItem.barcode : '',
            retail_price: this.editingItem ? this.editingItem.retail_price : 0,
            wholesale_price: this.editingItem ? this.editingItem.wholesale_price : 0,
            purchase_price: this.editingItem ? this.editingItem.purchase_price : 0,
            // currency_id: this.editingItem ? this.editingItem.currency_id : '',
            editingItemId: this.editingItem ? this.editingItem.id : null,
            //
            currencies: [],
            units: [],
            allCategories: [],
            statuses: [],
            //
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            modalDialog: false,
        }
    },
    created() {
        this.fetchUnits();
        this.fetchCurrencies();
        this.fetchAllCategories();
        this.fetchProductStatuses();
    },
    computed: {
        selectedUnit() {
            return this.units.find(unit => unit.id == this.unit_id);
        },
        // selectedCurrency() {
        //     return this.currencies.find(currency => currency.id == this.currency_id);
        // }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error'],
    methods: {
        async fetchUnits() {
            this.units = await AppController.getUnits();
        },
        async fetchCurrencies() {
            this.currencies = await AppController.getCurrencies();
        },
        async fetchAllCategories() {
            this.allCategories = await CategoryController.getAllItems();
        },
        async fetchProductStatuses() {
            this.statuses = await AppController.getProductStatuses();
        },

        onFileChange(event) {
            const file = event.target.files[0];
            if (file) {
                this.selected_image = URL.createObjectURL(file);
            }
        },
        async save() {
            this.saveLoading = true;
            try {
                var item = {
                    type: this.type == "product" ? 1 : 0,
                    name: this.name,
                    description: this.description,
                    sku: this.sku,
                    category_id: this.category_id,
                    // currency_id: this.currency_id,
                    unit_id: this.unit_id,
                    status_id: this.status_id,
                    barcode: this.barcode,
                    retail_price: this.retail_price,
                    wholesale_price: this.wholesale_price,
                    purchase_price: this.purchase_price,
                };
                if (this.editingItemId != null) {
                    var resp = await ProductController.updateItem(
                        this.editingItemId,
                        item,
                        this.$refs.imageInput?.files[0]
                    );
                } else {
                    var resp = await ProductController.storeItem(item, this.$refs.imageInput?.files[0]);
                }
                if (resp.message) {
                    this.$emit('saved');
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('saved-error', error);
            }
            this.saveLoading = false;

        },
        async deleteItem() {
            // this.closeDeleteDialog();
            // if (this.editingItemId == null) {
            //     return;
            // }
            // this.deleteLoading = true;
            // try {
            //     var resp = await CategoryController.deleteItem(
            //         this.editingItemId);
            //     if (resp.message) {
            //         this.$emit('deleted');
            //         this.clearForm();
            //     }
            // } catch (error) {
            //     this.$emit('deleted-error', error);
            // }
            // this.deleteLoading = false;
        },
        generateBarcode() {
            const prefix = Math.floor(Math.random() * 10) + 20; // Generates a number between 20 and 29
            const ean = String(prefix) + String(Math.floor(Math.random() * 9999999999)).padStart(10, '0');
            const checksum = this.calculateEAN13Checksum(ean);
            this.barcode = ean + checksum;
        },
        calculateEAN13Checksum(ean) {
            let sum = 0;
            for (let i = 0; i < 12; i++) {
                sum += (i % 2 === 0 ? 1 : 3) * parseInt(ean[i]);
            }
            return (10 - (sum % 10)) % 10;
        },
        clearForm() {
            this.name = '';
            this.selectedUsers = [];
            this.selectedParentCategoryId = '';
            this.editingItemId = null;
            this.fetchAllCategories();
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        },
        showModal() {
            this.modalDialog = true;
        },
        closeModal() {
            this.modalDialog = false;
        },
        handleSaved() {
            this.fetchAllCategories();
            this.closeModal();
        },
        handleSavedError(m) {
            this.$emit('saved-error', error);
        },

    },
    watch: {
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.type = newEditingItem.typeName() || this.defaultType || "product";
                    this.name = newEditingItem.name || '';
                    this.description = newEditingItem.description || '';
                    this.sku = newEditingItem.sku || '';
                    this.image = newEditingItem.image || '';
                    this.category_id = newEditingItem.category_id || '';
                    this.unit_id = newEditingItem.unit_id || '';
                    this.status_id = newEditingItem.status_id || '';
                    this.barcode = newEditingItem.barcode || '';
                    this.retail_price = newEditingItem.retail_price || 0;
                    this.wholesale_price = newEditingItem.wholesale_price || 0;
                    this.purchase_price = newEditingItem.purchase_price || 0;
                    // this.currency_id = newEditingItem.currency_id || '';
                    this.editingItemId = newEditingItem.id || null;
                } else {
                    this.type = this.defaultType || "product";
                    this.name = '';
                    this.description = '';
                    this.sku = '';
                    this.image = '';
                    this.category_id = '';
                    this.unit_id = '';
                    this.status_id = '';
                    this.barcode = '';
                    this.retail_price = 0;
                    this.wholesale_price = 0;
                    this.purchase_price = 0;
                    // this.currency_id = '';
                    this.editingItemId = null;
                    this.selected_image = null;
                }
            },
            deep: true,
            immediate: true
        }
    }
}

</script>

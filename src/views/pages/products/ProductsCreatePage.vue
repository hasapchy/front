<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">Товар | Услуга</h2>

        <div class="mt-2 flex items-center">
            <div>
                <div class="mt-2">
                    <label class="block mb-1 required">Тип</label>
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
                    <label class="required">Название</label>
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
            <label class="block mb-1 required">Категория</label>
            <div class="flex items-center space-x-2">
                <select v-model="category_id" v-if="allCategories.length">
                    <option value="">Нет</option>
                    <option v-for="parent in allCategories" :key="parent.id" :value="parent.id">{{
                        parent.name }}
                    </option>
                </select>
                <select v-model="category_id" v-else>
                    <option value="">Нет</option>
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
            <select v-model="unit_id" v-if="units.length">
                <option value="">Нет</option>
                <option v-for="parent in units" :key="parent.id" :value="parent.id">{{ parent.name }} ({{
                    parent.short_name }})
                </option>
            </select>
            <select v-model="unit_id" v-else>
                <option value="">Нет</option>
            </select>
        </div>
        <div class="mt-2">
            <label class="required">Артикул</label>
            <input type="text" v-model="sku" :disabled="editingItemId !== null">
        </div>
        <div class="mt-2 flex space-x-2">
            <div class="w-1/3">
                <label>Закупочная цена</label>
                <div class="flex items-center rounded-l">
                    <input type="number" v-model="purchase_price">
                </div>
            </div>
            <div class="w-1/3">
                <label>Оптовая цена</label>
                <div class="flex items-center rounded-l">
                    <input type="number" v-model="wholesale_price">
                </div>
            </div>
            <div class="w-1/3">
                <label>Розничная цена</label>
                <div class="flex items-center rounded-l">
                    <input type="number" v-model="retail_price">
                </div>
            </div>
        </div>
        <div class="mt-2">
            <label>Баркод (EAN-13)</label>
            <div class="flex items-center space-x-2">
                <input type="text" v-model="barcode" :disabled="editingItemId !== null">
                <PrimaryButton v-if="editingItemId == null" icon="fas fa-barcode" :is-info="true"
                    :onclick="generateBarcode" :is-full="false">
                </PrimaryButton>
                <template v-if="barcode">
                    <svg id="barcode-svg" class="w-32 h-12" />
                    <canvas id="barcode-canvas" style="display:none;"></canvas>
                    <PrimaryButton @click="downloadBarcodePng" icon="fas fa-download" :is-info="true">
                    </PrimaryButton>
                </template>
            </div>
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-remove"
            :disabled="!$store.getters.hasPermission('products_delete')">
            Удалить
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('products_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('products_create'))">
            Сохранить
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="'Подтвердите удаление категории'" :confirm-text="'Удалить категорию'" :leave-text="'Отмена'" />
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
import AdminCategoryCreatePage from '@/views/pages/categories/CategoriesCreatePage.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import modalMixin from '@/mixins/modalMixin';
import JsBarcode from "jsbarcode";

export default {
    mixins: [getApiErrorMessage, modalMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error'],
    components: { PrimaryButton, AlertDialog, SideModalDialog, AdminCategoryCreatePage },
    props: {
        editingItem: { type: ProductDto, required: false, default: null },
        defaultType: { type: String, required: false, default: 'product' },
        defaultName: { type: String, required: false, default: '' }
    },
    data() {
        return {
            type: this.editingItem ? this.editingItem.typeName() : this.defaultType || "product",
            name: this.editingItem ? this.editingItem.name : this.defaultName || '',
            description: this.editingItem ? this.editingItem.description : '',
            sku: this.editingItem ? this.editingItem.sku : '',
            image: this.editingItem ? this.editingItem.image : '',
            selected_image: null,
            category_id: this.editingItem ? this.editingItem.category_id : '',
            unit_id: this.editingItem ? this.editingItem.unit_id : '',
            barcode: this.editingItem ? this.editingItem.barcode : '',
            retail_price: this.editingItem ? this.editingItem.retail_price : 0,
            wholesale_price: this.editingItem ? this.editingItem.wholesale_price : 0,
            purchase_price: this.editingItem ? this.editingItem.purchase_price : 0,
            editingItemId: this.editingItem ? this.editingItem.id : null,
            currencies: [],
            units: [],
            allCategories: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
        }
    },
    created() {
        this.fetchUnits();
        this.fetchCurrencies();
        this.fetchAllCategories();
    },
    computed: {
        selectedUnit() {
            return this.units.find(unit => unit.id == this.unit_id);
        },

    },
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
                    unit_id: this.unit_id,
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
                    this.$emit('saved', resp.item || item);
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('saved-error', this.getApiErrorMessage(error));
            }
            this.saveLoading = false;

        },
        async deleteItem() {
            this.closeDeleteDialog();
            if (this.editingItemId == null) {
                return;
            }
            this.deleteLoading = true;
            try {
                const resp = await ProductController.deleteItem(this.editingItemId);
                if (resp.message) {
                    this.$emit('deleted');
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('deleted-error', this.getApiErrorMessage(error));
            }
            this.deleteLoading = false;
        },
        generateBarcode() {
            const prefix = Math.floor(Math.random() * 10) + 20;
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
        renderBarcodeToCanvas(code) {
            const svg = document.getElementById("barcode-svg");
            const serializer = new XMLSerializer();
            const svgStr = serializer.serializeToString(svg);
            const img = new window.Image();
            const svg64 = btoa(unescape(encodeURIComponent(svgStr)));
            const image64 = 'data:image/svg+xml;base64,' + svg64;

            img.onload = function () {
                const canvas = document.getElementById("barcode-canvas");
                canvas.width = svg.width.baseVal.value || 300;
                canvas.height = svg.height.baseVal.value || 100;
                const ctx = canvas.getContext("2d");
                ctx.fillStyle = "#fff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = image64;
        },
        downloadBarcodePng() {
            const canvas = document.getElementById("barcode-canvas");
            const pngUrl = canvas.toDataURL("image/png");
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = `barcode_${this.barcode}.png`;
            a.click();
        },
        clearForm() {
            this.type = this.defaultType || "product";
            this.name = '';
            this.description = '';
            this.sku = '';
            this.image = null;
            this.selected_image = null;
            this.category_id = '';
            this.unit_id = '';
            this.barcode = '';
            this.retail_price = 0;
            this.wholesale_price = 0;
            this.purchase_price = 0;
            this.editingItemId = null;
            if (this.$refs.imageInput) {
                this.$refs.imageInput.value = null;
            }
            this.fetchAllCategories();
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        },
        // showModal() {
        //     this.modalDialog = true;
        // },
        handleSaved() {
            this.fetchAllCategories();
            this.closeModal();
        },
        handleSavedError(m) {
            this.$emit('saved-error', this.getApiErrorMessage(error));
        },
    },
    watch: {
        defaultName(newVal) {
            if (!this.editingItem && !this.editingItemId) {
                this.name = newVal || '';
            }
        },
        barcode(newVal) {
            if (newVal) {
                this.$nextTick(() => {
                    JsBarcode("#barcode-svg", newVal, { format: "ean13", displayValue: true });
                    this.renderBarcodeToCanvas(newVal);
                });
            }
        },
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
                    this.barcode = newEditingItem.barcode || '';
                    this.retail_price = newEditingItem.retail_price || 0;
                    this.wholesale_price = newEditingItem.wholesale_price || 0;
                    this.purchase_price = newEditingItem.purchase_price || 0;
                    this.editingItemId = newEditingItem.id || null;
                } else {
                    this.type = this.defaultType || "product";
                    this.name = '';
                    this.description = '';
                    this.sku = '';
                    this.image = '';
                    this.category_id = '';
                    this.unit_id = '';
                    this.barcode = '';
                    this.retail_price = 0;
                    this.wholesale_price = 0;
                    this.purchase_price = 0;
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

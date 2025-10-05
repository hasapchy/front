<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editProduct') : $t('createProduct') }}</h2>

        <div class="mt-2 flex items-start">
            <div class="flex-1">
                <div class="mt-2">
                    <label class="block mb-1 required">{{ $t('type') }}</label>
                    <select v-model="type">
                        <option value="">{{ $t('selectType') }}</option>
                        <option value="product">{{ $t('product') }}</option>
                        <option value="service">{{ $t('service') }}</option>
                    </select>
                </div>
                <div class="mt-2">
                    <label class="required">{{ $t('name') }}</label>
                    <input type="text" v-model="name" class="">
                </div>
                <div class="mt-2">
                    <label>{{ $t('description') }}</label>
                    <input type="text" v-model="description">
                </div>
            </div>
            <div class="ml-3 w-40 flex flex-col">
                <label class="block mb-1">{{ $t('image') }}</label>
                <input type="file" @change="onFileChange" ref="imageInput" class="hidden" accept="image/*">

                <div v-if="selected_image"
                    class="h-40 p-3 bg-gray-100 rounded border relative flex items-center justify-center overflow-hidden">
                    <img :src="selected_image" alt="Selected Image"
                        class="max-w-full max-h-full object-contain rounded">
                    <button @click="() => { this.selected_image = null; this.image = null }"
                        class="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div v-else-if="editingItem?.image"
                    class="h-40 p-3 bg-gray-100 rounded border relative flex items-center justify-center overflow-hidden">
                    <img :src="getProductImageSrc(editingItem)" alt="Selected Image"
                        class="max-w-full max-h-full object-contain rounded">
                    <button @click="() => { this.editingItem.image = '' }"
                        class="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div v-else @click="$refs.imageInput.click()"
                    class="h-40 p-3 bg-gray-100 rounded border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <div class="w-full h-full flex flex-col items-center justify-center bg-white rounded">
                        <img src="/logo.jpg" alt="Placeholder" class="w-16 h-16 object-contain opacity-50">
                        <span class="text-xs text-gray-500 mt-2 text-center">{{ $t('clickToUploadImage') }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="mt-2">
            <label class="block mb-1 required">{{ $t('category') }}</label>

            <!-- Каскадный селектор -->
            <div class="space-y-2">
                <!-- Селектор для выбора основной категории -->
                <div class="flex items-center space-x-2">
                    <select v-model="selectedParentCategory" @change="onParentCategoryChange" class="flex-1">
                        <option value="">{{ $t('selectMainCategory') }}</option>
                        <option v-for="parent in parentCategories" :key="parent.id" :value="parent.id">
                            {{ parent.name }}
                        </option>
                    </select>
                    <PrimaryButton icon="fas fa-plus" :is-info="true" :onclick="showModal"
                        :disabled="!$store.getters.hasPermission('categories_create')" />
                </div>

                <!-- Компактное отображение подкатегорий -->
                <div v-if="selectedParentCategory && childCategories.length > 0"
                    class="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div class="flex items-center justify-between mb-2">
                        <label class="text-sm font-medium text-blue-800">
                            <i class="fas fa-folder-tree mr-1"></i>
                            {{ $t('subCategories') }}: {{ getParentCategoryName(selectedParentCategory) }}
                        </label>
                        <div class="flex space-x-1">
                            <button @click="selectAllSubCategories"
                                class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                                <i class="fas fa-check-double mr-1"></i>{{ $t('selectAll') }}
                            </button>
                            <button @click="deselectAllSubCategories"
                                class="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors">
                                <i class="fas fa-times mr-1"></i>{{ $t('deselectAll') }}
                            </button>
                        </div>
                    </div>

                    <!-- Компактная сетка подкатегорий -->
                    <div
                        class="grid grid-cols-3 gap-1 max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        <label v-for="child in childCategories" :key="child.id"
                            class="flex items-center space-x-1 text-xs cursor-pointer hover:bg-blue-100 p-1 rounded transition-colors"
                            :class="{ 'bg-blue-200': selectedSubCategories.includes(child.id) }">
                            <input type="checkbox" :value="child.id" v-model="selectedSubCategories"
                                @change="onSubCategoryChange" class="text-blue-600 w-3 h-3">
                            <span class="truncate" :title="child.name">{{ child.name }}</span>
                        </label>
                    </div>

                    <!-- Счетчик выбранных -->
                    <div v-if="selectedSubCategories.length > 0" class="mt-2 text-xs text-blue-600">
                        <i class="fas fa-info-circle mr-1"></i>
                        Выбрано: {{ selectedSubCategories.length }} из {{ childCategories.length }}
                    </div>
                </div>
            </div>

            <!-- Компактное отображение выбранных категорий -->
            <div v-if="selectedCategories.length > 0" class="mt-3">
                <div class="flex items-center justify-between mb-2">
                    <label class="text-sm font-medium text-gray-700">
                        <i class="fas fa-tags mr-1"></i>{{ $t('selectedCategories') }}
                    </label>
                    <span class="text-xs text-gray-500">{{ selectedCategories.length }} {{ $t('categoriesCount')
                        }}</span>
                </div>
                <div class="flex flex-wrap gap-1">
                    <div v-for="(category, index) in selectedCategories" :key="category.id"
                        class="flex items-center bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 px-2 py-1 rounded-full text-xs border border-blue-200">
                        <span v-if="category.is_primary"
                            class="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full mr-1 font-medium">
                            <i class="fas fa-star mr-0.5"></i>Основная
                        </span>
                        <span class="truncate max-w-32" :title="category.name">{{ category.name }}</span>
                        <button @click="removeCategory(index)"
                            class="ml-1 text-red-500 hover:text-red-700 transition-colors">
                            <i class="fas fa-times text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div class=" mt-2">
            <label class="block mb-1">{{ $t('unit') }}</label>
            <select v-model="unit_id" v-if="units.length">
                <option value="">{{ $t('noUnit') }}</option>
                <option v-for="parent in units" :key="parent.id" :value="parent.id">{{ parent.name }} ({{
                    parent.short_name }})
                </option>
            </select>
            <select v-model="unit_id" v-else>
                <option value="">{{ $t('noUnit') }}</option>
            </select>
        </div>
        <div class="mt-2">
            <label class="required">{{ $t('sku') }}</label>
            <input type="text" v-model="sku" placeholder="AB00001">
        </div>
        <div class="mt-2 flex space-x-2">
            <div class="w-1/3">
                <label>{{ $t('purchasePrice') }}</label>
                <div class="flex items-center rounded-l">
                    <input type="number" v-model="purchase_price">
                </div>
            </div>
            <div class="w-1/3">
                <label>{{ $t('wholesalePrice') }}</label>
                <div class="flex items-center rounded-l">
                    <input type="number" v-model="wholesale_price">
                </div>
            </div>
            <div class="w-1/3">
                <label>{{ $t('retailPrice') }}</label>
                <div class="flex items-center rounded-l">
                    <input type="number" v-model="retail_price">
                </div>
            </div>
        </div>
        <div class="mt-2">
            <label>{{ $t('barcode') }}</label>
            <div class="flex items-center space-x-2">
                <input type="text" v-model="barcode">
                <PrimaryButton v-if="!barcode" icon="fas fa-barcode" :is-info="true" :onclick="generateBarcode"
                    :is-full="false">
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
            :is-loading="deleteLoading" icon="fas fa-trash"
            :disabled="!$store.getters.hasPermission('products_delete')">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="!isFormValid || (editingItemId != null && !$store.getters.hasPermission('products_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('products_create'))">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog" :descr="$t('deleteCategory')"
        :confirm-text="$t('deleteCategory')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose" :descr="$t('unsavedChanges')"
        :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
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

import formChangesMixin from '@/mixins/formChangesMixin';
import JsBarcode from "jsbarcode";

export default {
    mixins: [getApiErrorMessage, formChangesMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
    components: { PrimaryButton, AlertDialog, SideModalDialog, AdminCategoryCreatePage },
    props: {
        editingItem: { type: Object, required: false, default: null },
        defaultType: { type: String, required: false, default: 'product' },
        defaultName: { type: String, required: false, default: '' }
    },
    data() {
        return {
            type: this.defaultType || "product",
            name: this.defaultName || '',
            description: '',
            sku: '',
            image: '',
            selected_image: null,
            category_id: '',
            selectedParentCategory: '', // Выбранная родительская категория
            selectedSubCategories: [], // Выбранные подкатегории (массив ID)
            selectedCategories: [], // Массив выбранных категорий
            unit_id: '',
            barcode: '',
            retail_price: 0,
            wholesale_price: 0,
            purchase_price: 0,
            editingItemId: null,
            currencies: [],
            units: [],
            allCategories: [],
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            modalDialog: false,
        }
    },
    mounted() {
        this.$nextTick(async () => {
            await Promise.all([
                this.fetchUnits(),
                this.fetchCurrencies(),
                this.fetchAllCategories()
            ]);

            this.saveInitialState();
        });
    },
    computed: {
        selectedUnit() {
            return this.units.find(unit => unit.id == this.unit_id);
        },

        // Разделяем категории на родительские и дочерние
        parentCategories() {
            const parents = this.allCategories.filter(cat => {
                // Используем правильное поле parentId из CategoryDto
                const parentId = cat.parentId;
                return parentId === null || 
                       parentId === undefined || 
                       parentId === 0 || 
                       parentId === '0' ||
                       parentId === 'null' || 
                       parentId === '' ||
                       parentId === false;
            });
            return parents;
        },
        
        childCategories() {
            if (!this.selectedParentCategory) return [];
            const children = this.allCategories.filter(cat => cat.parentId == this.selectedParentCategory);
            return children;
        },

        // Валидация формы
        isFormValid() {
            return this.name && this.name.trim() !== '' && 
                   this.sku && this.sku.trim() !== '' &&
                   this.selectedCategories.length > 0;
        },
    },
    methods: {
        async fetchUnits() {
            // Используем данные из store
            if (this.$store.getters.units.length > 0) {
                this.units = this.$store.getters.units;
            } else {
                await this.$store.dispatch('loadUnits');
                this.units = this.$store.getters.units;
            }
        },
        async fetchCurrencies() {
            // Используем данные из store
            if (this.$store.getters.currencies.length > 0) {
                this.currencies = this.$store.getters.currencies;
            } else {
                await this.$store.dispatch('loadCurrencies');
                this.currencies = this.$store.getters.currencies;
            }
        },
        async fetchAllCategories() {
            // Используем данные из store
            if (this.$store.getters.categories.length > 0) {
                this.allCategories = this.$store.getters.categories;
            } else {
                await this.$store.dispatch('loadCategories');
                this.allCategories = this.$store.getters.categories;
            }
        },

        // Методы для работы с каскадным выбором категорий
        onParentCategoryChange() {
            if (this.selectedParentCategory) {
                // Автоматически добавляем основную категорию
                this.addParentCategory();
                // Автоматически выбираем все подкатегории
                this.selectAllSubCategories();
            } else {
                // Сбрасываем выбор подкатегорий при смене родительской
                this.selectedSubCategories = [];
            }
        },

        addParentCategory() {
            if (this.selectedParentCategory && !this.selectedCategories.find(cat => cat.id == this.selectedParentCategory)) {
                const category = this.allCategories.find(cat => cat.id == this.selectedParentCategory);
                if (category) {
                    // Родительская категория всегда основная
                    this.selectedCategories.push({
                        id: parseInt(category.id),
                        name: category.name,
                        is_primary: true // Родительская категория всегда основная
                    });
                }
            }
        },

        onSubCategoryChange() {
            // Если выбрана хотя бы одна подкатегория, добавляем основную категорию
            if (this.selectedSubCategories.length > 0) {
                this.addParentCategory();
            }
            // Обновляем выбранные подкатегории
            this.updateSelectedCategories();
        },

        selectAllSubCategories() {
            this.selectedSubCategories = this.childCategories.map(cat => cat.id);
            this.updateSelectedCategories();
        },

        deselectAllSubCategories() {
            this.selectedSubCategories = [];
            this.updateSelectedCategories();
        },

        updateSelectedCategories() {
            // Удаляем все подкатегории выбранной родительской категории
            this.selectedCategories = this.selectedCategories.filter(cat => {
                const category = this.allCategories.find(c => c.id == cat.id);
                return !category || category.parentId != this.selectedParentCategory;
            });

            // Добавляем выбранные подкатегории (всегда не основные)
            this.selectedSubCategories.forEach(subCategoryId => {
                const category = this.allCategories.find(cat => cat.id == subCategoryId);
                if (category && !this.selectedCategories.find(cat => cat.id == category.id)) {
                    this.selectedCategories.push({
                        id: parseInt(category.id),
                        name: category.name,
                        is_primary: false // Подкатегории никогда не основные
                    });
                }
            });
        },

        updateSelectedSubCategoriesFromSelected() {
            // Обновляем selectedSubCategories на основе selectedCategories
            const subCategories = this.selectedCategories.filter(cat => {
                const category = this.allCategories.find(c => c.id == cat.id);
                return category && category.parentId;
            });

            this.selectedSubCategories = subCategories.map(cat => cat.id);

            // Обновляем selectedParentCategory если есть подкатегории
            if (subCategories.length > 0) {
                const firstSubCategory = this.allCategories.find(cat => cat.id == subCategories[0].id);
                if (firstSubCategory) {
                    this.selectedParentCategory = firstSubCategory.parentId;
                }
            }
        },

        getParentCategoryName(parentId) {
            const parent = this.allCategories.find(cat => cat.id == parentId);
            return parent ? parent.name : '';
        },

        removeCategory(index) {
            const removedCategory = this.selectedCategories[index];

            // Если удалили основную категорию (родительскую), удаляем ВСЕ её подкатегории
            if (removedCategory.is_primary) {
                // Находим ID родительской категории
                const parentId = removedCategory.id;

                // Удаляем основную категорию
                this.selectedCategories.splice(index, 1);

                // Удаляем все её подкатегории
                this.selectedCategories = this.selectedCategories.filter(cat => {
                    const category = this.allCategories.find(c => c.id == cat.id);
                    return !category || category.parentId != parentId;
                });

                // Сбрасываем выбор подкатегорий в интерфейсе
                this.selectedSubCategories = [];
                this.selectedParentCategory = '';

                // Обновляем selectedSubCategories на основе оставшихся selectedCategories
                this.updateSelectedSubCategoriesFromSelected();
            } else {
                // Если удалили подкатегорию, просто удаляем её
                this.selectedCategories.splice(index, 1);

                // Обновляем selectedSubCategories
                this.updateSelectedSubCategoriesFromSelected();
            }
        },

        setPrimaryCategory(index) {
            // Убираем флаг основной со всех категорий
            this.selectedCategories.forEach(cat => cat.is_primary = false);
            // Устанавливаем новую основную
            this.selectedCategories[index].is_primary = true;
        },

        onFileChange(event) {
            const file = event.target.files[0];
            if (file) {
                // Проверяем, что файл является изображением
                if (!file.type.startsWith('image/')) {
                    alert(this.$t('onlyImagesAllowed'));
                    // Очищаем input
                    event.target.value = '';
                    return;
                }
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
                    // Для обратной совместимости отправляем основную категорию
                    category_id: this.selectedCategories.find(cat => cat.is_primary)?.id || this.category_id,
                    // Отправляем массив категорий
                    categories: this.selectedCategories.length > 0 ? this.selectedCategories.map(cat => cat.id) : [],
                    unit_id: this.unit_id,
                    barcode: this.barcode,
                    retail_price: parseFloat(this.retail_price) || 0,
                    wholesale_price: parseFloat(this.wholesale_price) || 0,
                    purchase_price: parseFloat(this.purchase_price) || 0,
                };
                if (this.editingItemId != null) {
                    const itemId = this.editingItem && this.editingItem.productId ? this.editingItem.productId : this.editingItemId;
                    var resp = await ProductController.updateItem(
                        itemId,
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
                const itemId = this.editingItem && this.editingItem.productId ? this.editingItem.productId : this.editingItemId;
                const resp = await ProductController.deleteItem(itemId);
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
            this.selectedParentCategory = '';
            this.selectedSubCategories = [];
            this.selectedCategories = [];
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
            this.resetFormChanges();
        },
        // Переопределяем метод closeForm из mixin, чтобы очищать форму при закрытии
        closeForm() {
            this.clearForm();
            this.$emit('close-request');
        },
        getFormState() {
            return {
                type: this.type,
                name: this.name,
                description: this.description,
                sku: this.sku,
                image: this.image,
                selected_image: this.selected_image,
                category_id: this.category_id,
                selectedParentCategory: this.selectedParentCategory,
                selectedCategories: this.selectedCategories,
                unit_id: this.unit_id,
                barcode: this.barcode,
                retail_price: this.retail_price,
                wholesale_price: this.wholesale_price,
                purchase_price: this.purchase_price,
            };
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
            this.$emit('saved-error', this.getApiErrorMessage(error));
        },
        getProductImageSrc(item) {
            if (!item) return '';
            if (item.imgUrl) return item.imgUrl();
            if (item.productImage)
                return import.meta.env.VITE_APP_BASE_URL + '/storage/' + item.productImage;
            return '';
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
                    this.type = newEditingItem.typeName ? newEditingItem.typeName() : 'product';
                    this.name = newEditingItem.name || newEditingItem.productName || '';
                    this.description = newEditingItem.description || '';
                    this.sku = newEditingItem.sku || '';
                    this.image = newEditingItem.image || newEditingItem.productImage || '';
                    this.category_id = newEditingItem.category_id || newEditingItem.categoryId || '';

                    // Загружаем множественные категории
                    if (newEditingItem.categories && newEditingItem.categories.length > 0) {
                        // Определяем родительские категории и подкатегории
                        let parentCategories = [];
                        let subCategories = [];

                        newEditingItem.categories.forEach(cat => {
                            const category = this.allCategories.find(c => c.id == cat.id);
                            if (category) {
                                if (!category.parentId) {
                                    // Это родительская категория
                                    parentCategories.push({
                                        id: parseInt(cat.id),
                                        name: cat.name,
                                        is_primary: true
                                    });
                                } else {
                                    // Это подкатегория
                                    subCategories.push({
                                        id: parseInt(cat.id),
                                        name: cat.name,
                                        is_primary: false
                                    });
                                }
                            }
                        });

                        // Собираем все категории: сначала родительские, потом подкатегории
                        this.selectedCategories = parentCategories.concat(subCategories);

                        // Устанавливаем первую родительскую категорию для селектора
                        if (parentCategories.length > 0) {
                            this.selectedParentCategory = parentCategories[0].id;
                        }

                        // Устанавливаем выбранные подкатегории
                        this.selectedSubCategories = subCategories.map(cat => cat.id);
                    } else {
                        // Для обратной совместимости
                        this.selectedCategories = [];
                        if (this.category_id) {
                            const category = this.allCategories.find(cat => cat.id == this.category_id);
                            if (category) {
                                if (!category.parentId) {
                                    // Это родительская категория
                                    this.selectedCategories = [{
                                        id: parseInt(category.id),
                                        name: category.name,
                                        is_primary: true
                                    }];
                                    this.selectedParentCategory = category.id;
                                } else {
                                    // Это подкатегория, нужно найти родительскую
                                    const parentCategory = this.allCategories.find(cat => cat.id == category.parentId);
                                    if (parentCategory) {
                                        this.selectedCategories = [
                                            {
                                                id: parseInt(parentCategory.id),
                                                name: parentCategory.name,
                                                is_primary: true
                                            },
                                            {
                                                id: parseInt(category.id),
                                                name: category.name,
                                                is_primary: false
                                            }
                                        ];
                                        this.selectedParentCategory = parentCategory.id;
                                        this.selectedSubCategories = [category.id];
                                    }
                                }
                            }
                        }
                    }

                    this.unit_id = newEditingItem.unit_id || newEditingItem.unitId || '';
                    this.barcode = newEditingItem.barcode || '';
                    this.retail_price = newEditingItem.retail_price !== undefined ? newEditingItem.retail_price : 0;
                    this.wholesale_price = newEditingItem.wholesale_price !== undefined ? newEditingItem.wholesale_price : 0;
                    this.purchase_price = newEditingItem.purchase_price !== undefined ? newEditingItem.purchase_price : 0;
                    this.editingItemId = newEditingItem.id || newEditingItem.productId || null;
                } else {
                    this.type = 'product';
                    this.name = '';
                    this.description = '';
                    this.sku = '';
                    this.image = '';
                    this.category_id = '';
                    this.selectedParentCategory = '';
                    this.selectedCategories = [];
                    this.unit_id = '';
                    this.barcode = '';
                    this.retail_price = 0;
                    this.wholesale_price = 0;
                    this.purchase_price = 0;
                    this.editingItemId = null;
                    this.selected_image = null;
                }
                this.$nextTick(() => {
                    this.saveInitialState();
                });
            },
            deep: true,
            immediate: true
        }
    }
}

</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="flex min-h-0 flex-1 flex-col overflow-auto p-4">
      <TabBar
        :key="`tabs-${$i18n.locale}`"
        :tabs="translatedTabs"
        :active-tab="currentTab"
        :tab-click="changeTab"
      />

      <div v-show="currentTab === 'info'">
        <div class="mt-2 flex items-start">
          <div class="flex-1">
            <div
              v-if="!defaultType"
              class="mt-2"
            >
              <label class="block mb-1 required">{{ $t('type') }}</label>
              <select v-model="type">
                <option value="">
                  {{ $t('selectType') }}
                </option>
                <option value="product">
                  {{ $t('product') }}
                </option>
                <option value="service">
                  {{ $t('service') }}
                </option>
              </select>
            </div>
            <div class="mt-2">
              <label class="required">{{ $t('name') }}</label>
              <input
                v-model="name"
                type="text"
                class=""
              >
            </div>
            <div class="mt-2">
              <label>{{ $t('description') }}</label>
              <input
                v-model="description"
                type="text"
              >
            </div>
          </div>
          <div class="ml-3 w-40 flex flex-col">
            <label class="block mb-1">{{ $t('image') }}</label>
            <input
              ref="imageInput"
              type="file"
              class="hidden"
              accept="image/*"
              @change="onFileChange"
            >

            <div
              v-if="selectedImage"
              class="h-40 p-3 bg-gray-100 rounded border relative flex items-center justify-center overflow-hidden"
            >
              <img
                :src="selectedImage"
                alt="Selected Image"
                class="max-w-full max-h-full object-contain rounded"
              >
              <button
                class="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                @click="() => { selectedImage = null; image = null }"
              >
                <i class="fas fa-trash" />
              </button>
            </div>
            <div
              v-else-if="editingItem?.image && !existingImageCleared"
              class="h-40 p-3 bg-gray-100 rounded border relative flex items-center justify-center overflow-hidden"
            >
              <img
                :src="getProductImageSrc(editingItem)"
                alt="Selected Image"
                class="max-w-full max-h-full object-contain rounded"
              >
              <button
                class="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                @click="existingImageCleared = true"
              >
                <i class="fas fa-trash" />
              </button>
            </div>
            <div
              v-else
              class="h-40 p-3 bg-gray-100 rounded border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              @click="$refs.imageInput.click()"
            >
              <div class="w-full h-full flex flex-col items-center justify-center bg-white rounded">
                <img
                  src="/logo.png"
                  alt="Placeholder"
                  class="w-16 h-16 object-contain opacity-50"
                >
                <span class="text-xs text-gray-500 mt-2 text-center">{{ $t('clickToUploadImage') }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-2">
          <label class="block mb-2 required">{{ $t('category') }}</label>
          <div class="flex items-center space-x-2">
            <div class="flex-1 h-8 flex items-center min-w-0 products-category-filter">
              <CheckboxFilter
                v-if="categoryOptions.length"
                v-model="selectedCategoryIds"
                :options="categoryOptions"
                :placeholder="'selectCategories'"
                :single-line-preview="true"
                @update:model-value="onCategoriesChange"
              />
            </div>
            <PrimaryButton
              icon="fas fa-plus"
              :is-success="true"
              :onclick="showModal"
              :disabled="!$store.getters.hasPermission('categories_create')"
              :aria-label="$t('add')"
            />
          </div>
        </div>
        <div class="mt-2">
          <label class="block mb-1">{{ $t('unit') }}</label>
          <select
            v-if="units.length"
            v-model="unitId"
          >
            <option value="">
              {{ $t('noUnit') }}
            </option>
            <option
              v-for="parent in units"
              :key="parent.id"
              :value="parent.id"
            >
              {{ parent.name }} ({{ parent.shortName }})
            </option>
          </select>
          <select
            v-else
            v-model="unitId"
          >
            <option value="">
              {{ $t('noUnit') }}
            </option>
          </select>
        </div>
        <div class="mt-2">
          <label class="block mb-1 required">{{ $t('sku') }}</label>
          <input
            v-model="sku"
            type="text"
            placeholder="AB00001"
            class="w-full"
          >
        </div>
        <div class="mt-2 flex space-x-2">
          <div class="w-1/3">
            <label>{{ $t('purchasePrice') }}</label>
            <div class="flex items-center rounded-l">
              <input
                v-model="purchasePrice"
                type="number"
              >
            </div>
          </div>
          <div class="w-1/3">
            <label>{{ $t('wholesalePrice') }}</label>
            <div class="flex items-center rounded-l">
              <input
                v-model="wholesalePrice"
                type="number"
              >
            </div>
          </div>
          <div class="w-1/3">
            <label>{{ $t('retailPrice') }}</label>
            <div class="flex items-center rounded-l">
              <input
                v-model="retailPrice"
                type="number"
              >
            </div>
          </div>
        </div>
        <div class="mt-2">
          <label>{{ $t('barcode') }}</label>
          <div class="flex items-center space-x-2">
            <input
              v-model="barcode"
              type="text"
            >
            <PrimaryButton
              v-if="!barcode"
              icon="fas fa-barcode"
              :is-info="true"
              :onclick="generateBarcode"
              :is-full="false"
              :aria-label="$t('generateBarcode')"
            />
            <template v-if="barcode">
              <svg
                id="barcode-svg"
                class="w-32 h-12"
              />
              <canvas
                id="barcode-canvas"
                style="display:none;"
              />
              <PrimaryButton
                icon="fas fa-download"
                :is-info="true"
                :aria-label="$t('downloadBarcode')"
                @click="downloadBarcodePng"
              />
            </template>
          </div>
        </div>
      </div>

      <div
        v-show="currentTab === 'history'"
        class="mt-4"
      >
        <ProductHistoryTab
          v-if="editingItemId"
          :product-id="editingItemId"
        />
        <div
          v-else
          class="text-gray-500 py-8 text-center"
        >
          {{ $t('saveProductFirst') }}
        </div>
      </div>
    </div>

    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton
          v-if="editingItem != null"
          :onclick="showDeleteDialog"
          :is-danger="true"
          :is-loading="deleteLoading"
          icon="fas fa-trash"
          :disabled="!$store.getters.hasPermission('products_delete')"
          :aria-label="$t('delete')"
        />
        <PrimaryButton
          icon="fas fa-save"
          :onclick="save"
          :is-loading="saveLoading"
          :disabled="!isFormValid || (editingItemId != null && !$store.getters.hasPermission('products_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('products_create'))"
          :aria-label="$t('save')"
        />
      </div>
    </teleport>
        
    <AlertDialog
      :dialog="deleteDialog"
      :descr="$t('deleteCategory')"
      :confirm-text="$t('deleteCategory')"
      :leave-text="$t('cancel')"
      @confirm="deleteItem"
      @leave="closeDeleteDialog"
    />
    <AlertDialog
      :dialog="closeConfirmDialog"
      :descr="$t('unsavedChanges')"
      :confirm-text="$t('closeWithoutSaving')"
      :leave-text="$t('stay')"
      @confirm="confirmClose"
      @leave="cancelClose"
    />
    <SideModalDialog
      :show-form="modalDialog"
      :title="nestedCategoryModalTitle"
      :onclose="closeModal"
      :level="4"
    >
      <AdminCategoryCreatePage
        @saved="handleSaved"
        @saved-error="handleSavedError"
      />
    </SideModalDialog>
  </div>
</template>


<script>
import ProductController from '@/api/ProductController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import SideModalDialog, { sideModalCrudTitle, sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import AdminCategoryCreatePage from '@/views/pages/categories/CategoriesCreatePage.vue';
import CheckboxFilter from '@/views/components/app/forms/CheckboxFilter.vue';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import ProductHistoryTab from '@/views/pages/products/ProductHistoryTab.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import { CacheInvalidator } from '@/cache';

export default {
    components: { PrimaryButton, AlertDialog, SideModalDialog, AdminCategoryCreatePage, CheckboxFilter, TabBar, ProductHistoryTab },
    mixins: [getApiErrorMessage, crudFormMixin, sideModalFooterPortal],
    props: {
        editingItem: { type: Object, required: false, default: null },
        defaultType: { type: String, required: false, default: 'product' },
        defaultName: { type: String, required: false, default: '' }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
    data() {
        return {
            type: this.defaultType || "product",
            name: this.defaultName ,
            description: '',
            sku: '',
            image: '',
            selectedImage: null,
            existingImageCleared: false,
            categoryId: '',
            selectedCategoryIds: [],
            selectedCategories: [],
            unitId: '',
            barcode: '',
            retailPrice: 0,
            wholesalePrice: 0,
            purchasePrice: 0,
            units: [],
            allCategories: [],
            modalDialog: false,
            currentTab: 'info',
            jsBarcodeLib: null,
            tabs: [
                { name: 'info', label: 'info' },
                { name: 'history', label: 'history' }
            ]
        }
    },
    computed: {
        translatedTabs() {
            let visibleTabs = this.editingItemId ? this.tabs : this.tabs.filter(t => t.name === 'info');
            return visibleTabs.map(tab => ({ ...tab, label: this.$t(tab.label) }));
        },
        categoryOptions() {
            return this.allCategories.map(cat => {
                const parent = cat.parentId ? this.allCategories.find(c => c.id == cat.parentId) : null;
                const label = parent ? `${cat.name} (${parent.name})` : cat.name;
                return {
                    value: cat.id.toString(),
                    label: label
                };
            });
        },

        isFormValid() {
            const isValid = this.name && this.name.trim() !== '' &&
                this.sku && this.sku.trim() !== '' &&
                this.selectedCategoryIds?.length > 0;
            return isValid;
        },
        nestedCategoryModalTitle() {
            return sideModalCrudTitle(this.$t.bind(this), {
                item: null,
                entityGenitiveKey: 'sideModalGenCategory',
                entityNominativeKey: 'sideModalNomCategory',
            });
        },
    },
    watch: {
        defaultName(newVal) {
            if (!this.editingItem && !this.editingItemId) {
                this.name = newVal ;
            }
        },
        barcode(newVal) {
            if (newVal) {
                this.$nextTick(() => {
                    this.renderBarcode(newVal);
                });
            }
        },
        defaultType(newVal) {
            if (newVal) {
                this.type = newVal;
            }
        }
    },
    mounted() {
        this.$nextTick(async () => {
            await Promise.all([
                this.fetchUnits(),
                this.fetchAllCategories()
            ]);
            this.saveInitialState();
        });
    },
    methods: {
        changeTab(tabName) {
            this.currentTab = tabName;
        },
        async fetchUnits() {
            if (this.$store.getters.units?.length) {
                this.units = this.$store.getters.units;
            } else {
                await this.$store.dispatch('loadUnits');
                this.units = this.$store.getters.units;
            }
        },
        async fetchAllCategories() {
            if (this.$store.getters.categories?.length) {
                this.allCategories = this.$store.getters.categories;
                return;
            }
            await this.$store.dispatch('loadCategories');
            this.allCategories = this.$store.getters.categories;
        },

        onCategoriesChange(selectedIds) {
            this.selectedCategoryIds = selectedIds;
            this.selectedCategories = selectedIds.map((id, index) => {
                const category = this.allCategories.find(cat => cat.id.toString() === id.toString());
                if (!category) return null;
                return {
                    id: parseInt(category.id),
                    name: category.name,
                    isPrimary: index === 0
                };
            }).filter(Boolean);
        },

        onFileChange(event) {
            const file = event.target.files[0];
            if (file) {
                if (!file.type.startsWith('image/')) {
                    alert(this.$t('onlyImagesAllowed'));
                    event.target.value = '';
                    return;
                }
                this.existingImageCleared = false;
                this.selectedImage = URL.createObjectURL(file);
            }
        },
        prepareSave() {
            const typeToUse = this.defaultType || this.type;
            return {
                type: typeToUse == "product" ? 1 : 0,
                name: this.name,
                description: this.description,
                sku: this.sku,
                categoryId: this.selectedCategoryIds?.length > 0 ? parseInt(this.selectedCategoryIds[0]) : this.categoryId,
                categories: this.selectedCategoryIds.map(id => parseInt(id)),
                unitId: this.unitId,
                barcode: this.barcode,
                retailPrice: parseFloat(this.retailPrice) || 0,
                wholesalePrice: parseFloat(this.wholesalePrice) || 0,
                purchasePrice: parseFloat(this.purchasePrice) || 0,
            };
        },
        async performSave(data) {
            const imageFile = this.$refs.imageInput?.files[0];
            let resp;
            if (this.editingItemId != null) {
                const itemId = this.editingItem && this.editingItem.productId ? this.editingItem.productId : this.editingItemId;
                if (this.existingImageCleared && !imageFile) {
                    resp = await ProductController.updateItem(itemId, { ...data, image: '' }, null);
                } else {
                    resp = await ProductController.updateItem(itemId, data, imageFile);
                }
            } else {
                resp = await ProductController.storeItem(data, imageFile);
            }
            if (resp.message) {
                return resp.item || data;
            }
            throw new Error('Failed to save');
        },
        async performDelete() {
            const itemId = this.editingItem && this.editingItem.productId ? this.editingItem.productId : this.editingItemId;
            const resp = await ProductController.deleteItem(itemId);
            if (resp.message) {
                return resp;
            }
            throw new Error('Failed to delete');
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
        async getJsBarcode() {
            if (!this.jsBarcodeLib) {
                const module = await import("jsbarcode");
                this.jsBarcodeLib = module.default;
            }
            return this.jsBarcodeLib;
        },
        async renderBarcode(code) {
            const JsBarcode = await this.getJsBarcode();
            JsBarcode("#barcode-svg", code, { format: "ean13", displayValue: true });
            this.renderBarcodeToCanvas();
        },
        renderBarcodeToCanvas() {
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
            this.selectedImage = null;
            this.existingImageCleared = false;
            this.categoryId = '';
            this.selectedCategoryIds = [];
            this.selectedCategories = [];
            this.unitId = '';
            this.barcode = '';
            this.retailPrice = 0;
            this.wholesalePrice = 0;
            this.purchasePrice = 0;
            this.editingItemId = null;
            if (this.$refs.imageInput) {
                this.$refs.imageInput.value = null;
            }
            this.fetchAllCategories();
            this.resetFormChanges();
        },
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
                selectedImage: this.selectedImage,
                categoryId: this.categoryId,
                selectedCategoryIds: [...this.selectedCategoryIds],
                selectedCategories: [...this.selectedCategories],
                unitId: this.unitId,
                barcode: this.barcode,
                retailPrice: this.retailPrice,
                wholesalePrice: this.wholesalePrice,
                purchasePrice: this.purchasePrice,
            };
        },
        showModal() {
            this.modalDialog = true;
        },
        closeModal() {
            this.modalDialog = false;
        },
        async handleSaved() {
            const companyId = this.$store.state.currentCompany?.id || null;
            await CacheInvalidator.onUpdate('categories', companyId);
            await this.fetchAllCategories();
            this.closeModal();
            this.$emit('saved');
        },
        handleSavedError(m) {
            this.emitSavedError(m);
        },
        getProductImageSrc(item) {
            if (!item) return '';
            if (item.imgUrl) return item.imgUrl();
            if (item.productImage)
                return import.meta.env.VITE_APP_BASE_URL + '/storage/' + item.productImage;
            return '';
        },
        onEditingItemChanged(newEditingItem) {
            this.existingImageCleared = false;
            if (newEditingItem) {
                if (this.defaultType) {
                    this.type = this.defaultType;
                } else {
                    this.type = newEditingItem.typeName ? newEditingItem.typeName() : 'product';
                }
                this.name = newEditingItem.name || newEditingItem.productName ;
                this.description = newEditingItem.description ;
                this.sku = newEditingItem.sku ;
                this.image = newEditingItem.image || newEditingItem.productImage ;
                this.categoryId = newEditingItem.categoryId;

                const purchasePriceValue = newEditingItem.purchasePrice ?? 0;
                if (newEditingItem.categories?.length) {
                    this.selectedCategoryIds = newEditingItem.categories.map(cat => cat.id.toString());
                    this.selectedCategories = newEditingItem.categories.map((cat, index) => ({
                        id: parseInt(cat.id),
                        name: cat.name,
                        isPrimary: index === 0
                    }));
                } else if (this.categoryId) {
                    const category = this.allCategories.find(cat => cat.id == this.categoryId);
                    this.selectedCategoryIds = [this.categoryId.toString()];
                    this.selectedCategories = [{
                        id: parseInt(this.categoryId),
                        name: category?.name,
                        isPrimary: true
                    }];
                } else {
                    this.selectedCategoryIds = [];
                    this.selectedCategories = [];
                }

                this.unitId = newEditingItem.unitId;
                this.barcode = newEditingItem.barcode ;
                this.retailPrice = newEditingItem.retailPrice ?? 0;
                this.wholesalePrice = newEditingItem.wholesalePrice ?? 0;
                this.purchasePrice = purchasePriceValue ?? 0;
            } else {
                this.selectedImage = null;
            }
        }
    }
}

</script>

<style scoped>
.products-category-filter :deep(.checkbox-filter__trigger) {
    min-height: 2rem;
    padding: 0.25rem 2rem 0.25rem 0.5rem;
}
</style>

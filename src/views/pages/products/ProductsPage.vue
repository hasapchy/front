<template>
  <div>
    <transition
      name="fade"
      mode="out-in"
    >
      <CardListViewShell
        v-if="isDataReady && (displayViewMode === 'table' || displayViewMode === 'cards')"
        :key="cardListShellKey"
        :display-view-mode="displayViewMode"
        :cards-toolbar="cardsToolbar"
      >
        <template #table>
          <DraggableTable
            table-key="admin.products"
            :columns-config="columnsConfig"
            :table-data="data.items"
            :item-mapper="itemMapper"
            :on-item-click="onItemClick"
            @selection-change="selectedIds = $event"
          >
            <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
              <TableControlsBar
                :show-filters="true"
                :has-active-filters="hasActiveFilters"
                :active-filters-count="getActiveFiltersCount()"
                :on-filters-reset="resetFilters"
                :show-pagination="true"
                :pagination-data="paginationData"
                :on-page-change="fetchItems"
                :on-per-page-change="handlePerPageChange"
                :reset-columns="resetColumns"
                :columns="columns"
                :toggle-visible="toggleVisible"
                :log="log"
              >
                <template #left>
                  <PrimaryButton
                    :onclick="() => { showModal(null) }"
                    icon="fas fa-plus"
                    :disabled="!$store.getters.hasPermission('products_create')"
                  />
                  <transition name="fade">
                    <BatchButton
                      v-if="selectedIds.length"
                      :selected-ids="selectedIds"
                      :batch-actions="getBatchActions()"
                    />
                  </transition>
                  <ViewModeToggle
                    :view-mode="displayViewMode"
                    :show-kanban="false"
                    :show-cards="true"
                    @change="changeViewMode"
                  />
                  <FiltersContainer
                    :has-active-filters="hasActiveFilters"
                    :active-filters-count="getActiveFiltersCount()"
                    @reset="resetFilters"
                    @apply="applyFilters"
                  >
                    <div>
                      <label class="block mb-2 text-xs font-semibold">{{ $t('category') }}</label>
                      <select
                        v-model="selectedCategoryId"
                        class="w-full"
                      >
                        <option value="">
                          {{ $t('allCategoriesFilter') }}
                        </option>
                        <option
                          v-for="category in categories"
                          :key="category.id"
                          :value="category.id"
                        >
                          {{ category.name }}
                        </option>
                      </select>
                    </div>
                  </FiltersContainer>
                </template>
                <template #gear="{ resetColumns, columns, toggleVisible, log }">
                  <TableFilterButton
                    v-if="columns && columns.length"
                    :on-reset="resetColumns"
                  >
                    <ul>
                      <draggable
                        v-if="columns.length"
                        class="dragArea list-group w-full"
                        :list="columns"
                        @change="log"
                      >
                        <li
                          v-for="(element, index) in columns"
                          v-show="element.name !== 'select'"
                          :key="element.name"
                          class="flex items-center hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)] p-2 rounded"
                          @click="toggleVisible(index)"
                        >
                          <div class="space-x-2 flex flex-row justify-between w-full select-none">
                            <div>
                              <i
                                class="text-sm mr-2 text-[#337AB7]"
                                :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"
                              />
                              {{ $te(element.label) ? $t(element.label) : element.label }}
                            </div>
                            <div>
                              <i
                                class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab"
                              />
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
        </template>
        <template #card-bar-left>
          <PrimaryButton
            :onclick="() => { showModal(null) }"
            icon="fas fa-plus"
            :disabled="!$store.getters.hasPermission('products_create')"
          />
          <transition name="fade">
            <BatchButton
              v-if="selectedIds.length"
              :selected-ids="selectedIds"
              :batch-actions="getBatchActions()"
            />
          </transition>
          <ViewModeToggle
            :view-mode="displayViewMode"
            :show-kanban="false"
            :show-cards="true"
            @change="changeViewMode"
          />
          <FiltersContainer
            :has-active-filters="hasActiveFilters"
            :active-filters-count="getActiveFiltersCount()"
            @reset="resetFilters"
            @apply="applyFilters"
          >
            <div>
              <label class="block mb-2 text-xs font-semibold">{{ $t('category') }}</label>
              <select
                v-model="selectedCategoryId"
                class="w-full"
              >
                <option value="">
                  {{ $t('allCategoriesFilter') }}
                </option>
                <option
                  v-for="category in categories"
                  :key="category.id"
                  :value="category.id"
                >
                  {{ category.name }}
                </option>
              </select>
            </div>
          </FiltersContainer>
        </template>
        <template #card-bar-gear>
          <CardFieldsGearMenu
            :card-fields="cardFields"
            :on-reset="resetCardFields"
            @toggle="toggleCardFieldVisible"
          />
        </template>
        <template #cards>
          <MapperCardGrid
            class="mt-4"
            :items="data.items"
            :card-config="cardConfigMerged"
            :card-mapper="productCardMapper"
            title-field="title"
            title-subtitle-field="dateUser"
            :title-prefix="productCardTitlePrefix"
            :selected-ids="selectedIds"
            :show-checkbox="$store.getters.hasPermission('products_delete')"
            @dblclick="onItemClick"
            @select-toggle="toggleSelectRow"
          />
        </template>
      </CardListViewShell>
      <div
        v-else
        key="loader"
        class="min-h-64"
      >
        <TableSkeleton v-if="displayViewMode === 'table'" />
        <CardsSkeleton v-else />
      </div>
    </transition>
    <SideModalDialog
      :show-form="modalDialog"
      :title="sideModalCrudTitle('sideModalGenProduct', 'sideModalNomProduct')"
      :onclose="handleModalClose"
    >
      <ProductsCreatePage
        v-if="modalDialog"
        :key="editingItem ? editingItem.id : 'new-product'"
        ref="productForm"
        :editing-item="editingItem"
        :default-type="'product'"
        @saved="handleSaved"
        @saved-error="handleSavedError"
        @deleted="handleDeleted"
        @deleted-error="handleDeletedError"
        @close-request="closeModal"
      />
    </SideModalDialog>
    <AlertDialog
      :dialog="deleteDialog"
      :descr="`${$t('confirmDelete')} (${selectedIds.length})?`"
      :confirm-text="$t('delete')"
      :leave-text="$t('cancel')"
      @confirm="confirmDeleteItems"
      @leave="deleteDialog = false"
    />
  </div>
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
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
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import storeDataLoaderMixin from '@/mixins/storeDataLoaderMixin';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import { highlightMatches } from '@/utils/searchUtils';
import listQueryMixin from '@/mixins/listQueryMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';

const productsListViewModeMixin = createStoreViewModeMixin({
    listPageKey: 'products',
    modes: ['table', 'cards'],
});

export default {
    components: { PrimaryButton, SideModalDialog, ProductsCreatePage, DraggableTable, BatchButton, AlertDialog, TableControlsBar, TableFilterButton, TableSkeleton, CardsSkeleton, FiltersContainer, ViewModeToggle, MapperCardGrid, CardListViewShell, CardFieldsGearMenu, draggable: VueDraggableNext },
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, companyChangeMixin, listQueryMixin, storeDataLoaderMixin, cardFieldsVisibilityMixin, productsListViewModeMixin],
    data() {
        return {
            cardFieldsKey: 'admin.products.cards',
            titleField: 'title',
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
                { name: 'name', label: 'name', html: true },
                { name: 'sku', label: 'sku', html: true },
                { name: 'barcode', label: 'barcode', html: true },
                { name: 'category_name', label: 'category', html: true },
                { name: 'retail_price', label: 'retailPrice' },
                { name: 'wholesale_price', label: 'wholesalePrice' },
                { name: 'dateUser', label: 'dateUser' },
            ]
        }
    },
    computed: {
        searchQuery() {
            return this.$store.state.searchQuery;
        },
        isDataReady() {
            return this.data != null && !this.loading;
        },
        paginationData() {
            if (!this.data) return null;
            return {
                currentPage: this.data.currentPage,
                lastPage: this.data.lastPage,
                perPage: this.perPage,
                perPageOptions: this.perPageOptions
            };
        },
        hasActiveFilters() {
            return this.selectedCategoryId !== '';
        },
        cardsToolbar() {
            return {
                showFilters: true,
                hasActiveFilters: this.hasActiveFilters,
                activeFiltersCount: this.getActiveFiltersCount(),
                onFiltersReset: this.resetFilters,
                showPagination: true,
                paginationData: this.paginationData,
                onPageChange: this.fetchItems,
                onPerPageChange: this.handlePerPageChange,
            };
        },
        cardConfigBase() {
            return [
                { name: 'title', label: null },
                { name: 'sku', label: 'sku', icon: 'fas fa-barcode text-[#3571A4]', html: true },
                { name: 'barcode', label: 'barcode', icon: 'fas fa-barcode text-[#3571A4]', html: true },
                { name: 'category_name', label: 'category', icon: 'fas fa-folder text-[#3571A4]', html: true },
                { name: 'retail_price', label: 'retailPrice', icon: 'fas fa-tag text-[#3571A4]' },
                { name: 'wholesale_price', label: 'wholesalePrice', icon: 'fas fa-tag text-[#3571A4]' },
            ];
        },
        cardConfigMerged() {
            const title = { name: 'title', label: null };
            const rest = (this.cardFields || []).map(f => ({ ...f, visible: f.visible }));
            return [title, ...rest];
        },
    },
    watch: {
        '$route.params.id': {
            immediate: true,
            handler(value) {
                this.handleRouteItem(value);
            }
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
        productCardTitlePrefix() {
            return '<i class="fas fa-box text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
        },
        productCardMapper(item, fieldName) {
            if (!item) return '';
            if (fieldName === 'title') {
                return item.name || String(item.id);
            }
            return this.itemMapper(item, fieldName) ?? '';
        },
        toggleSelectRow(id) {
            if (!id) return;
            if (this.selectedIds.includes(id)) {
                this.selectedIds = this.selectedIds.filter(x => x !== id);
            } else {
                this.selectedIds = [...this.selectedIds, id];
            }
        },
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
        async handleCompanyChanged(companyId, previousCompanyId) {
            this.selectedCategoryId = '';
            this.selectedIds = [];
            await this.fetchCategories();
            await this.fetchItems(1, previousCompanyId == null);
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
                    return search ? highlightMatches(i.getCategoryDisplayName() , search) : i.getCategoryDisplayName();
                case 'dateUser':
                    return `${i.formatDate()} / ${i.creator?.name }`;
                case 'name':
                    return search ? highlightMatches(i.name , search) : (i.name );
                case 'sku':
                    return search ? highlightMatches(i.sku , search) : (i.sku );
                case 'barcode':
                    return search ? highlightMatches(i.barcode , search) : (i.barcode );
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
                    params.categoryId = this.selectedCategoryId;
                }
                if (this.searchQuery) {
                    params.search = this.searchQuery;
                }
                this.data = await ProductController.getItems(page, true, params, this.perPage);
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
}
</script>

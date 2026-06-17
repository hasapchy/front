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
            table-key="admin.categories"
            :columns-config="columnsConfig"
            :table-data="treeVisibleItems"
            :item-mapper="itemMapper"
            :on-item-click="(i) => { showModal(i) }"
            :on-html-cell-click="handleTreeCellClick"
            :external-sort="true"
            @sort-change="onTreeSortChange"
          >
            <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
              <TableControlsBar
                :show-pagination="false"
                :reset-columns="resetColumns"
                :columns="columns"
                :toggle-visible="toggleVisible"
                :log="log"
              >
                <template #left>
                  <PrimaryButton
                    :onclick="() => { showModal(null) }"
                    icon="fas fa-plus"
                    :disabled="!$store.getters.hasPermission('categories_create')"
                  />
                  <PrimaryButton
                    v-if="treeHasAnyExpandable"
                    :onclick="treeIsAllExpanded ? collapseAllTree : expandAllTree"
                    :icon="treeIsAllExpanded ? 'fas fa-compress-alt' : 'fas fa-expand-alt'"
                    :aria-label="treeIsAllExpanded ? $t('collapseAll') : $t('expandAll')"
                  />
                  <ViewModeToggle
                    :view-mode="displayViewMode"
                    :show-kanban="false"
                    :show-cards="true"
                    @change="changeViewMode"
                  />
                </template>
                <template #gear="{ resetColumns, columns, toggleVisible, log }">
                  <TableFilterButton
                    v-if="columns && columns.length"
                    :on-reset="resetColumns"
                  >
                    <TableColumnDateModeSection :items="dateColumnsForSettings(columns)"
                      :resolve-mode="resolveColumnDateMode"
                      @set-mode="(item, mode) => setColumnDateDisplayMode(columns, item.index, mode)" />
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
                                class="text-sm mr-2 text-[var(--color-info)]"
                                :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"
                              />
                              {{ $te(element.label) ? $t(element.label) : element.label }}
                            </div>
                            <div>
                              <i class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab" />
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
            :disabled="!$store.getters.hasPermission('categories_create')"
          />
          <ViewModeToggle
            :view-mode="displayViewMode"
            :show-kanban="false"
            :show-cards="true"
            @change="changeViewMode"
          />
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
            :card-mapper="categoryCardMapper"
            title-field="title"
            :title-prefix="categoryCardTitlePrefix"
            :show-checkbox="false"
            @dblclick="(i) => showModal(i)"
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
      :title="sideModalCrudTitle('sideModalGenCategory', 'sideModalNomCategory')"
      :onclose="handleModalClose"
    >
      <AdminCategoryCreatePage
        ref="admincategorycreatepageForm"
        :editing-item="editingItem"
        @saved="handleSaved"
        @saved-error="handleSavedError"
        @deleted="handleDeleted"
        @deleted-error="handleDeletedError"
        @close-request="closeModal"
      />
    </SideModalDialog>
  </div>
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import TableColumnDateModeSection from '@/views/components/app/forms/TableColumnDateModeSection.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import CategoryController from '@/api/CategoryController';
import AdminCategoryCreatePage from './CategoriesCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import { dtoDateFormatters } from '@/utils/dateUtils';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import storeDataLoaderMixin from '@/mixins/storeDataLoaderMixin';
import treeTableMixin from '@/mixins/treeTableMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';
import tableColumnDateModeMixin from '@/mixins/tableColumnDateModeMixin';
import { markRaw } from 'vue';
import UserButtonCell from '@/views/components/app/buttons/UserButtonCell.vue';

const categoriesListViewModeMixin = createStoreViewModeMixin({
  listPageKey: 'categories',
  modes: ['table', 'cards'],
});

export default {
  components: {
    PrimaryButton,
    SideModalDialog,
    AdminCategoryCreatePage,
    DraggableTable,
    TableControlsBar,
    TableFilterButton,
    TableColumnDateModeSection,
    TableSkeleton,
    CardsSkeleton,
    ViewModeToggle,
    MapperCardGrid,
    CardListViewShell,
    CardFieldsGearMenu,
    draggable: VueDraggableNext
  },
  mixins: [modalMixin, notificationMixin, crudEventMixin, getApiErrorMessageMixin, companyChangeMixin, cardFieldsVisibilityMixin, storeDataLoaderMixin, treeTableMixin, categoriesListViewModeMixin, tableColumnDateModeMixin],
  data() {
    return {
      tableColumnsPersistKey: 'admin.categories',
      cardFieldsKey: 'admin.categories.cards',
      controller: CategoryController,
      cacheInvalidationType: 'categories',
      savedSuccessText: this.$t('categorySuccessfullyAdded'),
      savedErrorText: this.$t('errorSavingCategory'),
      deletedSuccessText: this.$t('categorySuccessfullyDeleted'),
      deletedErrorText: this.$t('errorDeletingCategory'),
      columnsConfig: [
        { name: 'id', label: 'number', size: 60 },
        { name: 'name', label: 'name', html: true },
        {
          name: 'creatorName',
          label: 'creator',
          component: markRaw(UserButtonCell),
          props: (item) => ({ user: item.creator }),
        },
        { name: 'createdAt', label: 'creationDate' }
      ]
    }
  },
  computed: {
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
    cardsToolbar() {
      return {
        showPagination: true,
        paginationData: this.paginationData,
        onPageChange: this.fetchItems,
        onPerPageChange: this.handlePerPageChange,
      };
    },
    cardConfigBase() {
      return [
        { name: 'title', label: null },
        { name: 'parentName', label: 'parentCategory', icon: 'fas fa-sitemap text-[#3571A4]' },
        { name: 'creatorName', label: 'creator', icon: 'fas fa-user text-[#3571A4]' },
        { name: 'createdAt', label: 'creationDate', icon: 'fas fa-calendar text-[#3571A4]' },
      ];
    },
    cardConfigMerged() {
      const title = { name: 'title', label: null };
      const rest = (this.cardFields || []).map(f => ({ ...f, visible: f.visible }));
      return [title, ...rest];
    },
    treeSourceItems() {
      return this.$store.getters.categories || [];
    },
  },
  created() {
    this.$store.commit('SET_SETTINGS_OPEN', true);
  },
  mounted() {
    this.fetchItems();
    this.fetchAllCategories();
  },
  methods: {
    /**
     * Возвращает значение для сортировки колонок таблицы категорий.
     *
     * @param {object} item
     * @param {string} key
     * @returns {*}
     */
    treeSortValue(item, key) {
      if (!item) return '';
      switch (key) {
        case 'creatorName':
          return item.creator?.name || '';
        default:
          return item[key];
      }
    },
    /**
     * Загружает справочник товарных категорий компании в Vuex.
     *
     * @param {{forceReload?: boolean}} [options]
     * @returns {Promise<void>}
     */
    fetchAllCategories(options = {}) {
      return this.loadStoreData({
        getterName: 'categories',
        dispatchName: 'loadCategories',
        defaultValue: [],
        forceReload: options.forceReload === true,
      });
    },
    /**
     * Перезагружает справочник категорий после CRUD-операции
     * принудительно, минуя in-memory кеш стора.
     *
     * @returns {Promise<void>}
     */
    onAfterSaved() {
      return this.fetchAllCategories({ forceReload: true });
    },
    /**
     * Перезагружает справочник категорий после удаления.
     *
     * @returns {Promise<void>}
     */
    onAfterDeleted() {
      return this.fetchAllCategories({ forceReload: true });
    },
    categoryCardTitlePrefix() {
      return '<i class="fas fa-folder text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
    },
    categoryCardMapper(item, fieldName) {
      if (!item) return '';
      if (fieldName === 'title') {
        return item.name || String(item.id);
      }
      if (fieldName === 'name') {
        return item.name || '';
      }
      return this.itemMapper(item, fieldName) ?? '';
    },
    itemMapper(i, c) {
      switch (c) {
        case 'createdAt':
          return dtoDateFormatters.formatCreatedAt(i.createdAt);
        case 'creatorName':
          return i.creator?.name;
        case 'name':
          return this.treeNameCellHtml(i.name, i);
        default:
          return i[c];
      }
    },
    handlePerPageChange(newPerPage) {
      this.perPage = newPerPage;
      this.fetchItems(1, false);
    },
    async handleCompanyChanged(companyId, previousCompanyId) {
      await this.fetchItems(1, previousCompanyId == null);
      await this.fetchAllCategories({ forceReload: true });
    },
    async fetchItems(page = 1, silent = false) {
      if (!silent) {
        this.loading = true;
      }
      try {
        this.data = await CategoryController.getItems(page, this.perPage);
      } catch (error) {
        this.showNotification(this.$t('errorGettingCategoryList'), error.message, true);
      }
      if (!silent) {
        this.loading = false;
      }
    }
  },
}
</script>

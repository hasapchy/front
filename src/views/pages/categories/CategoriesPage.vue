<template>
  <div>
    <transition name="fade" mode="out-in">
      <CardListViewShell v-if="isDataReady && (displayViewMode === 'table' || displayViewMode === 'cards')"
        :key="cardListShellKey" :display-view-mode="displayViewMode" :cards-toolbar="cardsToolbar">
        <template #table>
          <DraggableTable table-key="admin.categories" :columns-config="columnsConfig" :table-data="data.items"
            :item-mapper="itemMapper" :on-item-click="(i) => { showModal(i) }" @selection-change="selectedIds = $event">
            <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
              <TableControlsBar :show-pagination="true" :pagination-data="paginationData" :on-page-change="fetchItems"
                :on-per-page-change="handlePerPageChange" :reset-columns="resetColumns" :columns="columns"
                :toggle-visible="toggleVisible" :log="log">
                <template #left>
                  <PrimaryButton :onclick="() => { showModal(null) }" icon="fas fa-plus"
                    :disabled="!$store.getters.hasPermission('categories_create')" />
                  <transition name="fade">
                    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds"
                      :batch-actions="getBatchActions()" />
                  </transition>
                  <ViewModeToggle :view-mode="displayViewMode" :show-kanban="false" :show-cards="true"
                    @change="changeViewMode" />
                </template>
                <template #gear="{ resetColumns, columns, toggleVisible, log }">
                  <TableFilterButton v-if="columns && columns.length" :on-reset="resetColumns">
                    <ul>
                      <draggable v-if="columns.length" class="dragArea list-group w-full" :list="columns" @change="log">
                        <li v-for="(element, index) in columns" v-show="element.name !== 'select'" :key="element.name"
                          class="flex items-center hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)] p-2 rounded" @click="toggleVisible(index)">
                          <div class="space-x-2 flex flex-row justify-between w-full select-none">
                            <div>
                              <i class="text-sm mr-2 text-[#337AB7]"
                                :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']" />
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
          <PrimaryButton :onclick="() => { showModal(null) }" icon="fas fa-plus"
            :disabled="!$store.getters.hasPermission('categories_create')" />
          <transition name="fade">
            <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
          </transition>
          <ViewModeToggle :view-mode="displayViewMode" :show-kanban="false" :show-cards="true"
            @change="changeViewMode" />
        </template>
        <template #card-bar-gear>
          <CardFieldsGearMenu :card-fields="cardFields" :on-reset="resetCardFields" @toggle="toggleCardFieldVisible" />
        </template>
        <template #cards>
          <MapperCardGrid class="mt-4" :items="data.items" :card-config="cardConfigMerged"
            :card-mapper="categoryCardMapper" title-field="title" :title-prefix="categoryCardTitlePrefix"
            :selected-ids="selectedIds" :show-checkbox="$store.getters.hasPermission('categories_delete')"
            @dblclick="(i) => showModal(i)" @select-toggle="toggleSelectRow" />
        </template>
      </CardListViewShell>
      <div v-else key="loader" class="min-h-64">
        <TableSkeleton v-if="displayViewMode === 'table'" />
        <CardsSkeleton v-else />
      </div>
    </transition>
    <SideModalDialog :show-form="modalDialog"
      :title="sideModalCrudTitle('sideModalGenCategory', 'sideModalNomCategory')" :onclose="handleModalClose">
      <AdminCategoryCreatePage ref="admincategorycreatepageForm" :editing-item="editingItem" @saved="handleSaved"
        @saved-error="handleSavedError" @deleted="handleDeleted" @deleted-error="handleDeletedError"
        @close-request="closeModal" />
    </SideModalDialog>
    <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDelete')} (${selectedIds.length})?`"
      :confirm-text="$t('delete')" :leave-text="$t('cancel')" @confirm="confirmDeleteItems"
      @leave="deleteDialog = false" />
  </div>
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import CategoryController from '@/api/CategoryController';
import AdminCategoryCreatePage from './CategoriesCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';

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
    BatchButton,
    AlertDialog,
    TableControlsBar,
    TableFilterButton,
    TableSkeleton,
    CardsSkeleton,
    ViewModeToggle,
    MapperCardGrid,
    CardListViewShell,
    CardFieldsGearMenu,
    draggable: VueDraggableNext
  },
  mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, companyChangeMixin, cardFieldsVisibilityMixin, categoriesListViewModeMixin],
  data() {
    return {
      cardFieldsKey: 'admin.categories.cards',
      titleField: 'title',
      controller: CategoryController,
      cacheInvalidationType: 'categories',
      deletePermission: 'categories_delete',
      savedSuccessText: this.$t('categorySuccessfullyAdded'),
      savedErrorText: this.$t('errorSavingCategory'),
      deletedSuccessText: this.$t('categorySuccessfullyDeleted'),
      deletedErrorText: this.$t('errorDeletingCategory'),
      columnsConfig: [
        { name: 'select', label: '#', size: 15 },
        { name: 'id', label: 'number', size: 60 },
        { name: 'name', label: 'name' },
        { name: 'parentName', label: 'parentCategory' },
        { name: 'creatorName', label: 'creator' },
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
  },
  created() {
    this.$store.commit('SET_SETTINGS_OPEN', true);
  },
  mounted() {
    this.fetchItems();
  },
  methods: {
    categoryCardTitlePrefix() {
      return '<i class="fas fa-folder text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
    },
    categoryCardMapper(item, fieldName) {
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
    itemMapper(i, c) {
      switch (c) {
        case 'createdAt':
          return i.formatCreatedAt();
        case 'creatorName':
          return i.creator?.name;
        default:
          return i[c];
      }
    },
    handlePerPageChange(newPerPage) {
      this.perPage = newPerPage;
      this.fetchItems(1, false);
    },
    async handleCompanyChanged(companyId, previousCompanyId) {
      this.selectedIds = [];
      await this.fetchItems(1, previousCompanyId == null);
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

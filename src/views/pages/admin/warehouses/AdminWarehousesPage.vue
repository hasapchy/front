<template>
  <div>
    <transition name="fade" mode="out-in">
      <CardListViewShell v-if="isDataReady && (displayViewMode === 'table' || displayViewMode === 'cards')"
        :key="cardListShellKey" :display-view-mode="displayViewMode" :cards-toolbar="cardsToolbar">
        <template #table>
          <DraggableTable table-key="admin.warehouses" :columns-config="columnsConfig" :table-data="data.items"
            :item-mapper="itemMapper" :on-item-click="(i) => { showModal(i) }">
            <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
              <TableControlsBar :show-pagination="true" :pagination-data="paginationData" :on-page-change="fetchItems"
                :on-per-page-change="handlePerPageChange" :reset-columns="resetColumns" :columns="columns"
                :toggle-visible="toggleVisible" :log="log">
                <template #left>
                  <PrimaryButton :onclick="() => showModal(null)" icon="fas fa-plus" />
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
          <PrimaryButton :onclick="() => showModal(null)" icon="fas fa-plus" />
          <ViewModeToggle :view-mode="displayViewMode" :show-kanban="false" :show-cards="true"
            @change="changeViewMode" />
        </template>
        <template #card-bar-gear>
          <CardFieldsGearMenu :card-fields="cardFields" :on-reset="resetCardFields" @toggle="toggleCardFieldVisible" />
        </template>
        <template #cards>
          <MapperCardGrid class="mt-4" :items="data.items" :card-config="cardConfigMerged"
            :card-mapper="warehouseCardMapper" title-field="title" title-subtitle-field="createdAt"
            :title-prefix="warehouseCardTitlePrefix"
            :show-checkbox="false"
            @dblclick="(i) => { showModal(i) }" />
        </template>
      </CardListViewShell>
      <div v-else key="loader" class="min-h-64">
        <TableSkeleton v-if="displayViewMode === 'table'" />
        <CardsSkeleton v-else />
      </div>
    </transition>
    <SideModalDialog :show-form="modalDialog"
      :title="sideModalCrudTitle('sideModalGenWarehouse', 'sideModalNomWarehouse')" :onclose="handleModalClose">
      <AdminWarehouseCreatePage ref="adminwarehousecreatepageForm" :warehouse="editingItem" @saved="handleSaved"
        @saved-error="handleSavedError" @deleted="handleDeleted" @deleted-error="handleDeletedError"
        @close-request="closeModal" />
    </SideModalDialog>
  </div>
</template>
<script>
import WarehouseController from '@/api/WarehouseController';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import AdminWarehouseCreatePage from '@/views/pages/admin/warehouses/AdminWarehouseCreatePage.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';

const adminWarehousesListViewModeMixin = createStoreViewModeMixin({
  listPageKey: 'adminWarehouses',
  modes: ['table', 'cards'],
});

export default {
  components: {
    PrimaryButton,
    SideModalDialog,
    AdminWarehouseCreatePage,
    DraggableTable,
    TableControlsBar,
    TableFilterButton,
    TableSkeleton,
    CardsSkeleton,
    ViewModeToggle,
    MapperCardGrid,
    CardListViewShell,
    CardFieldsGearMenu,
    draggable: VueDraggableNext,
  },
  mixins: [
    modalMixin,
    notificationMixin,
    crudEventMixin,
    getApiErrorMessageMixin,
    cardFieldsVisibilityMixin,
    adminWarehousesListViewModeMixin,
  ],
  data() {
    return {
      cardFieldsKey: 'admin.warehouses.cards',
      titleField: 'title',
      cacheInvalidationType: 'warehouses',
      controller: WarehouseController,
      showStatusSelect: false,
      savedSuccessText: this.$t('warehouseSuccessfullyAdded'),
      savedErrorText: this.$t('errorSavingWarehouse'),
      deletedSuccessText: this.$t('warehouseSuccessfullyDeleted'),
      deletedErrorText: this.$t('errorDeletingWarehouse'),
      columnsConfig: [
        { name: 'id', label: this.$t('number'), size: 60 },
        { name: 'name', label: this.$t('name') },
        { name: 'createdAt', label: this.$t('creationDate') },
      ],
    };
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
        perPageOptions: this.perPageOptions,
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
        { name: 'createdAt', label: this.$t('creationDate'), icon: 'fas fa-calendar text-[#3571A4]' },
      ];
    },
    cardConfigMerged() {
      const title = { name: 'title', label: null };
      const rest = (this.cardFields || []).map((f) => ({ ...f, visible: f.visible }));
      return [title, ...rest];
    },
  },
  created() {
    this.fetchItems();
    this.$store.commit('SET_SETTINGS_OPEN', true);
  },
  methods: {
    warehouseCardTitlePrefix() {
      return '<i class="fas fa-warehouse text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
    },
    warehouseCardMapper(item, fieldName) {
      if (!item) return '';
      if (fieldName === 'title') {
        return item.name || String(item.id);
      }
      return this.itemMapper(item, fieldName) ?? '';
    },
    itemMapper(i, c) {
      switch (c) {
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
      try {
        this.data = await WarehouseController.getItems(page, this.perPage);
      } catch (error) {
        this.showNotification(this.$t('errorGettingWarehouseList'), error.message, true);
      }
      if (!silent) {
        this.loading = false;
      }
    },
  },
};
</script>

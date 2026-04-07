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
        :cards-toolbar="writeoffCardsToolbar"
      >
        <template #table>
          <DraggableTable
            table-key="admin.warehouse_writeoffs"
            :columns-config="columnsConfig"
            :table-data="data.items"
            :item-mapper="itemMapper"
            :on-item-click="(i) => { showModal(i) }"
            @selection-change="selectedIds = $event"
          >
            <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
              <TableControlsBar
                :reset-columns="resetColumns"
                :columns="columns"
                :toggle-visible="toggleVisible"
                :log="log"
              >
                <template #left>
                  <PrimaryButton
                    :onclick="() => showModal(null)"
                    icon="fas fa-plus"
                    :disabled="!$store.getters.hasPermission('warehouse_writeoffs_create')"
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
                </template>

                <template #right>
                  <Pagination
                    v-if="data != null"
                    :current-page="data.currentPage"
                    :last-page="data.lastPage"
                    :per-page="perPage"
                    :per-page-options="perPageOptions"
                    :show-per-page-selector="true"
                    @change-page="fetchItems"
                    @per-page-change="handlePerPageChange"
                  />
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
                          class="flex items-center hover:bg-gray-100 p-2 rounded"
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
            :onclick="() => showModal(null)"
            icon="fas fa-plus"
            :disabled="!$store.getters.hasPermission('warehouse_writeoffs_create')"
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
        </template>
        <template #card-bar-right>
          <Pagination
            v-if="data != null"
            :current-page="data.currentPage"
            :last-page="data.lastPage"
            :per-page="perPage"
            :per-page-options="perPageOptions"
            :show-per-page-selector="true"
            @change-page="fetchItems"
            @per-page-change="handlePerPageChange"
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
            :card-mapper="writeoffCardMapper"
            title-field="title"
            title-subtitle-field="dateUser"
            :title-prefix="writeoffCardTitlePrefix"
            :selected-ids="selectedIds"
            :show-checkbox="$store.getters.hasPermission('warehouse_writeoffs_delete')"
            @dblclick="showModal"
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
      :title="sideModalCrudTitle('sideModalGenWriteoff', 'sideModalNomWriteoff')"
      :onclose="handleModalClose"
    >
      <WarehousesWriteoffCreatePage
        v-if="modalDialog"
        ref="warehouseswriteoffcreatepageForm"
        :editing-item="editingItem"
        @saved="handleSaved"
        @saved-error="handleSavedError"
        @deleted="handleDeleted"
        @deleted-error="handleDeletedError"
        @close-request="closeModal"
      />
    </SideModalDialog>
    <AlertDialog
      :dialog="deleteDialog"
      :descr="`${$t('confirmDeleteSelected')} (${selectedIds.length})?`"
      :confirm-text="$t('deleteSelected')"
      :leave-text="$t('cancel')"
      @confirm="confirmDeleteItems"
      @leave="deleteDialog = false"
    />
  </div>
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import WarehouseWriteoffController from '@/api/WarehouseWriteoffController';
import WarehousesWriteoffCreatePage from '@/views/pages/warehouses/WarehousesWriteoffCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import ProductsListCell from '@/views/components/app/buttons/ProductsListCell.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';
import { markRaw } from 'vue';

const warehouseWriteoffsListViewModeMixin = createStoreViewModeMixin({
    listPageKey: 'warehouseWriteoffs',
    modes: ['table', 'cards'],
});

export default {
    components: {
        PrimaryButton,
        SideModalDialog,
        Pagination,
        DraggableTable,
        WarehousesWriteoffCreatePage,
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
        draggable: VueDraggableNext,
    },
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, cardFieldsVisibilityMixin, warehouseWriteoffsListViewModeMixin],
    data() {
        return {
            cardFieldsKey: 'admin.warehouse_writeoffs.cards',
            titleField: 'title',
            deletePermission: 'warehouse_writeoffs_delete',
            controller: WarehouseWriteoffController,
            cacheInvalidationType: 'writeoffs',
            editingItem: null,
            savedSuccessText: this.$t('writeoffSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingWriteoff'),
            deletedSuccessText: this.$t('writeoffSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingWriteoff'),
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60 },
                { name: 'dateUser', label: 'dateUser' },
                { name: 'warehouseName', label: 'warehouse' },
                {
                    name: 'products',
                    label: 'products',
                    component: markRaw(ProductsListCell),
                    props: (item) => ({
                        products: item.products || []
                    })
                },
                { name: 'note', label: 'note' },
            ]
        }
    },
    computed: {
        isDataReady() {
            return this.data != null && !this.loading;
        },
        writeoffCardsToolbar() {
            return {
                showPagination: false,
            };
        },
        cardConfigBase() {
            return [
                { name: 'title', label: null },
                { name: 'dateUser', label: 'dateUser', icon: 'fas fa-calendar text-[#3571A4]' },
                { name: 'warehouseName', label: 'warehouse', icon: 'fas fa-warehouse text-[#3571A4]' },
                { name: 'products', label: 'products', icon: 'fas fa-box text-[#3571A4]' },
                { name: 'note', label: 'note', icon: 'fas fa-sticky-note text-[#3571A4]' },
            ];
        },
        cardConfigMerged() {
            const title = { name: 'title', label: null };
            const rest = (this.cardFields || []).map((f) => ({ ...f, visible: f.visible }));
            return [title, ...rest];
        },
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },

    mounted() {
        this.fetchItems();
    },
    methods: {
        writeoffCardTitlePrefix() {
            return '<i class="fas fa-eraser text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
        },
        writeoffCardMapper(item, fieldName) {
            if (!item) {
                return '';
            }
            if (fieldName === 'title') {
                return `#${item.id}`;
            }
            return this.itemMapper(item, fieldName) ?? '';
        },
        toggleSelectRow(id) {
            if (!id) {
                return;
            }
            if (this.selectedIds.includes(id)) {
                this.selectedIds = this.selectedIds.filter((x) => x !== id);
            } else {
                this.selectedIds = [...this.selectedIds, id];
            }
        },
        itemMapper(i, c) {
            switch (c) {
                case 'dateUser':
                    return `${i.formatCreatedAt()} / ${i.creator?.name }`;
                case 'products':
                    return (i.products || []).length;
                default:
                    return i[c];
            }
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {

                this.data = await WarehouseWriteoffController.getItems(page, this.perPage);
            } catch (error) {
                this.showNotification(this.$t('errorLoadingWriteoffs'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        }
    }
}
</script>
<template>
  <div>
    <transition
      name="fade"
      mode="out-in"
    >
      <CardListViewShell
        v-if="isDataReady && (displayViewMode === 'table' || displayViewMode === 'cards')"
        :key="writeoffTableStorageKey"
        :display-view-mode="displayViewMode"
        :cards-toolbar="writeoffCardsToolbar"
      >
        <template #table>
          <DraggableTable
            :table-key="writeoffTableStorageKey"
            :columns-config="columnsConfig"
            :table-data="data.items"
            :item-mapper="itemMapper"
            :on-item-click="(i) => { showModal(i) }"
          >
            <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
              <TableControlsBar
                :show-pagination="true"
                :pagination-data="writeoffPaginationData"
                :on-page-change="fetchItems"
                :on-per-page-change="handlePerPageChange"
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
                  <ViewModeToggle
                    :view-mode="displayViewMode"
                    :show-kanban="false"
                    :show-cards="true"
                    @change="changeViewMode"
                  />
                </template>
                <template #filters-desktop>
                  <WarehouseWriteoffFilters
                    v-if="!returnsOnly"
                    :reason-filter="reasonFilter"
                    :has-active-filters="hasActiveFilters"
                    :active-filters-count="getActiveFiltersCount()"
                    @update:reason-filter="reasonFilter = $event"
                    @reset="resetFilters"
                    @apply="applyFilters"
                  />
                </template>

                <template #gear="{ resetColumns, columns, toggleVisible, log }">
                  <TableFilterButton
                    v-if="columns && columns.length"
                    :on-reset="resetColumns"
                  >
                    <TableColumnDateModeSection
                      :items="dateColumnsForSettings(columns)"
                      :resolve-mode="resolveColumnDateMode"
                      @set-mode="(item, mode) => setColumnDateDisplayMode(columns, item.index, mode)"
                    />
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
                          <div class="space-x-2 flex flex-row justify-between w-full select-none items-center">
                            <div class="min-w-0">
                              <i
                                class="text-sm mr-2 text-[var(--color-info)]"
                                :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"
                              />
                              {{ $te(element.label) ? $t(element.label) : element.label }}
                            </div>
                            <div class="flex items-center gap-1">
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
          <ViewModeToggle
            :view-mode="displayViewMode"
            :show-kanban="false"
            :show-cards="true"
            @change="changeViewMode"
          />
        </template>
        <template #card-bar-filters-desktop>
          <WarehouseWriteoffFilters
            v-if="!returnsOnly"
            :reason-filter="reasonFilter"
            :has-active-filters="hasActiveFilters"
            :active-filters-count="getActiveFiltersCount()"
            @update:reason-filter="reasonFilter = $event"
            @reset="resetFilters"
            @apply="applyFilters"
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
            :show-checkbox="false"
            @dblclick="showModal"
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
      :timeline-collapsed="timelineCollapsed"
      :show-timeline-button="!!editingItem"
      @toggle-timeline="toggleTimeline"
    >
      <WarehousesWriteoffCreatePage
        v-if="modalDialog"
        ref="warehouseswriteoffcreatepageForm"
        :editing-item="editingItem"
        :locked-return-supplier="returnsOnly"
        @saved="handleSaved"
        @saved-error="handleSavedError"
        @deleted="handleDeleted"
        @deleted-error="handleDeletedError"
        @writeoff-refreshed="handleWriteoffRefreshed"
        @close-request="closeModal"
      />
      <template #timeline>
        <TimelinePanel
          v-if="editingItem && !timelineCollapsed"
          :id="editingItem.id"
          ref="timelinePanel"
          :type="'wh_writeoff'"
          @toggle-timeline="toggleTimeline"
        />
      </template>
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
import WarehouseWriteoffController from '@/api/WarehouseWriteoffController';
import WarehousesWriteoffCreatePage from '@/views/pages/warehouses/WarehousesWriteoffCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import ProductsListCell from '@/views/components/app/buttons/ProductsListCell.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import WarehouseWriteoffFilters from '@/views/components/app/WarehouseWriteoffFilters.vue';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import listQueryMixin from '@/mixins/listQueryMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';
import { getWriteoffReasonLabelKey } from '@/constants/warehouseWriteoffReasons';
import { markRaw } from 'vue';
import DateUserCell from '@/views/components/app/buttons/DateUserCell.vue';
import { buildDateUserCellProps } from '@/utils/userCellUtils';
import { TimelinePanelAsync } from '@/utils/timelinePanelAsync';
import timelineSideModalMixin from '@/mixins/timelineSideModalMixin';
import timelineUnreadMixin from '@/mixins/timelineUnreadMixin';
import { eventBus } from '@/eventBus';
import { highlightMatches } from '@/utils/searchUtils';
import tableColumnDateModeMixin from '@/mixins/tableColumnDateModeMixin';

const warehouseWriteoffsListViewModeMixin = createStoreViewModeMixin({
    listPageKey: 'warehouseWriteoffs',
    modes: ['table', 'cards'],
});

export default {
    props: {
        returnsOnly: {
            type: Boolean,
            default: false,
        },
    },
    components: {
        PrimaryButton,
        SideModalDialog,
        DraggableTable,
        WarehousesWriteoffCreatePage,
        TableControlsBar,
        TableFilterButton,
        TableColumnDateModeSection,
        TableSkeleton,
        CardsSkeleton,
        ViewModeToggle,
        MapperCardGrid,
        CardListViewShell,
        CardFieldsGearMenu,
        WarehouseWriteoffFilters,
        TimelinePanel: TimelinePanelAsync,
        draggable: VueDraggableNext,
    },
    mixins: [modalMixin, notificationMixin, crudEventMixin, getApiErrorMessageMixin, cardFieldsVisibilityMixin, listQueryMixin, companyChangeMixin, warehouseWriteoffsListViewModeMixin, timelineSideModalMixin, timelineUnreadMixin, tableColumnDateModeMixin],
    data() {
        return {
            reasonFilter: '',
            controller: WarehouseWriteoffController,
            cacheInvalidationType: 'writeoffs',
            editingItem: null,
            savedSuccessText: this.$t('writeoffSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingWriteoff'),
            deletedSuccessText: this.$t('writeoffSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingWriteoff'),
            columnsConfigBase: [
                { name: 'id', label: 'number', size: 60, html: true },
                {
                    name: 'dateUser',
                    label: 'dateUser',
                    type: 'datetime',
                    component: markRaw(DateUserCell),
                    props: (item, column) => buildDateUserCellProps(item, this.searchQuery, column?.dateDisplayMode),
                },
                { name: 'warehouseName', label: 'warehouse' },
                { name: 'reason', label: 'writeoffReason' },
                {
                    name: 'products',
                    label: 'products',
                    component: markRaw(ProductsListCell),
                    props: (item) => ({
                        products: item.products || [],
                        searchQuery: this.searchQuery,
                    })
                },
                { name: 'note', label: 'note', html: true },
            ]
        }
    },
    computed: {
        columnsConfig() {
            if (!this.returnsOnly) {
                return this.columnsConfigBase;
            }
            const cols = this.columnsConfigBase.filter((col) => col.name !== 'reason');
            const productsIndex = cols.findIndex((col) => col.name === 'products');
            const insertAt = productsIndex >= 0 ? productsIndex + 1 : cols.length;
            cols.splice(insertAt, 0, {
                name: 'returnAmountDisplay',
                label: 'writeoffReturnAmount',
            });
            return cols;
        },
        writeoffTableStorageKey() {
            return this.returnsOnly ? 'admin.warehouse_writeoff_returns' : 'admin.warehouse_writeoffs';
        },
        tableColumnsPersistKey() {
            return this.writeoffTableStorageKey;
        },
        cardFieldsKey() {
            return this.returnsOnly ? 'admin.warehouse_writeoff_returns.cards' : 'admin.warehouse_writeoffs.cards';
        },
        isDataReady() {
            return this.data != null && !this.loading;
        },
        writeoffPaginationData() {
            if (!this.data) {
                return null;
            }
            return {
                currentPage: this.data.currentPage,
                lastPage: this.data.lastPage,
                perPage: this.perPage,
                perPageOptions: this.perPageOptions,
            };
        },
        writeoffCardsToolbar() {
            const filtersVisible = !this.returnsOnly;
            return {
                showFilters: filtersVisible,
                hasActiveFilters: filtersVisible && this.hasActiveFilters,
                activeFiltersCount: filtersVisible ? this.getActiveFiltersCount() : 0,
                onFiltersReset: this.resetFilters,
                showPagination: true,
                paginationData: this.writeoffPaginationData,
                onPageChange: this.fetchItems,
                onPerPageChange: this.handlePerPageChange,
            };
        },
        cardConfigBase() {
            return [
                { name: 'title', label: null },
                { name: 'dateUser', label: 'dateUser', icon: 'fas fa-calendar text-[#3571A4]' },
                { name: 'warehouseName', label: 'warehouse', icon: 'fas fa-warehouse text-[#3571A4]' },
                { name: 'reason', label: 'writeoffReason', icon: 'fas fa-list-ul text-[#3571A4]' },
                { name: 'products', label: 'products', icon: 'fas fa-box text-[#3571A4]' },
                { name: 'note', label: 'note', icon: 'fas fa-sticky-note text-[#3571A4]' },
            ];
        },
        cardConfigMerged() {
            const title = { name: 'title', label: null };
            const rest = (this.cardFields || []).map((f) => ({ ...f, visible: f.visible }));
            return [title, ...rest];
        },
        searchQuery() {
            return this.$store.state.searchQuery;
        },
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
        eventBus.on('global-search', this.handleSearch);
    },

    mounted() {
        this.fetchItems();
    },
    beforeUnmount() {
        eventBus.off('global-search', this.handleSearch);
    },
    methods: {
        async showModal(item = null) {
            this.resetTimelineSidebar();
            if (item?.id) {
                try {
                    item = await WarehouseWriteoffController.getItem(item.id);
                } catch {
                }
            }
            modalMixin.methods.showModal.call(this, item);
        },
        closeModal(skipScrollRestore = false) {
            modalMixin.methods.closeModal.call(this, skipScrollRestore);
            this.resetTimelineSidebar();
        },
        timelineUnreadBadgeHtml(entityId) {
            const count = this.getTimelineUnreadCount(entityId);
            if (count <= 0) {
                return '';
            }
            return `<span class="inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-[var(--color-danger)] px-1.5 text-[10px] font-semibold leading-none text-white">${count}</span>`;
        },
        writeoffCardTitlePrefix() {
            const icon = this.returnsOnly ? 'fa-rotate-left' : 'fa-eraser';
            return `<i class="fas ${icon} text-[#3571A4] mr-1.5 flex-shrink-0"></i>`;
        },
        writeoffCardMapper(item, fieldName) {
            if (!item) {
                return '';
            }
            if (fieldName === 'title') {
                return `#${item.id}${this.timelineUnreadBadgeHtml(item.id)}`;
            }
            return this.itemMapper(item, fieldName) ?? '';
        },
        itemMapper(i, c) {
            const search = this.searchQuery;

            switch (c) {
                case 'id': {
                    const badge = this.timelineUnreadBadgeHtml(i?.id);
                    const idValue = String(i?.id ?? '');
                    return `${search ? highlightMatches(idValue, search) : idValue}${badge}`;
                }
                case 'dateUser':
                    return typeof i?.formatDateUser === 'function' ? i.formatDateUser() : '-';
                case 'note':
                    return search ? highlightMatches(i?.note ?? '', search) : (i?.note ?? '');
                case 'products':
                    return (i.products || []).length;
                case 'reason':
                    return this.writeoffReasonLabel(i.reason);
                default:
                    return i[c];
            }
        },
        writeoffReasonLabel(code) {
            return this.$t(getWriteoffReasonLabelKey(code));
        },
        writeoffListFilterParams() {
            const base = this.returnsOnly
                ? { reason: 'return_supplier' }
                : { exclude_reason: 'return_supplier', ...(this.reasonFilter ? { reason: this.reasonFilter } : {}) };
            return { ...base, ...(this.searchQuery ? { search: this.searchQuery } : {}) };
        },
        resetFilters() {
            if (this.returnsOnly) {
                return;
            }
            this.reasonFilter = '';
            this.fetchItems(1, true);
        },
        getActiveFiltersCount() {
            if (this.returnsOnly) {
                return 0;
            }
            return this.getActiveFiltersCountFromConfig([
                { value: this.reasonFilter, defaultValue: '' },
            ]);
        },
        handleCompanyChanged(companyId, previousCompanyId) {
            if (!this.returnsOnly) {
                this.reasonFilter = '';
            }
            this.fetchItems(1, previousCompanyId == null);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                this.data = await WarehouseWriteoffController.getItems(page, this.perPage, this.writeoffListFilterParams());
                const items = this.data?.items || [];
                await this.fetchTimelineUnreadCounts('wh_writeoff', items.map((row) => row.id));
                this.applyTimelineUnreadCounts(items);
            } catch (error) {
                const text = this.apiErrorLinesAsString(error);
                this.showNotification(this.$t('errorLoadingWriteoffs'), text || this.$t('error'), true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        async toggleTimeline() {
            const willOpen = this.timelineCollapsed;
            timelineSideModalMixin.methods.toggleTimeline.call(this);
            if (!willOpen || !this.editingItem?.id) {
                return;
            }
            await this.markTimelineEntityAsRead('wh_writeoff', this.editingItem.id);
            this.applyTimelineUnreadCounts(this.data?.items || []);
        },
        handleWriteoffRefreshed(dto) {
            if (dto?.id && Number(dto.id) === Number(this.editingItem?.id)) {
                this.editingItem = dto;
            }
        },
    }
}
</script>
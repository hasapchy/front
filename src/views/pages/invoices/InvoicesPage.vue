<template>
  <div>
    <transition name="fade" mode="out-in">
      <CardListViewShell v-if="isDataReady && (displayViewMode === 'table' || displayViewMode === 'cards')"
        :key="cardListShellKey" :display-view-mode="displayViewMode" :cards-toolbar="cardsToolbar">
        <template #table>
          <DraggableTable table-key="admin.invoices" :columns-config="columnsConfig" :table-data="data.items"
            :item-mapper="itemMapper" :on-item-click="onItemClick" @selection-change="selectedIds = $event">
            <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
              <TableControlsBar :show-filters="true" :has-active-filters="hasActiveFilters"
                :active-filters-count="getActiveFiltersCount()" :on-filters-reset="resetFilters" :show-pagination="true"
                :pagination-data="data ? { currentPage: data.currentPage, lastPage: data.lastPage, perPage: perPage, perPageOptions: perPageOptions } : null"
                :on-page-change="fetchItems" :on-per-page-change="handlePerPageChange" :reset-columns="resetColumns"
                :columns="columns" :toggle-visible="toggleVisible" :log="log">
                <template #left>
                  <PrimaryButton :onclick="() => showModal(null)" icon="fas fa-plus"
                    :disabled="!$store.getters.hasPermission('invoices_create')" />

                  <transition name="fade">
                    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds"
                      :batch-actions="getBatchActions()" />
                  </transition>
                  <ViewModeToggle :view-mode="displayViewMode" :show-kanban="false" :show-cards="true"
                    @change="changeViewMode" />
                  <FiltersContainer :has-active-filters="hasActiveFilters"
                    :active-filters-count="getActiveFiltersCount()" @reset="resetFilters" @apply="applyFilters">
                    <div>
                      <label class="block mb-2 text-xs font-semibold">{{ $t('dateFilter')
                        }}</label>
                      <select v-model="dateFilter" class="w-full">
                        <option value="all_time">
                          {{ $t('allTime') }}
                        </option>
                        <option value="today">
                          {{ $t('today') }}
                        </option>
                        <option value="yesterday">
                          {{ $t('yesterday') }}
                        </option>
                        <option value="this_week">
                          {{ $t('thisWeek') }}
                        </option>
                        <option value="this_month">
                          {{ $t('thisMonth') }}
                        </option>
                        <option value="last_week">
                          {{ $t('lastWeek') }}
                        </option>
                        <option value="last_month">
                          {{ $t('lastMonth') }}
                        </option>
                        <option value="custom">
                          {{ $t('selectDates') }}
                        </option>
                      </select>
                    </div>

                    <div v-if="dateFilter === 'custom'" class="space-y-2">
                      <div>
                        <label class="block mb-2 text-xs font-semibold">{{ $t('startDate') }}</label>
                        <input v-model="startDate" type="date" class="w-full">
                      </div>
                      <div>
                        <label class="block mb-2 text-xs font-semibold">{{ $t('endDate') }}</label>
                        <input v-model="endDate" type="date" class="w-full">
                      </div>
                    </div>

                    <div>
                      <label class="block mb-2 text-xs font-semibold">{{ $t('status') }}</label>
                      <select v-model="statusFilter" class="w-full">
                        <option value="">
                          {{ $t('allStatuses') }}
                        </option>
                        <option value="new">
                          {{ $t('new') }}
                        </option>
                        <option value="in_progress">
                          {{ $t('inProgress') }}
                        </option>
                        <option value="paid">
                          {{ $t('paid') }}
                        </option>
                        <option value="cancelled">
                          {{ $t('cancelled') }}
                        </option>
                      </select>
                    </div>
                  </FiltersContainer>
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
          <PrimaryButton :onclick="() => showModal(null)" icon="fas fa-plus"
            :disabled="!$store.getters.hasPermission('invoices_create')" />
          <transition name="fade">
            <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
          </transition>
          <ViewModeToggle :view-mode="displayViewMode" :show-kanban="false" :show-cards="true"
            @change="changeViewMode" />
          <FiltersContainer :has-active-filters="hasActiveFilters" :active-filters-count="getActiveFiltersCount()"
            @reset="resetFilters" @apply="applyFilters">
            <div>
              <label class="block mb-2 text-xs font-semibold">{{ $t('dateFilter') }}</label>
              <select v-model="dateFilter" class="w-full">
                <option value="all_time">
                  {{ $t('allTime') }}
                </option>
                <option value="today">
                  {{ $t('today') }}
                </option>
                <option value="yesterday">
                  {{ $t('yesterday') }}
                </option>
                <option value="this_week">
                  {{ $t('thisWeek') }}
                </option>
                <option value="this_month">
                  {{ $t('thisMonth') }}
                </option>
                <option value="last_week">
                  {{ $t('lastWeek') }}
                </option>
                <option value="last_month">
                  {{ $t('lastMonth') }}
                </option>
                <option value="custom">
                  {{ $t('selectDates') }}
                </option>
              </select>
            </div>
            <div v-if="dateFilter === 'custom'" class="space-y-2">
              <div>
                <label class="block mb-2 text-xs font-semibold">{{ $t('startDate') }}</label>
                <input v-model="startDate" type="date" class="w-full">
              </div>
              <div>
                <label class="block mb-2 text-xs font-semibold">{{ $t('endDate') }}</label>
                <input v-model="endDate" type="date" class="w-full">
              </div>
            </div>
            <div>
              <label class="block mb-2 text-xs font-semibold">{{ $t('status') }}</label>
              <select v-model="statusFilter" class="w-full">
                <option value="">
                  {{ $t('allStatuses') }}
                </option>
                <option value="new">
                  {{ $t('new') }}
                </option>
                <option value="in_progress">
                  {{ $t('inProgress') }}
                </option>
                <option value="paid">
                  {{ $t('paid') }}
                </option>
                <option value="cancelled">
                  {{ $t('cancelled') }}
                </option>
              </select>
            </div>
          </FiltersContainer>
        </template>
        <template #card-bar-gear>
          <CardFieldsGearMenu :card-fields="cardFields" :on-reset="resetCardFields" @toggle="toggleCardFieldVisible" />
        </template>
        <template #cards>
          <MapperCardGrid class="mt-4" :items="data.items" :card-config="cardConfigMerged"
            :card-mapper="invoiceCardMapper" title-field="title" :title-prefix="invoiceCardTitlePrefix"
            :selected-ids="selectedIds" :show-checkbox="$store.getters.hasPermission('invoices_delete')"
            @dblclick="onItemClick" @select-toggle="toggleSelectRow" />
        </template>
      </CardListViewShell>
      <div v-else key="loader" class="min-h-64">
        <TableSkeleton v-if="displayViewMode === 'table'" />
        <CardsSkeleton v-else />
      </div>
    </transition>

    <SideModalDialog :show-form="modalDialog" :title="sideModalCrudTitle('sideModalGenInvoice', 'sideModalNomInvoice')"
      :onclose="handleModalClose">
      <InvoiceCreatePage v-if="modalDialog" :key="editingItem ? editingItem.id : 'new-invoice'"
        ref="invoicecreatepageForm" :editing-item="editingItem" :preselected-order-ids="preselectedOrderIds"
        @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
        @deleted-error="handleDeletedError" @close-request="closeModal" />
    </SideModalDialog>

    <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDeleteSelected')} (${selectedIds.length})?`"
      :confirm-text="$t('deleteSelected')" :leave-text="$t('cancel')" @confirm="confirmDeleteItems"
      @leave="deleteDialog = false" />
  </div>
</template>

<script>
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import { VueDraggableNext } from 'vue-draggable-next';
import InvoiceController from "@/api/InvoiceController";
import InvoiceCreatePage from "@/views/pages/invoices/InvoiceCreatePage.vue";
import ClientButtonCell from "@/views/components/app/buttons/ClientButtonCell.vue";
import ProductsListCell from "@/views/components/app/buttons/ProductsListCell.vue";
import { markRaw } from "vue";
import { getClientDisplayName, getClientDisplayPosition } from '@/utils/displayUtils';
import BatchButton from "@/views/components/app/buttons/BatchButton.vue";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import crudEventMixin from "@/mixins/crudEventMixin";
import notificationMixin from "@/mixins/notificationMixin";
import batchActionsMixin from "@/mixins/batchActionsMixin";
import modalMixin from "@/mixins/modalMixin";
import AlertDialog from "@/views/components/app/dialog/AlertDialog.vue";
import { eventBus } from "@/eventBus";
import companyChangeMixin from "@/mixins/companyChangeMixin";
import TableSkeleton from "@/views/components/app/TableSkeleton.vue";
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';

import listQueryMixin from "@/mixins/listQueryMixin";
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';

const invoicesViewModeMixin = createStoreViewModeMixin({
  getter: 'invoicesViewMode',
  dispatch: 'setInvoicesViewMode',
  modes: ['table', 'cards'],
});

export default {
  components: {
    SideModalDialog,
    PrimaryButton,
    DraggableTable,
    InvoiceCreatePage,
    BatchButton,
    AlertDialog,
    FiltersContainer,
    TableControlsBar,
    TableFilterButton,
    TableSkeleton,
    ViewModeToggle,
    MapperCardGrid,
    CardListViewShell,
    CardFieldsGearMenu,
    CardsSkeleton,
    draggable: VueDraggableNext
  },
  mixins: [getApiErrorMessage, crudEventMixin, notificationMixin, modalMixin, batchActionsMixin, companyChangeMixin, listQueryMixin, cardFieldsVisibilityMixin, invoicesViewModeMixin],
  data() {
    return {
      cardFieldsKey: 'admin.invoices.cards',
      titleField: 'title',
      editingItem: null,
      loadingDelete: false,
      controller: InvoiceController,
      cacheInvalidationType: 'invoices',
      itemViewRouteName: 'InvoiceView',
      baseRouteName: 'Invoices',
      errorGettingItemText: this.$t('errorGettingInvoiceList'),
      savedSuccessText: this.$t('invoiceSaved'),
      savedErrorText: this.$t('errorSavingInvoice'),
      deletedSuccessText: this.$t('invoiceDeleted'),
      deletedErrorText: this.$t('errorDeletingInvoice'),
      columnsConfig: [
        { name: 'select', label: '#', size: 15 },
        { name: "id", label: "№", size: 20 },
        { name: "invoiceNumber", label: 'invoiceNumber' },
        { name: "invoiceDate", label: 'invoiceDate' },
        { name: "client", label: 'client', component: markRaw(ClientButtonCell), props: (i) => ({ client: i.client, }), },
        { name: "status", label: 'status', html: true },
        {
          name: "products",
          label: 'products',
          component: markRaw(ProductsListCell),
          props: (item) => ({
            products: item.products || [],
            maxItems: 3
          })
        },
        { name: "totalAmount", label: 'amount' },
        { name: "ordersCount", label: 'ordersCount' },
        { name: "note", label: 'note' },
      ],
      dateFilter: 'all_time',
      startDate: null,
      endDate: null,
      statusFilter: '',
      preselectedOrderIds: []
    };
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
      return this.dateFilter !== 'all_time' ||
        this.statusFilter !== '' ||
        this.startDate !== null ||
        this.endDate !== null;
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
        { name: 'invoiceDate', label: 'invoiceDate', icon: 'fas fa-calendar text-[#3571A4]' },
        { name: 'client', label: 'client', icon: 'fas fa-user text-[#3571A4]', html: true },
        { name: 'status', label: 'status', icon: 'fas fa-info-circle text-[#3571A4]', html: true },
        { name: 'products', label: 'products', icon: 'fas fa-box text-[#3571A4]' },
        { name: 'ordersCount', label: 'ordersCount', icon: 'fas fa-list text-[#3571A4]' },
        { name: 'note', label: 'note', icon: 'fas fa-sticky-note text-[#3571A4]' },
        { name: 'totalAmount', label: 'amount', icon: 'fas fa-money-bill text-[#3571A4]', slot: 'footer', html: true },
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
        if (this.preselectedOrderIds.length > 0) {
          this.$nextTick(() => {
            this.showModal(null);
          });
        }
      }
    }
  },
  created() {
    this.$store.commit("SET_SETTINGS_OPEN", false);

    eventBus.on('global-search', this.handleSearch);

    if (this.$route.query.create === 'true' && this.$route.query.order_ids) {
      this.preselectedOrderIds = this.$route.query.order_ids.split(',').map(id => parseInt(id));
    }
  },

  mounted() {
    this.fetchItems();
  },

  beforeUnmount() {
    eventBus.off('global-search', this.handleSearch);
  },
  methods: {
    itemMapper(i, c) {
      switch (c) {
        case "invoiceDate":
          return i.formatDate();
        case "products":
          // Возвращаем количество продуктов для сортировки (отображение через компонент ProductsListCell)
          return (i.products || []).length;
        case "client": {
          if (!i.client) return '<span class="text-gray-500">' + this.$t('notSpecified') + '</span>';
          const invClientName = getClientDisplayName(i.client) || this.$t('notSpecified');
          const invClientPosition = getClientDisplayPosition(i.client);
          const invPhone = i.client.phones?.[0]?.phone;
          const invPositionPart = invClientPosition ? `<div class="text-xs text-gray-500">${invClientPosition}</div>` : '';
          const invPhonePart = invPhone ? ` (<span>${invPhone}</span>)` : '';
          return invPositionPart || invPhonePart ? `<div>${invClientName}${invPositionPart}${invPhonePart}</div>` : invClientName;
        }
        case "status":
          return `<span class="px-2 py-1 rounded text-xs ${i.getStatusClass()}">${i.getStatusLabel(this.$t)}</span>`;
        case "totalAmount":
          return i.amountInfo();
        case "ordersCount":
          return i.getOrdersCount();
        case "note":
          return i.note || "";

        default:
          return i[c];
      }
    },

    handlePerPageChange(newPerPage) {
      this.perPage = newPerPage;
      this.fetchItems(1, false);
    },
    async handleCompanyChanged(companyId, previousCompanyId) {
      this.dateFilter = 'all_time';
      this.startDate = null;
      this.endDate = null;
      this.statusFilter = '';
      this.selectedIds = [];
      await this.fetchItems(1, previousCompanyId == null);
    },
    async fetchItems(page = 1, silent = false) {
      if (!silent) this.loading = true;
      try {
        this.data = await InvoiceController.getItems(page, this.searchQuery, this.dateFilter, this.startDate, this.endDate, null, this.statusFilter, this.perPage);
      } catch (error) {
        this.showNotification(this.$t('errorGettingInvoiceList'), error.message, true);
      }
      if (!silent) this.loading = false;
    },

    closeModal(skipScrollRestore = false) {
      modalMixin.methods.closeModal.call(this, skipScrollRestore);
      if (this.$route.params.id) {
        this.$router.replace({ name: 'Invoices' });
      }
    },
    resetFilters() {
      this.resetFiltersFromConfig({
        dateFilter: 'all_time',
        startDate: '',
        endDate: '',
        statusFilter: ''
      });
    },
    getActiveFiltersCount() {
      return this.getActiveFiltersCountFromConfig([
        { value: this.dateFilter, defaultValue: 'all_time' },
        { value: this.statusFilter, defaultValue: '' },
        { value: this.startDate, defaultValue: null },
        { value: this.endDate, defaultValue: null }
      ]);
    },
    invoiceCardTitlePrefix() {
      return '<i class="fas fa-file-invoice text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
    },
    invoiceCardMapper(item, fieldName) {
      if (!item) return '';
      if (fieldName === 'title') {
        const n = item.invoiceNumber ?? item.id;
        return `${this.$t('invoiceNumber')}${this.$t('symbolEmDash')}${n}`;
      }
      if (fieldName === 'products') {
        return String((item.products || []).length);
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

  }
};
</script>

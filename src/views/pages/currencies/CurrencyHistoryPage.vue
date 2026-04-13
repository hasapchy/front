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
            table-key="settings.currency_history"
            :columns-config="columnsConfig"
            :table-data="data.items"
            :item-mapper="itemMapper"
            :on-item-click="(i) => { showModal(i) }"
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
                    :onclick="() => showModal(null)"
                    icon="fas fa-plus"
                    :disabled="!selectedCurrency || !$store.getters.hasPermission('currency_history_create')"
                  />
                  <transition name="fade">
                    <BatchButton
                      v-if="selectedIds.length"
                      :selected-ids="selectedIds"
                      :batch-actions="getBatchActions()"
                    />
                  </transition>
                  <FiltersContainer
                    :has-active-filters="hasActiveFilters"
                    :active-filters-count="getActiveFiltersCount()"
                    @reset="resetFilters"
                    @apply="applyFilters"
                  >
                    <div>
                      <label class="block mb-2 text-xs font-semibold">{{ $t('currency') }}</label>
                      <select
                        v-model="selectedCurrencyId"
                        class="w-full"
                      >
                        <option value="">
                          {{ $t('selectCurrency') }}
                        </option>
                        <option
                          v-for="currency in currencies"
                          :key="currency.id"
                          :value="currency.id"
                        >
                          {{ currency.symbol }} - {{ translateCurrency(currency.name, $t) }} ({{ currency.current_rate }})
                        </option>
                      </select>
                    </div>
                  </FiltersContainer>
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
            :onclick="() => showModal(null)"
            icon="fas fa-plus"
            :disabled="!selectedCurrency || !$store.getters.hasPermission('currency_history_create')"
          />
          <transition name="fade">
            <BatchButton
              v-if="selectedIds.length"
              :selected-ids="selectedIds"
              :batch-actions="getBatchActions()"
            />
          </transition>
          <FiltersContainer
            :has-active-filters="hasActiveFilters"
            :active-filters-count="getActiveFiltersCount()"
            @reset="resetFilters"
            @apply="applyFilters"
          >
            <div>
              <label class="block mb-2 text-xs font-semibold">{{ $t('currency') }}</label>
              <select
                v-model="selectedCurrencyId"
                class="w-full"
              >
                <option value="">
                  {{ $t('selectCurrency') }}
                </option>
                <option
                  v-for="currency in currencies"
                  :key="currency.id"
                  :value="currency.id"
                >
                  {{ currency.symbol }} - {{ translateCurrency(currency.name, $t) }} ({{ currency.current_rate }})
                </option>
              </select>
            </div>
          </FiltersContainer>
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
            :card-mapper="currencyHistoryCardMapper"
            title-field="title"
            :title-prefix="currencyHistoryCardTitlePrefix"
            :selected-ids="selectedIds"
            :show-checkbox="$store.getters.hasPermission('currency_history_delete')"
            @dblclick="(i) => { showModal(i) }"
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
      :title="sideModalCrudTitle('sideModalGenExchangeRate', 'sideModalNomExchangeRate')"
      :onclose="handleModalClose"
    >
      <CurrencyHistoryCreatePage
        ref="currencyHistoryForm"
        :editing-item="editingItem"
        :currency="selectedCurrency || (editingItem && editingItem.currency) || null"
        @saved="handleSaved"
        @saved-error="handleSavedError"
        @deleted="handleDeleted"
        @deleted-error="handleDeletedError"
        @close-request="closeModal"
      />
    </SideModalDialog>

    <AlertDialog
      :dialog="deleteDialog"
      :descr="`${$t('confirmDeleteExchangeRate')} (${selectedIds.length})?`"
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
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import CurrencyHistoryController from '@/api/CurrencyHistoryController';
import CurrencyHistoryCreatePage from './CurrencyHistoryCreatePage.vue';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import { translateCurrency } from '@/utils/translationUtils';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';
import listQueryMixin from '@/mixins/listQueryMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';

const currencyHistoryListViewModeMixin = createStoreViewModeMixin({
  listPageKey: 'currencyHistory',
  modes: ['table', 'cards'],
});

export default {
  components: {
    PrimaryButton,
    SideModalDialog,
    DraggableTable,
    CurrencyHistoryCreatePage,
    BatchButton,
    AlertDialog,
    TableControlsBar,
    TableFilterButton,
    FiltersContainer,
    TableSkeleton,
    CardsSkeleton,
    ViewModeToggle,
    MapperCardGrid,
    CardListViewShell,
    CardFieldsGearMenu,
    draggable: VueDraggableNext,
  },
  mixins: [
    batchActionsMixin,
    crudEventMixin,
    notificationMixin,
    modalMixin,
    getApiErrorMessageMixin,
    listQueryMixin,
    cardFieldsVisibilityMixin,
    currencyHistoryListViewModeMixin,
  ],
  data() {
    return {
      cardFieldsKey: 'settings.currency_history.cards',
      titleField: 'title',
      currencies: [],
      selectedCurrencyId: '',
      selectedCurrency: null,
      controller: CurrencyHistoryController,
      deletePermission: 'currency_history_delete',
      showStatusSelect: false,
      savedSuccessText: this.$t('exchangeRateSaved'),
      savedErrorText: this.$t('errorSavingExchangeRate'),
      deletedSuccessText: this.$t('exchangeRateDeleted'),
      deletedErrorText: this.$t('errorDeletingExchangeRate'),
      columnsConfig: [
        { name: 'select', label: '#', size: 15 },
        { name: 'id', label: 'number', size: 60 },
        { name: 'currency', label: 'currency', size: 140 },
        { name: 'exchangeRate', label: 'exchangeRate', size: 120 },
        { name: 'startDate', label: 'startDate', size: 120 },
        { name: 'endDate', label: 'endDate', size: 120 },
        { name: 'duration', label: 'duration', size: 100 },
        { name: 'status', label: 'status', size: 100, html: true },
      ],
    };
  },
  computed: {
    hasActiveFilters() {
      return this.getActiveFiltersCount() > 0;
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
        perPageOptions: this.perPageOptions,
      };
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
        { name: 'currency', label: 'currency', icon: 'fas fa-coins text-[#3571A4]' },
        { name: 'exchangeRate', label: 'exchangeRate', icon: 'fas fa-exchange-alt text-[#3571A4]' },
        { name: 'startDate', label: 'startDate', icon: 'fas fa-calendar text-[#3571A4]' },
        { name: 'endDate', label: 'endDate', icon: 'fas fa-calendar text-[#3571A4]' },
        { name: 'duration', label: 'duration', icon: 'fas fa-clock text-[#3571A4]' },
        { name: 'status', label: 'status', icon: 'fas fa-toggle-on text-[#3571A4]' },
      ];
    },
    cardConfigMerged() {
      const title = { name: 'title', label: null };
      const rest = (this.cardFields || []).map((f) => ({ ...f, visible: f.visible }));
      return [title, ...rest];
    },
  },
  watch: {
    selectedCurrencyId() {
      this.fetchItems(1, false);
    },
  },
  created() {
    this.$store.commit('SET_SETTINGS_OPEN', false);
  },
  async mounted() {
    await this.fetchCurrencies();
    await this.fetchItems(1, false);
  },
  methods: {
    translateCurrency,
    applyFilters() {
      this.fetchItems(1, false);
    },
    currencyHistoryCardTitlePrefix() {
      return '<i class="fas fa-chart-line text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
    },
    currencyHistoryCardMapper(item, fieldName) {
      if (!item) return '';
      if (fieldName === 'title') {
        return String(item.id);
      }
      if (fieldName === 'status') {
        return item.isActive() ? this.$t('active') : this.$t('inactive');
      }
      return this.itemMapper(item, fieldName) ?? '';
    },
    toggleSelectRow(id) {
      if (!id) return;
      if (this.selectedIds.includes(id)) {
        this.selectedIds = this.selectedIds.filter((x) => x !== id);
      } else {
        this.selectedIds = [...this.selectedIds, id];
      }
    },
    async fetchCurrencies() {
      try {
        this.currencies = await CurrencyHistoryController.getCurrenciesWithRates();
      } catch (error) {
        this.showNotification(this.$t('errorLoadingCurrencies'), error.message, true);
      }
    },
    itemMapper(i, c) {
      switch (c) {
        case 'currency':
          if (i.currency) {
            return `${i.currency.symbol} - ${this.translateCurrency(i.currency.name, this.$t)}`;
          }
          if (this.selectedCurrency) {
            return `${this.selectedCurrency.symbol} - ${this.translateCurrency(this.selectedCurrency.name, this.$t)}`;
          }
          return '-';
        case 'exchangeRate':
          return i.formatExchangeRate();
        case 'startDate':
          return i.formatStartDate();
        case 'endDate':
          return i.formatEndDate();
        case 'duration':
          return i.getDuration();
        case 'status':
          return i.isActive()
            ? '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">' + this.$t('active') + '</span>'
            : '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">' + this.$t('inactive') + '</span>';
        default:
          return i[c];
      }
    },
    async fetchItems(page = 1, silent = false) {
      if (!silent) {
        this.loading = true;
      }
      try {
        if (this.selectedCurrencyId) {
          const currency = this.currencies.find((c) => c.id == this.selectedCurrencyId);
          this.selectedCurrency = currency || null;
          const historyData = await CurrencyHistoryController.getItems(this.selectedCurrencyId, page, this.perPage);
          this.data = {
            items: historyData.history,
            currentPage: historyData.currentPage,
            lastPage: historyData.lastPage,
          };
        } else {
          this.selectedCurrency = null;
          const historyData = await CurrencyHistoryController.getAllItems(page, this.perPage);
          this.data = {
            items: historyData.history,
            currentPage: historyData.currentPage,
            lastPage: historyData.lastPage,
          };
        }
      } catch (error) {
        this.showNotification(this.$t('errorLoadingHistory'), error.message, true);
      } finally {
        if (!silent) {
          this.loading = false;
        }
      }
    },
    resetFilters() {
      this.resetFiltersFromConfig(
        {
          selectedCurrencyId: '',
        },
        () => {
          this.selectedCurrency = null;
          this.fetchItems(1, false);
        },
      );
    },
    getActiveFiltersCount() {
      return this.getActiveFiltersCountFromConfig([
        { value: this.selectedCurrencyId, defaultValue: '' },
      ]);
    },
  },
};
</script>

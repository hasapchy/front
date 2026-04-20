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
            table-key="settings.currencies"
            :columns-config="columnsConfig"
            :table-data="data.items"
            :item-mapper="itemMapper"
          >
            <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
              <TableControlsBar
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
                  <ViewModeToggle
                    :view-mode="displayViewMode"
                    :show-kanban="false"
                    :show-cards="true"
                    @change="changeViewMode"
                  />
                </template>
                <template #gear="gearSlot">
                  <TableFilterButton
                    v-if="gearSlot.columns && gearSlot.columns.length"
                    :on-reset="gearSlot.resetColumns"
                  >
                    <ul>
                      <draggable
                        v-if="gearSlot.columns.length"
                        class="dragArea list-group w-full"
                        :list="gearSlot.columns"
                        @change="gearSlot.log"
                      >
                        <li
                          v-for="(element, index) in gearSlot.columns"
                          v-show="element.name !== 'select'"
                          :key="element.name"
                          class="flex items-center hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)] p-2 rounded"
                          @click="gearSlot.toggleVisible(index)"
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
            :card-mapper="currencyCardMapper"
            title-field="title"
            :title-prefix="currencyCardTitlePrefix"
            :show-checkbox="false"
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
  </div>
</template>

<script>
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import CurrenciesCatalogController from '@/api/CurrenciesController';
import crudEventMixin from '@/mixins/crudEventMixin';
import notificationMixin from '@/mixins/notificationMixin';
import { translateCurrency } from '@/utils/translationUtils';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';

const currenciesListViewModeMixin = createStoreViewModeMixin({
    listPageKey: 'currencies',
    modes: ['table', 'cards'],
});

export default {
    components: {
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
    mixins: [crudEventMixin, notificationMixin, cardFieldsVisibilityMixin, currenciesListViewModeMixin],
    data() {
        return {
            cardFieldsKey: 'settings.currencies.cards',
            titleField: 'title',
            columnsConfig: [
                { name: 'code', label: 'code', size: 72 },
                { name: 'name', label: 'name' },
                { name: 'symbol', label: 'currencySymbol', size: 72 },
                { name: 'scope', label: 'currencyScope', size: 100 },
                { name: 'isDefault', label: 'currencyIsDefault', size: 100 },
                { name: 'isReport', label: 'currencyIsReport', size: 100 },
                { name: 'currentExchangeRate', label: 'currentRate', size: 110 },
                { name: 'rateStartDate', label: 'startDate', size: 110 },
                { name: 'status', label: 'status', size: 100, html: true },
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
                { name: 'symbol', label: 'currencySymbol', icon: 'fas fa-dollar-sign text-[#3571A4]' },
                { name: 'scope', label: 'currencyScope', icon: 'fas fa-globe text-[#3571A4]' },
                { name: 'isDefault', label: 'currencyIsDefault', icon: 'fas fa-star text-[#3571A4]' },
                { name: 'isReport', label: 'currencyIsReport', icon: 'fas fa-chart-pie text-[#3571A4]' },
                { name: 'currentExchangeRate', label: 'currentRate', icon: 'fas fa-exchange-alt text-[#3571A4]' },
                { name: 'rateStartDate', label: 'startDate', icon: 'fas fa-calendar text-[#3571A4]' },
                { name: 'status', label: 'status', icon: 'fas fa-toggle-on text-[#3571A4]', html: true },
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
    async mounted() {
        await this.fetchItems(1, false);
    },
    methods: {
        translateCurrency,
        currencyCardTitlePrefix() {
            return '<i class="fas fa-coins text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
        },
        currencyCardMapper(item, fieldName) {
            if (!item) return '';
            if (fieldName === 'title') {
                const label = this.translateCurrency(item.name, this.$t) || item.name || item.code || String(item.id);
                return `${item.code}${this.$t('symbolEmDash')}${label}`;
            }
            return this.itemMapper(item, fieldName) ?? '';
        },
        itemMapper(i, c) {
            switch (c) {
                case 'name':
                    return this.translateCurrency(i.name, this.$t) || i.name || '';
                case 'scope':
                    return i.formatScope(this.$t.bind(this));
                case 'isDefault':
                    return i.isDefault ? this.$t('yes') : this.$t('no');
                case 'isReport':
                    return i.isReport ? this.$t('yes') : this.$t('no');
                case 'currentExchangeRate':
                    return i.formatCurrentExchangeRate();
                case 'rateStartDate':
                    return i.formatRateStartDate();
                case 'status':
                    return i.formatStatusActive(this.$t.bind(this)) === this.$t('active')
                        ? '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">' +
                              this.$t('active') +
                              '</span>'
                        : '<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">' +
                              this.$t('inactive') +
                              '</span>';
                default:
                    return i[c];
            }
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                this.data = await CurrenciesCatalogController.getItems(page, this.perPage);
            } catch (error) {
                this.showNotification(this.$t('errorLoadingCurrencies'), error.message, true);
            } finally {
                if (!silent) {
                    this.loading = false;
                }
            }
        },
    },
};
</script>

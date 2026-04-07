<template>
  <div>
    <MutualSettlementsBalanceWrapper
      :data="clientBalances"
      :loading="clientBalancesLoading"
      :currency-symbol="selectedCurrencySymbol"
      :active-filter="activeDebtDirection"
      @filter-change="handleDebtDirectionFilterChange"
    />

    <transition
      name="fade"
      mode="out-in"
    >
      <CardListViewShell
        v-if="isMutualListReady && (displayViewMode === 'table' || displayViewMode === 'cards')"
        :key="cardListShellKey"
        :display-view-mode="displayViewMode"
        :cards-toolbar="mutualCardsToolbar"
      >
        <template #table>
          <DraggableTable
            table-key="mutual_settlements.clients"
            :columns-config="columnsConfig"
            :table-data="clientBalances"
            :item-mapper="itemMapper"
            :on-item-click="handleRowClick"
          >
            <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
              <TableControlsBar
                :show-filters="true"
                :has-active-filters="hasActiveFilters"
                :active-filters-count="getActiveFiltersCount()"
                :on-filters-reset="resetFilters"
                :show-pagination="false"
                :reset-columns="resetColumns"
                :columns="columns"
                :toggle-visible="toggleVisible"
                :log="log"
              >
                <template #left>
                  <FiltersContainer
                  :has-active-filters="hasActiveFilters"
                  :active-filters-count="getActiveFiltersCount()"
                  @reset="resetFilters"
                  @apply="applyFilters"
                >
                  <div v-if="currencies.length">
                    <label class="block mb-2 text-xs font-semibold">{{ $t('currency') }}</label>
                    <select
                      :value="effectiveCurrencyId"
                      class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                      @input="onCurrencyFilterInput"
                    >
                      <option
                        v-for="c in currencies"
                        :key="c.id"
                        :value="c.id"
                      >
                        {{ c.symbol }} ({{ c.name }})
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="block mb-2 text-xs font-semibold">{{ $t('paymentType') }}</label>
                    <CheckboxFilter
                      class="w-full"
                      :model-value="balanceTypeFilter"
                      :options="balanceTypeOptions"
                      placeholder="all"
                      @update:model-value="handleBalanceTypeChange($event)"
                    />
                  </div>
                  <div>
                    <label class="block mb-2 text-xs font-semibold">{{ $t('contactType') }}</label>
                    <CheckboxFilter
                      class="w-full"
                      :model-value="clientTypeFilter"
                      :options="clientTypeOptions"
                      placeholder="all"
                      @update:model-value="handleClientTypeChange($event)"
                    />
                  </div>
                  <div>
                    <label class="block mb-2 text-xs font-semibold">{{ $t('type') }}</label>
                    <CheckboxFilter
                      class="w-full"
                      :model-value="debtDirectionFilter"
                      :options="debtDirectionOptions"
                      placeholder="all"
                      @update:model-value="handleDebtDirectionFilterChangeFromDropdown($event)"
                    />
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
          <FiltersContainer
            :has-active-filters="hasActiveFilters"
            :active-filters-count="getActiveFiltersCount()"
            @reset="resetFilters"
            @apply="applyFilters"
          >
            <div v-if="currencies.length">
              <label class="block mb-2 text-xs font-semibold">{{ $t('currency') }}</label>
              <select
                :value="effectiveCurrencyId"
                class="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                @input="onCurrencyFilterInput"
              >
                <option
                  v-for="c in currencies"
                  :key="c.id"
                  :value="c.id"
                >
                  {{ c.symbol }} ({{ c.name }})
                </option>
              </select>
            </div>
            <div>
              <label class="block mb-2 text-xs font-semibold">{{ $t('paymentType') }}</label>
              <CheckboxFilter
                class="w-full"
                :model-value="balanceTypeFilter"
                :options="balanceTypeOptions"
                placeholder="all"
                @update:model-value="handleBalanceTypeChange($event)"
              />
            </div>
            <div>
              <label class="block mb-2 text-xs font-semibold">{{ $t('contactType') }}</label>
              <CheckboxFilter
                class="w-full"
                :model-value="clientTypeFilter"
                :options="clientTypeOptions"
                placeholder="all"
                @update:model-value="handleClientTypeChange($event)"
              />
            </div>
            <div>
              <label class="block mb-2 text-xs font-semibold">{{ $t('type') }}</label>
              <CheckboxFilter
                class="w-full"
                :model-value="debtDirectionFilter"
                :options="debtDirectionOptions"
                placeholder="all"
                @update:model-value="handleDebtDirectionFilterChangeFromDropdown($event)"
              />
            </div>
          </FiltersContainer>
          <ViewModeToggle
            :view-mode="displayViewMode"
            :show-kanban="false"
            :show-cards="true"
            @change="changeViewMode"
          />
        </template>
        <template #card-bar-right />
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
            :items="clientBalances"
            :card-config="cardConfigMerged"
            :card-mapper="mutualSettlementCardMapper"
            title-field="title"
            :title-prefix="mutualSettlementCardTitlePrefix"
            :show-checkbox="false"
            @dblclick="handleRowClick"
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
      :title="sideModalCrudTitle('sideModalGenClient', 'sideModalNomClient', undefined, sideModalLabelClient)"
      :onclose="handleModalClose"
    >
      <ClientCreatePage
        v-if="modalDialog"
        ref="clientForm"
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
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import CheckboxFilter from '@/views/components/app/forms/CheckboxFilter.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import ClientController from '@/api/ClientController';
import ClientCreatePage from '@/views/pages/clients/ClientCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import MutualSettlementsBalanceWrapper from './MutualSettlementsBalanceWrapper.vue';
import { eventBus } from '@/eventBus';
import { highlightMatches } from '@/utils/searchUtils';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';

import listQueryMixin from '@/mixins/listQueryMixin';

const mutualSettlementsViewModeMixin = createStoreViewModeMixin({
    listPageKey: 'mutualSettlements',
    modes: ['table', 'cards'],
});

export default {
    components: { SideModalDialog, DraggableTable, ClientCreatePage, MutualSettlementsBalanceWrapper, FiltersContainer, CheckboxFilter, TableControlsBar, TableFilterButton, TableSkeleton, CardsSkeleton, ViewModeToggle, MapperCardGrid, CardListViewShell, CardFieldsGearMenu, draggable: VueDraggableNext },
    mixins: [notificationMixin, modalMixin, companyChangeMixin, crudEventMixin, getApiErrorMessageMixin, listQueryMixin, cardFieldsVisibilityMixin, mutualSettlementsViewModeMixin],
    data() {
        return {
            cardFieldsKey: 'mutual_settlements.clients.cards',
            titleField: 'title',
            allClientsRaw: [],
            clientBalances: [],
            clientBalancesLoading: false,
            editingItem: null,
            currencyFilterId: null,
            balanceTypeFilter: [],
            debtDirectionFilter: [],
            lastLoadedCurrencyId: null,
            lastLoadedSearchQuery: '',
            lastLoadedClientTypeFilter: [],
            lastLoadedDebtDirectionFilter: [],
            columnsConfig: [
                { name: 'id', label: 'number', size: 60 },
                { name: 'clientName', label: 'customer', html: true },
                { name: 'clientType', label: 'clientType' },
                { name: 'balance', label: 'balance', html: true },
            ]
        }
    },
    computed: {
        searchQuery() {
            const query = this.$store.state.searchQuery;
            if (!query) return '';
            const trimmed = String(query).trim();
            return trimmed;
        },
        clientTypeFilter() {
            const filter = this.$store.getters.clientTypeFilter;
            return Array.isArray(filter) ? filter : [];
        },
        clientTypeOptions() {
            return [
                { value: 'individual', label: this.$t('individual') },
                { value: 'company', label: this.$t('company') },
                { value: 'employee', label: this.$t('employee') },
                { value: 'investor', label: this.$t('investor') },
            ];
        },
        balanceTypeOptions() {
            return [
                { value: 1, label: this.$t('salaryPaymentTypeCash') },
                { value: 0, label: this.$t('salaryPaymentTypeNonCash') },
            ];
        },
        debtDirectionOptions() {
            return [
                { value: 'positive', label: this.$t('oweUs') },
                { value: 'negative', label: this.$t('weOwe') },
            ];
        },
        activeDebtDirection() {
            return this.debtDirectionFilter?.[0] ?? '';
        },
        hasActiveFilters() {
            const currencyChanged = this.currencyFilterId != null && this.currencyFilterId !== this.defaultCurrencyId;
            return this.clientTypeFilter.length > 0
                || this.balanceTypeFilter.length > 0
                || this.debtDirectionFilter.length > 0
                || !!this.searchQuery?.trim()
                || currencyChanged;
        },
        currencies() {
            return this.$store.state.currencies || [];
        },
        defaultCurrencyId() {
            const list = this.$store.state.currencies || [];
            const c = list.find(x => x.isDefault === true);
            return c ? c.id : (list[0]?.id ?? null);
        },
        effectiveCurrencyId() {
            return this.currencyFilterId != null ? this.currencyFilterId : this.defaultCurrencyId;
        },
        selectedCurrencySymbol() {
            if (!this.effectiveCurrencyId) return '';
            return this.$store.getters.getCurrencySymbol(this.effectiveCurrencyId) ;
        },
        isMutualListReady() {
            return this.clientBalances != null && !this.clientBalancesLoading;
        },
        mutualCardsToolbar() {
            return {
                showFilters: true,
                hasActiveFilters: this.hasActiveFilters,
                activeFiltersCount: this.getActiveFiltersCount(),
                onFiltersReset: this.resetFilters,
                showPagination: false,
            };
        },
        cardConfigBase() {
            return [
                { name: 'title', label: null },
                { name: 'clientType', label: 'clientType', icon: 'fas fa-id-badge text-[#3571A4]' },
                { name: 'balance', label: 'balance', icon: 'fas fa-balance-scale text-[#3571A4]', html: true },
            ];
        },
        cardConfigMerged() {
            const title = { name: 'title', label: null };
            const rest = (this.cardFields || []).map((f) => ({ ...f, visible: f.visible }));
            return [title, ...rest];
        },
    },

    watch: {
        searchQuery() {
            if (this.allClientsRaw?.length) {
                this.applyFilters();
            }
        }
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', true);

        eventBus.on('global-search', this.handleSearch);
    },

    mounted() {
        const savedId = this.$store.state.clientBalancesCurrencyId;
        if (savedId != null) this.currencyFilterId = savedId;
        this.loadClientBalances();
    },

    beforeUnmount() {
        eventBus.off('global-search', this.handleSearch);
    },

    methods: {
        getClientType(client) {
            return client.clientType || 'individual';
        },

        async loadClientBalances() {
            this.clientBalancesLoading = true;
            try {
                const searchTrimmed = this.searchQuery?.trim() || '';
                const params = {
                    only_with_balance: true,
                    currency_id: this.effectiveCurrencyId ?? this.defaultCurrencyId
                };
                if (searchTrimmed) params.search = searchTrimmed;
                if (this.clientTypeFilter?.length) params.type_filter = this.clientTypeFilter;
                if (this.debtDirectionFilter?.length) params.balance_direction = this.debtDirectionFilter[0];
                const clients = await ClientController.getListItems(true, params);
                this.allClientsRaw = clients;
                this.lastLoadedCurrencyId = this.effectiveCurrencyId ?? this.defaultCurrencyId;
                this.lastLoadedSearchQuery = searchTrimmed;
                this.lastLoadedClientTypeFilter = [...this.clientTypeFilter];
                this.lastLoadedDebtDirectionFilter = [...this.debtDirectionFilter];
                this.buildClientBalancesFromRaw();
            } catch (error) {
                console.error('Ошибка загрузки балансов клиентов:', error);
            } finally {
                this.clientBalancesLoading = false;
            }
        },

        applyFilters() {
            this.$store.dispatch('setClientBalancesCurrencyId', this.effectiveCurrencyId);
            if (this.requiresReload()) {
                this.loadClientBalances();
                return;
            }
            this.buildClientBalancesFromRaw();
        },

        buildClientBalancesFromRaw() {
            if (!this.allClientsRaw?.length) {
                this.clientBalances = [];
                return;
            }
            const effectiveCurrencyId = this.effectiveCurrencyId;
            const defaultId = this.defaultCurrencyId;
            const selectedBalanceTypes = this.balanceTypeFilter.map(value => Number(value));
            this.clientBalances = this.allClientsRaw.map((client) => {
                const balances = client.balances || [];
                const balanceByCurrency = balances.find((b) => b.currencyId === effectiveCurrencyId);
                let balance = 0;
                let currencySymbol = this.selectedCurrencySymbol ;
                let balanceType = null;
                if (balanceByCurrency) {
                    balance = parseFloat(balanceByCurrency.balance) || 0;
                    currencySymbol = balanceByCurrency.currency?.symbol || currencySymbol;
                    balanceType = Number(balanceByCurrency.type) === 0 ? 0 : 1;
                } else if (!balances.length && effectiveCurrencyId === defaultId) {
                    balance = parseFloat(client.balance) || 0;
                    currencySymbol = client.currencySymbol || currencySymbol;
                }
                return {
                    id: client.id,
                    clientType: this.getClientType(client),
                    firstName: client.firstName,
                    lastName: client.lastName,
                    currencySymbol: currencySymbol,
                    debtAmount: balance > 0 ? balance : 0,
                    creditAmount: balance < 0 ? Math.abs(balance) : 0,
                    balance,
                    balanceType,
                };
            }).filter((item) => {
                if (selectedBalanceTypes.length) {
                    if (item.balanceType == null || !selectedBalanceTypes.includes(item.balanceType)) {
                        return false;
                    }
                }
                return true;
            });
        },


        async handleRowClick(item) {
            try {
                const client = await ClientController.getItem(item.id);
                this.editingItem = client;
                this.modalDialog = true;
            } catch (error) {
                console.error('Ошибка загрузки клиента:', error);
                this.showNotification('Ошибка', 'Не удалось загрузить данные клиента', true);
            }
        },

        mutualSettlementCardTitlePrefix() {
            return '<i class="fas fa-handshake text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
        },
        mutualSettlementCardMapper(item, fieldName) {
            if (!item) return '';
            if (fieldName === 'title') {
                const firstName = item.firstName == null ? '' : String(item.firstName).trim();
                const lastName = item.lastName == null ? '' : String(item.lastName).trim();
                return [firstName, lastName].filter(Boolean).join(' ') || 'Клиент без имени';
            }
            return this.itemMapper(item, fieldName) ?? '';
        },
        itemMapper(i, c) {
            const search = this.searchQuery;
            switch (c) {
                case 'clientName': {
                    const firstName = i.firstName == null ? '' : String(i.firstName).trim();
                    const lastName = i.lastName == null ? '' : String(i.lastName).trim();
                    const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'Клиент без имени';
                    return search ? highlightMatches(displayName, search) : displayName;
                }
                case 'clientType':
                    switch (i.clientType) {
                        case 'company': return this.$t('company');
                        case 'employee': return this.$t('employee');
                        case 'investor': return this.$t('investor');
                        default: return this.$t('individual');
                    }
                case 'balance':
                    if (i.debtAmount > 0) {
                        return `<span class="text-green-600 font-semibold">${this.$formatNumber(i.debtAmount, null, true)} ${i.currencySymbol}</span> <span class="text-xs text-gray-500">(Нам должны)</span>`;
                    } else if (i.creditAmount > 0) {
                        return `<span class="text-red-600 font-semibold">${this.$formatNumber(i.creditAmount, null, true)} ${i.currencySymbol}</span> <span class="text-xs text-gray-500">(Мы должны)</span>`;
                    } else {
                        return `<span class="text-gray-500">0.00 ${i.currencySymbol}</span>`;
                    }
                default:
                    return i[c];
            }
        },

        async onAfterSaved() {
            await this.loadClientBalances();
        },

        async onAfterDeleted() {
            await this.loadClientBalances();
        },

        resetFilters() {
            this.clearFiltersState();
            this.loadClientBalances();
        },
        getActiveFiltersCount() {
            return this.getActiveFiltersCountFromConfig([
                { value: this.clientTypeFilter, defaultValue: [], isArray: true },
                { value: this.balanceTypeFilter, defaultValue: [], isArray: true },
                { value: this.debtDirectionFilter, defaultValue: [], isArray: true },
                { value: this.searchQuery?.trim(), defaultValue: '' },
                { value: this.currencyFilterId, defaultValue: this.defaultCurrencyId }
            ]);
        },
        handleBalanceTypeChange(value) {
            this.balanceTypeFilter = Array.isArray(value) ? value.map(v => Number(v)) : [];
        },
        handleClientTypeChange(value) {
            const selected = Array.isArray(value) ? value : [];
            this.$store.dispatch('setClientTypeFilter', selected);
        },
        handleDebtDirectionFilterChange(value) {
            const next = value ? [value] : [];
            this.debtDirectionFilter = next;
            this.applyFilters();
        },
        handleDebtDirectionFilterChangeFromDropdown(value) {
            const raw = Array.isArray(value) ? value : [];
            const unique = [...new Set(raw.filter(Boolean))];
            const normalized = unique.includes('positive') ? ['positive'] : unique.includes('negative') ? ['negative'] : [];
            this.debtDirectionFilter = normalized;
            this.applyFilters();
        },
        onCurrencyFilterInput(e) {
            const raw = e.target.value;
            const id = raw === '' ? null : Number(raw);
            this.currencyFilterId = (id === this.defaultCurrencyId) ? null : id;
        },
        clearFiltersState() {
            this.currencyFilterId = null;
            this.balanceTypeFilter = [];
            this.debtDirectionFilter = [];
            this.$store.dispatch('setClientBalancesCurrencyId', null);
            this.$store.dispatch('setClientTypeFilter', []);
            this.$store.dispatch('setSearchQuery', '');
        },
        requiresReload() {
            const currencyId = this.effectiveCurrencyId ?? this.defaultCurrencyId;
            const searchTrimmed = this.searchQuery?.trim() || '';
            const currentTypeFilter = this.clientTypeFilter;
            const currentDebtDirection = this.debtDirectionFilter;

            if (this.lastLoadedCurrencyId !== currencyId) {
                return true;
            }
            if (this.lastLoadedSearchQuery !== searchTrimmed) {
                return true;
            }
            if (this.lastLoadedClientTypeFilter.length !== currentTypeFilter.length) {
                return true;
            }
            if (currentTypeFilter.some((value, index) => value !== this.lastLoadedClientTypeFilter[index])) {
                return true;
            }
            if (this.lastLoadedDebtDirectionFilter.length !== currentDebtDirection.length) {
                return true;
            }
            return currentDebtDirection.some((value, index) => value !== this.lastLoadedDebtDirectionFilter[index]);
        },

        async handleCompanyChanged() {
            this.clearFiltersState();
            this.allClientsRaw = [];
            this.clientBalances = [];

            await this.loadClientBalances();
        },
    },
}
</script>

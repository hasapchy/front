<template>
  <div class="mt-4">
    <ContractsBalanceWrapper
      v-if="cashRegisterFilter"
      :data="data?.items || []"
      :loading="loading"
    />
        
    <transition
      name="fade"
      mode="out-in"
    >
      <CardListViewShell
        v-if="isDataReady && (displayViewMode === 'table' || displayViewMode === 'cards')"
        :key="cardListShellKey"
        :display-view-mode="displayViewMode"
        :cards-toolbar="contractsCardsToolbar"
      >
        <template #table>
          <DraggableTable
            table-key="project.contracts.all"
            :columns-config="columnsConfig"
            :table-data="data.items || []"
            :item-mapper="itemMapper"
            :on-item-click="handleContractClick"
            @selection-change="selectedIds = $event"
          >
            <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
              <TableControlsBar
                :show-filters="true"
                :has-active-filters="hasActiveFilters"
                :active-filters-count="getActiveFiltersCount()"
                :on-filters-reset="resetFilters"
                :show-pagination="true"
                :pagination-data="contractsPaginationData"
                :on-page-change="fetchContracts"
                :on-per-page-change="handlePerPageChange"
                :reset-columns="resetColumns"
                :columns="columns"
                :toggle-visible="toggleVisible"
                :log="log"
              >
                <template #left>
                  <PrimaryButton
                    :onclick="showAddContractModal"
                    icon="fas fa-plus"
                    :disabled="!$store.getters.hasPermission('contracts_create')"
                  >
                    {{ $t('addContract') }}
                  </PrimaryButton>

                  <FiltersContainer
                  :has-active-filters="hasActiveFilters"
                  :active-filters-count="getActiveFiltersCount()"
                  @reset="resetFilters"
                  @apply="applyFilters"
                >
                  <div>
                    <label class="block mb-2 text-xs font-semibold">{{ $t('project') }}</label>
                    <select
                      v-model="projectFilter"
                      class="w-full"
                    >
                      <option value="">
                        {{ $t('allProjects') }}
                      </option>
                      <option
                        v-for="project in projects"
                        :key="project.id"
                        :value="project.id"
                      >
                        {{ project.name }}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="block mb-2 text-xs font-semibold">{{ $t('projectStatus') }}</label>
                    <select
                      v-model="projectStatusFilter"
                      class="w-full"
                    >
                      <option value="">
                        {{ $t('allStatuses') }}
                      </option>
                      <option
                        v-for="status in projectStatuses"
                        :key="status.id"
                        :value="status.id"
                      >
                        {{ status.name }}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="block mb-2 text-xs font-semibold">{{ $t('paymentStatus') }}</label>
                    <select
                      v-model="paymentStatusFilter"
                      class="w-full"
                    >
                      <option value="">
                        {{ $t('allStatuses') }}
                      </option>
                      <option value="unpaid">
                        {{ $t('notPaid') }}
                      </option>
                      <option value="partially_paid">
                        {{ $t('partiallyPaid') }}
                      </option>
                      <option value="paid">
                        {{ $t('paid') }}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="block mb-2 text-xs font-semibold">{{ $t('contractStatus') }}</label>
                    <select
                      v-model="contractStatusFilter"
                      class="w-full"
                    >
                      <option value="">
                        {{ $t('allStatuses') }}
                      </option>
                      <option value="1">
                        {{ $t('returned') }}
                      </option>
                      <option value="0">
                        {{ $t('notReturned') }}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="block mb-2 text-xs font-semibold">{{ $t('cashRegister') }}</label>
                    <select
                      v-model="cashRegisterFilter"
                      class="w-full"
                    >
                      <option value="">
                        {{ $t('allCashRegisters') }}
                      </option>
                      <option
                        v-for="cashRegister in cashRegisters"
                        :key="cashRegister.id"
                        :value="cashRegister.id"
                      >
                        {{ cashRegister.displayName || cashRegister.name }}{{ cashRegister.currencySymbol ? ` (${cashRegister.currencySymbol})` : '' }}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="block mb-2 text-xs font-semibold">{{ $t('contractType') }}</label>
                    <select
                      v-model="typeFilter"
                      class="w-full"
                    >
                      <option value="">
                        {{ $t('allTypes') }}
                      </option>
                      <option :value="0">
                        {{ $t('cashless') }}
                      </option>
                      <option :value="1">
                        {{ $t('cash') }}
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
                <template #right="{ resetColumns, columns, toggleVisible, log }">
                  <Pagination
                    v-if="contractsPaginationData"
                    :current-page="contractsPaginationData.currentPage"
                    :last-page="contractsPaginationData.lastPage"
                    :per-page="contractsPaginationData.perPage"
                    :per-page-options="contractsPaginationData.perPageOptions"
                    :show-per-page-selector="true"
                    @change-page="fetchContracts"
                    @per-page-change="handlePerPageChange"
                  />
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
                            <i class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab" />
                          </div>
                        </div>
                      </li>
                    </draggable>
                  </ul>
                </TableFilterButton>
              </template>
                <template #gear />
              </TableControlsBar>
            </template>
          </DraggableTable>
        </template>
        <template #card-bar-left>
          <PrimaryButton
            :onclick="showAddContractModal"
            icon="fas fa-plus"
            :disabled="!$store.getters.hasPermission('contracts_create')"
          >
            {{ $t('addContract') }}
          </PrimaryButton>
          <FiltersContainer
            :has-active-filters="hasActiveFilters"
            :active-filters-count="getActiveFiltersCount()"
            @reset="resetFilters"
            @apply="applyFilters"
          >
            <div>
              <label class="block mb-2 text-xs font-semibold">{{ $t('project') }}</label>
              <select
                v-model="projectFilter"
                class="w-full"
              >
                <option value="">
                  {{ $t('allProjects') }}
                </option>
                <option
                  v-for="project in projects"
                  :key="project.id"
                  :value="project.id"
                >
                  {{ project.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block mb-2 text-xs font-semibold">{{ $t('projectStatus') }}</label>
              <select
                v-model="projectStatusFilter"
                class="w-full"
              >
                <option value="">
                  {{ $t('allStatuses') }}
                </option>
                <option
                  v-for="status in projectStatuses"
                  :key="status.id"
                  :value="status.id"
                >
                  {{ status.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block mb-2 text-xs font-semibold">{{ $t('paymentStatus') }}</label>
              <select
                v-model="paymentStatusFilter"
                class="w-full"
              >
                <option value="">
                  {{ $t('allStatuses') }}
                </option>
                <option value="unpaid">
                  {{ $t('notPaid') }}
                </option>
                <option value="partially_paid">
                  {{ $t('partiallyPaid') }}
                </option>
                <option value="paid">
                  {{ $t('paid') }}
                </option>
              </select>
            </div>
            <div>
              <label class="block mb-2 text-xs font-semibold">{{ $t('contractStatus') }}</label>
              <select
                v-model="contractStatusFilter"
                class="w-full"
              >
                <option value="">
                  {{ $t('allStatuses') }}
                </option>
                <option value="1">
                  {{ $t('returned') }}
                </option>
                <option value="0">
                  {{ $t('notReturned') }}
                </option>
              </select>
            </div>
            <div>
              <label class="block mb-2 text-xs font-semibold">{{ $t('cashRegister') }}</label>
              <select
                v-model="cashRegisterFilter"
                class="w-full"
              >
                <option value="">
                  {{ $t('allCashRegisters') }}
                </option>
                <option
                  v-for="cashRegister in cashRegisters"
                  :key="cashRegister.id"
                  :value="cashRegister.id"
                >
                  {{ cashRegister.displayName || cashRegister.name }}{{ cashRegister.currencySymbol ? ` (${cashRegister.currencySymbol})` : '' }}
                </option>
              </select>
            </div>
            <div>
              <label class="block mb-2 text-xs font-semibold">{{ $t('contractType') }}</label>
              <select
                v-model="typeFilter"
                class="w-full"
              >
                <option value="">
                  {{ $t('allTypes') }}
                </option>
                <option :value="0">
                  {{ $t('cashless') }}
                </option>
                <option :value="1">
                  {{ $t('cash') }}
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
        <template #card-bar-right>
          <Pagination
            v-if="contractsPaginationData"
            :current-page="contractsPaginationData.currentPage"
            :last-page="contractsPaginationData.lastPage"
            :per-page="contractsPaginationData.perPage"
            :per-page-options="contractsPaginationData.perPageOptions"
            :show-per-page-selector="true"
            @change-page="fetchContracts"
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
            :items="data.items || []"
            :card-config="cardConfigMerged"
            :card-mapper="contractCardMapper"
            title-field="title"
            :title-prefix="contractCardTitlePrefix"
            :selected-ids="selectedIds"
            :show-checkbox="false"
            @dblclick="handleContractClick"
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
      :show-form="contractModalOpen"
      :title="contractModalTitle"
      :onclose="closeContractModal"
    >
      <ProjectContractCreatePage
        v-if="contractModalOpen && !contractLoading"
        :key="editingContractItem ? editingContractItem.id : 'new-contract'"
        :editing-item="editingContractItem"
        @saved="handleContractSaved"
        @saved-error="handleContractSavedError"
        @deleted="handleContractDeleted"
        @deleted-error="handleContractDeletedError"
        @refresh-contract="handleRefreshContract"
        @close-request="closeContractModal"
      />
      <div
        v-else-if="contractModalOpen && contractLoading"
        class="min-h-64"
      >
        <TableSkeleton />
      </div>
    </SideModalDialog>
  </div>
</template>

<script>
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import SideModalDialog, { sideModalCrudTitle } from "@/views/components/app/dialog/SideModalDialog.vue";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import TableControlsBar from "@/views/components/app/forms/TableControlsBar.vue";
import Pagination from "@/views/components/app/buttons/Pagination.vue";
import TableFilterButton from "@/views/components/app/forms/TableFilterButton.vue";
import FiltersContainer from "@/views/components/app/forms/FiltersContainer.vue";
import ProjectContractCreatePage from "./ProjectContractCreatePage.vue";
import ProjectContractController from "@/api/ProjectContractController";
import BooleanSelectCell from "@/views/components/app/buttons/BooleanSelectCell.vue";
import ClientButtonCell from "@/views/components/app/buttons/ClientButtonCell.vue";
import ContractsBalanceWrapper from "@/views/components/projects/ContractsBalanceWrapper.vue";
import TableSkeleton from "@/views/components/app/TableSkeleton.vue";
import CardsSkeleton from "@/views/components/app/CardsSkeleton.vue";
import ViewModeToggle from "@/views/components/app/ViewModeToggle.vue";
import MapperCardGrid from "@/views/components/app/cards/MapperCardGrid.vue";
import CardListViewShell from "@/views/components/app/cards/CardListViewShell.vue";
import CardFieldsGearMenu from "@/views/components/app/CardFieldsGearMenu.vue";
import cardFieldsVisibilityMixin from "@/mixins/cardFieldsVisibilityMixin";
import { createStoreViewModeMixin } from "@/mixins/storeViewModeMixin";
import notificationMixin from "@/mixins/notificationMixin";
import getApiErrorMessageMixin from "@/mixins/getApiErrorMessageMixin";
import { eventBus } from "@/eventBus";
import { highlightMatches } from "@/utils/searchUtils";
import { VueDraggableNext } from 'vue-draggable-next';
import { markRaw } from "vue";

import listQueryMixin from "@/mixins/listQueryMixin";

const projectContractsViewModeMixin = createStoreViewModeMixin({
    listPageKey: "projectContracts",
    modes: ["table", "cards"],
});

export default {
    components: {
        DraggableTable,
        SideModalDialog,
        PrimaryButton,
        TableControlsBar,
        Pagination,
        TableFilterButton,
        FiltersContainer,
        ProjectContractCreatePage,
        ContractsBalanceWrapper,
        TableSkeleton,
        CardsSkeleton,
        ViewModeToggle,
        MapperCardGrid,
        CardListViewShell,
        CardFieldsGearMenu,
        draggable: VueDraggableNext,
    },
    mixins: [notificationMixin, getApiErrorMessageMixin, listQueryMixin, cardFieldsVisibilityMixin, projectContractsViewModeMixin],
    data() {
        return {
            loading: false,
            data: null,
            selectedIds: [],
            contractModalOpen: false,
            editingContractItem: null,
            contractLoading: false,
            perPage: 20,
            perPageOptions: [20, 50],
            cardFieldsKey: "project.contracts.all.cards",
            titleField: "title",
            projectFilter: '',
            projectStatusFilter: '',
            paymentStatusFilter: '',
            contractStatusFilter: '',
            cashRegisterFilter: '',
            typeFilter: '',
            projects: [],
            projectStatuses: [],
            cashRegisters: [],
            returnedOptions: [
                { value: true, label: this.$t('returned'), color: '#5CB85C', icon: 'fa-solid fa-file-circle-check' },
                { value: false, label: this.$t('notReturned'), color: '#EE4F47', icon: 'fa-solid fa-file-circle-xmark' },
            ],
            columnsConfig: [
                { name: "id", label: "ID", size: 80, html: true },
                { name: "projectName", label: this.$t("project"), size: 200, html: true },
                {
                    name: "client",
                    label: this.$t("client"),
                    size: 180,
                    component: markRaw(ClientButtonCell),
                    props: (i) => {
                        const q = this.searchQuery?.trim();
                        return { client: i.clientId ? { id: i.clientId, clientName: i.clientName } : null, searchQuery: (q && q.length >= 3) ? q : null };
                    }
                },
                { name: "number", label: this.$t("contractNumber"), size: 150, html: true },
                { name: "type", label: this.$t("contractType"), size: 120 },
                { name: "amount", label: this.$t("amount"), size: 120, html: true },
                { name: "cashRegisterName", label: this.$t("cashRegister"), size: 150 },
                { name: "dateUser", label: this.$t("dateUser"), size: 100 },
                {
                    name: "returned",
                    label: this.$t("status"),
                    size: 140,
                    component: markRaw(BooleanSelectCell),
                    props: (i) => ({
                        value: !!i.returned,
                        options: this.returnedOptions,
                        onChange: (newValue) => this.saveContractField(i.id, 'returned', newValue),
                    }),
                },
                {
                    name: "paymentStatusText",
                    label: this.$t("paymentStatus"),
                    size: 140,
                    html: true,
                },
                { name: "note", label: this.$t("note"), size: 200, html: true },
            ],
        };
    },
    computed: {
        hasActiveFilters() {
            return !!this.projectFilter || !!this.projectStatusFilter || this.paymentStatusFilter !== '' || this.contractStatusFilter !== '' || this.cashRegisterFilter !== '' || this.typeFilter !== '';
        },
        isDataReady() {
            return this.data != null && !this.loading;
        },
        contractsPaginationData() {
            if (!this.data) return null;
            return {
                currentPage: this.data.currentPage,
                lastPage: this.data.lastPage,
                perPage: this.perPage,
                perPageOptions: this.perPageOptions,
            };
        },
        contractsCardsToolbar() {
            return {
                showFilters: true,
                hasActiveFilters: this.hasActiveFilters,
                activeFiltersCount: this.getActiveFiltersCount(),
                onFiltersReset: this.resetFilters,
                showPagination: true,
                paginationData: this.contractsPaginationData,
                onPageChange: this.fetchContracts,
                onPerPageChange: this.handlePerPageChange,
            };
        },
        cardConfigBase() {
            return [
                { name: "title", label: null },
                { name: "projectName", label: this.$t("project"), icon: "fas fa-project-diagram text-[#3571A4]" },
                { name: "client", label: this.$t("client"), icon: "fas fa-user text-[#3571A4]" },
                { name: "number", label: this.$t("contractNumber"), icon: "fas fa-hashtag text-[#3571A4]" },
                { name: "type", label: this.$t("contractType"), icon: "fas fa-tag text-[#3571A4]" },
                { name: "amount", label: this.$t("amount"), icon: "fas fa-money-bill text-[#3571A4]", html: true },
                { name: "cashRegisterName", label: this.$t("cashRegister"), icon: "fas fa-cash-register text-[#3571A4]" },
                { name: "dateUser", label: this.$t("dateUser"), icon: "fas fa-calendar text-[#3571A4]" },
                { name: "returned", label: this.$t("status"), icon: "fas fa-file-signature text-[#3571A4]" },
                { name: "paymentStatusText", label: this.$t("paymentStatus"), icon: "fas fa-wallet text-[#3571A4]" },
                { name: "note", label: this.$t("note"), icon: "fas fa-sticky-note text-[#3571A4]" },
            ];
        },
        cardConfigMerged() {
            const title = { name: "title", label: null };
            const rest = (this.cardFields || []).map((f) => ({ ...f, visible: f.visible }));
            return [title, ...rest];
        },
        searchQuery() {
            return this.$store.state.searchQuery;
        },
        contractModalTitle() {
            if (!this.contractModalOpen) {
                return '';
            }
            if (this.contractLoading) {
                return this.$t('loading');
            }
            return sideModalCrudTitle(this.$t.bind(this), {
                item: this.editingContractItem,
                entityGenitiveKey: 'sideModalGenContract',
                entityNominativeKey: 'sideModalNomContract',
                getName: (c) => c?.number || c?.name || '',
            });
        },
    },
    created() {
        eventBus.on('global-search', this.handleSearch);
        try {
            const stored = localStorage.getItem(this.$storageUi.LS_KEYS.perPage);
            const parsed = stored ? parseInt(stored, 10) : NaN;
            if (Number.isFinite(parsed) && [20, 50].includes(parsed)) {
                this.perPage = parsed;
            }
        } catch {
            void 0;
        }
    },
    async mounted() {
        if (!(this.$store.getters.activeProjects?.length)) {
            await this.fetchProjects();
        } else {
            this.projects = this.$store.getters.activeProjects || [];
        }
        if (!(this.$store.getters.projectStatuses?.length)) {
            await this.$store.dispatch('loadProjectStatuses');
        }
        this.projectStatuses = this.$store.getters.projectStatuses || [];
        if (!(this.$store.getters.cashRegisters?.length)) {
            await this.fetchCashRegisters();
        } else {
            this.cashRegisters = this.$store.getters.cashRegisters || [];
        }
        this.fetchContracts();
    },
    beforeUnmount() {
        eventBus.off('global-search', this.handleSearch);
    },
    methods: {
        async saveContractField(contractId, field, value) {
            const item = this.data?.items?.find(i => i.id === contractId);
            if (!item) return;

            const oldValue = item[field];
            item[field] = value;

            try {
                const response = await ProjectContractController.updateItem(contractId, {
                    ...item,
                    [field]: value,
                });
                const updated = response?.item;
                if (updated) {
                    Object.assign(item, updated, {
                        projectName: updated.projectName || item.projectName ,
                    });
                }
            } catch (error) {
                item[field] = oldValue;
                const msg = this.getApiErrorMessage(error);
                this.showNotification(this.$t('error'), Array.isArray(msg) ? msg.join(', ') : msg, true);
            }
        },
        getContractPaymentStatusClass(item) {
            const status = item.paymentStatus || 'unpaid';
            if (status === 'paid') return 'text-[#5CB85C] font-medium';
            if (status === 'partially_paid') return 'text-[#FFA500] font-medium';
            return 'text-[#EE4F47] font-medium';
        },
        async fetchContracts(page = 1) {
            this.loading = true;
            try {
                const params = {
                    perPage: this.perPage,
                    page: page
                };

                if (this.projectFilter) {
                    params.projectId = this.projectFilter;
                }

                if (this.projectStatusFilter) {
                    params.projectStatusId = this.projectStatusFilter;
                }

                if (this.paymentStatusFilter) {
                    params.paymentStatus = this.paymentStatusFilter;
                }

                if (this.contractStatusFilter === '0' || this.contractStatusFilter === '1') {
                    params.returned = this.contractStatusFilter;
                }

                if (this.cashRegisterFilter) {
                    params.cashId = this.cashRegisterFilter;
                }

                if (this.typeFilter !== '') {
                    params.type = this.typeFilter;
                }

                const searchTrimmed = this.searchQuery?.trim();
                if (searchTrimmed && searchTrimmed.length >= 3) {
                    params.search = searchTrimmed;
                }

                const response = await ProjectContractController.getAllItems(params);
                const items = (response.items || []).map(contract => ({
                    ...contract,
                    projectName: contract.projectName || contract.project?.name,
                    formatAmount() {
                        return contract.formatAmount();
                    },
                    formatDate() {
                        return contract.formatDate();
                    },
                    formatDateUser() {
                        return `${contract.formatDate()} / ${contract.creator?.name }`;
                    }
                }));
                this.data = {
                    items: items,
                    currentPage: response.currentPage || page,
                    lastPage: response.lastPage || 1,
                    total: response.total || 0
                };
            } catch {
                this.data = { items: [], currentPage: 1, lastPage: 1, total: 0 };
                this.showNotification('Error', 'Error loading contracts', true);
            }
            this.loading = false;
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchContracts(1);
        },
        async fetchProjects() {
            try {
                await this.$store.dispatch('loadProjects');
                this.projects = this.$store.getters.activeProjects || [];
            } catch {
                this.projects = [];
            }
        },
        async fetchCashRegisters() {
            try {
                await this.$store.dispatch('loadCashRegisters');
                this.cashRegisters = this.$store.getters.cashRegisters || [];
            } catch {
                this.cashRegisters = [];
            }
        },
        resetFilters() {
            this.$store.dispatch('setSearchQuery', '');
            this.resetFiltersFromConfig({
                projectFilter: '',
                projectStatusFilter: '',
                paymentStatusFilter: '',
                contractStatusFilter: '',
                cashRegisterFilter: '',
                typeFilter: ''
            }, () => {
                this.fetchContracts(1);
            });
        },
        applyFilters() {
            this.fetchContracts(1);
        },
        getActiveFiltersCount() {
            return this.getActiveFiltersCountFromConfig([
                { value: this.projectFilter, defaultValue: '' },
                { value: this.projectStatusFilter, defaultValue: '' },
                { value: this.paymentStatusFilter, defaultValue: '' },
                { value: this.contractStatusFilter, defaultValue: '' },
                { value: this.cashRegisterFilter, defaultValue: '' },
                { value: this.typeFilter, defaultValue: '' }
            ]);
        },
        formatTotals(totalsByCurrency) {
            const result = Object.entries(totalsByCurrency || {})
                .map(([currencySymbol, amount]) => `${this.$formatNumber(amount || 0, null, true)} ${currencySymbol}`.trim())
                .join(' / ');

            return result || '0';
        },
        contractCardTitlePrefix() {
            return '<i class="fas fa-file-contract text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
        },
        contractPaymentPlain(item) {
            const status = item.paymentStatus || ((item.paidAmount ?? 0) >= (item.amount ?? 0)
                ? "paid"
                : ((item.paidAmount ?? 0) > 0 ? "partially_paid" : "unpaid"));
            if (status === "paid") {
                return this.$t("paid");
            }
            if (status === "partially_paid") {
                const paidAmount = item.paidAmount ?? 0;
                const currencySymbol = item.currencySymbol ?? "";
                if (paidAmount > 0) {
                    return `${this.$t("partiallyPaid")} (${this.$formatNumber(paidAmount, null, true)} ${currencySymbol})`.trim();
                }
                return this.$t("partiallyPaid");
            }
            return this.$t("notPaid");
        },
        contractCardMapper(item, fieldName) {
            if (!item) return "";
            if (fieldName === "title") {
                return item.number || String(item.id ?? "");
            }
            if (fieldName === "paymentStatusText") {
                return this.contractPaymentPlain(item);
            }
            if (fieldName === "returned") {
                return item.returned ? this.$t("returned") : this.$t("notReturned");
            }
            return this.itemMapper(item, fieldName) ?? "";
        },
        itemMapper(item, column) {
            const search = this.searchQuery?.trim();
            const searchActive = search && search.length >= 3;

            switch (column) {
                case "id":
                    return searchActive ? highlightMatches(String(item.id ?? ''), search) : (item.id ?? '');
                case "client":
                    return searchActive && item.clientName ? highlightMatches(item.clientName, search) : (item.clientName );
                case "projectName":
                    return searchActive && item.projectName ? highlightMatches(item.projectName, search) : (item.projectName );
                case "number":
                    return searchActive && item.number ? highlightMatches(item.number, search) : (item.number ?? '');
                case "type":
                    return item.type === 1 ? this.$t('cash') : this.$t('cashless');
                case "amount": {
                    const amountStr = item.formatAmount();
                    return searchActive && amountStr ? highlightMatches(amountStr, search) : amountStr;
                }
                case "cashRegisterName":
                    return item.cashRegisterName ;
                case "dateUser":
                    return item.formatDateUser ? item.formatDateUser() : `${item.formatDate()} / ${item.creator?.name }`;
                case "returned":
                    return item.returned ? 1 : 0;
                case "paymentStatusText": {
                    const status = item.paymentStatus || ((item.paidAmount ?? 0) >= (item.amount ?? 0)
                        ? 'paid'
                        : ((item.paidAmount ?? 0) > 0 ? 'partially_paid' : 'unpaid'));

                    const cls = this.getContractPaymentStatusClass(item);

                    let iconClass = 'fas fa-times-circle';
                    if (status === 'paid') {
                        iconClass = 'fas fa-check-circle';
                    } else if (status === 'partially_paid') {
                        iconClass = 'fas fa-adjust';
                    }

                    const paidAmount = item.paidAmount ?? 0;
                    const currencySymbol = item.currencySymbol ?? '';
                    const showAmount = status === 'partially_paid' && paidAmount > 0;
                    const formattedAmount = showAmount
                        ? `${this.$formatNumber(paidAmount, null, true)} ${currencySymbol}`.trim()
                        : '';

                    const title = item.paymentStatusText ;

                    const amountHtml = showAmount && formattedAmount
                        ? `<span class="ml-1">${formattedAmount}</span>`
                        : '';

                    return `<span class="${cls}" title="${title}"><i class="${iconClass}"></i>${amountHtml}</span>`;
                }
                case "note":
                    return searchActive && item.note ? highlightMatches(item.note, search) : (item.note );
                default:
                    return item[column];
            }
        },
        async handleContractClick(item) {
            try {
                this.contractLoading = true;
                const contractItem = await ProjectContractController.getItem(item.id);
                this.editingContractItem = contractItem;
                this.contractModalOpen = true;
            } catch (error) {
                const msg = this.getApiErrorMessage(error);
                this.showNotification(this.$t('error'), Array.isArray(msg) ? msg.join(', ') : msg, true);
            } finally {
                this.contractLoading = false;
            }
        },
        showAddContractModal() {
            this.editingContractItem = null;
            this.contractModalOpen = true;
        },
        closeContractModal() {
            this.contractModalOpen = false;
            this.editingContractItem = null;
        },
        handleContractSaved() {
            this.closeContractModal();
            this.fetchContracts(this.data?.currentPage || 1);
        },
        handleContractSavedError(error) {
            const msg = this.getApiErrorMessage(error);
            const text = Array.isArray(msg) ? msg.join(', ') : msg;
            this.showNotification(this.$t('error'), text, true);
        },
        handleContractDeleted() {
            this.closeContractModal();
            this.fetchContracts(this.data?.currentPage || 1);
        },
        handleContractDeletedError(error) {
            const msg = this.getApiErrorMessage(error);
            const text = Array.isArray(msg) ? msg.join(', ') : msg;
            this.showNotification(this.$t('error'), text, true);
        },
        async handleRefreshContract() {
            if (this.editingContractItem?.id) {
                const updated = await ProjectContractController.getItem(this.editingContractItem.id);
                this.editingContractItem = updated;
            }
        },
    },
};
</script>

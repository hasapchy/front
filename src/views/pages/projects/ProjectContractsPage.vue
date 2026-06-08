<template>
  <div class="mt-4">
    <ContractsBalanceWrapper v-if="cashRegisterFilter" :data="data?.items || []" :loading="loading" />

    <ListPageToolbar
      v-if="isDataReady"
      :toolbar-bind="contractsToolbarBind"
      :reset-columns="listTableControls.resetColumns"
      :columns="listTableControls.columns"
      :toggle-visible="listTableControls.toggleVisible"
      :log="listTableControls.log"
    >
      <template #actions>
        <PrimaryButton
          :onclick="showAddContractModal"
          icon="fas fa-plus"
          :aria-label="$t('addContract')"
          :disabled="!$store.getters.hasPermission('contracts_create')"
        />
      </template>
      <template #presets-filters>
        <FiltersContainer
          :has-active-filters="hasActiveFilters"
          :active-filters-count="getActiveFiltersCount()"
          @reset="resetFilters"
          @apply="applyFilters"
        >
          <ProjectContractsFilterFields
            :project-filter="projectFilter"
            :project-status-filter="projectStatusFilter"
            :payment-status-filter="paymentStatusFilter"
            :lifecycle-status-filter="lifecycleStatusFilter"
            :contract-status-filter="contractStatusFilter"
            :cash-register-filter="cashRegisterFilter"
            :type-filter="typeFilter"
            :projects="projects"
            :project-statuses="projectStatuses"
            :cash-registers="cashRegisters"
            :cash-register-option-label="cashRegisterOptionLabel"
            @update:project-filter="projectFilter = $event"
            @update:project-status-filter="projectStatusFilter = $event"
            @update:payment-status-filter="paymentStatusFilter = $event"
            @update:lifecycle-status-filter="lifecycleStatusFilter = $event"
            @update:contract-status-filter="contractStatusFilter = $event"
            @update:cash-register-filter="cashRegisterFilter = $event"
            @update:type-filter="typeFilter = $event"
          />
        </FiltersContainer>
      </template>
      <template #extras>
        <ViewModeToggle
          :view-mode="displayViewMode"
          :show-kanban="false"
          :show-cards="true"
          @change="changeViewMode"
        />
      </template>
      <template #gear="{ resetColumns, columns, toggleVisible, log }">
        <TableFilterButton
          v-if="displayViewMode === 'table' && columns && columns.length"
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
        <CardFieldsGearMenu
          v-else-if="displayViewMode === 'cards'"
          :card-fields="cardFields"
          :on-reset="resetCardFields"
          @toggle="toggleCardFieldVisible"
        />
      </template>
    </ListPageToolbar>

    <transition name="fade" mode="out-in">
      <CardListViewShell
        v-if="isDataReady && (displayViewMode === 'table' || displayViewMode === 'cards')"
        :key="cardListShellKey"
        hide-toolbar
        :display-view-mode="displayViewMode"
        :cards-toolbar="contractsCardsToolbar"
      >
        <template #table>
          <DraggableTable
            ref="contractsTable"
            hide-controls-bar
            table-key="project.contracts.all"
            :columns-config="columnsConfig"
            :table-data="data.items || []"
            :item-mapper="itemMapper"
            highlight-draft-rows
            :draft-status-values="['draft']"
            :on-item-click="handleContractClick"
            @selection-change="selectedIds = $event"
          />
        </template>
        <template #cards>
          <MapperCardGrid
            class="mt-4"
            :items="data.items || []"
            :card-config="cardConfigMerged"
            :card-mapper="contractCardMapper"
            title-field="title"
            title-subtitle-field="dateUser"
            :title-prefix="contractCardTitlePrefix"
            :selected-ids="selectedIds"
            :show-checkbox="false"
            @dblclick="handleContractClick"
          />
        </template>
      </CardListViewShell>
      <div v-else key="loader" class="min-h-64">
        <TableSkeleton v-if="displayViewMode === 'table'" />
        <CardsSkeleton v-else />
      </div>
    </transition>

    <SideModalDialog :show-form="contractModalOpen" :title="contractModalTitle" :onclose="closeContractModal">
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
      <div v-else-if="contractModalOpen && contractLoading" class="min-h-64">
        <TableSkeleton />
      </div>
    </SideModalDialog>
  </div>
</template>

<script>
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import SideModalDialog, { sideModalCrudTitle } from "@/views/components/app/dialog/SideModalDialog.vue";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import TableFilterButton from "@/views/components/app/forms/TableFilterButton.vue";
import FiltersContainer from "@/views/components/app/forms/FiltersContainer.vue";
import ListPageToolbar from "@/views/components/app/forms/ListPageToolbar.vue";
import ProjectContractsFilterFields from "@/views/components/projects/ProjectContractsFilterFields.vue";
import ProjectContractCreatePage from "./ProjectContractCreatePage.vue";
import ProjectContractController from "@/api/ProjectContractController";
import StatusSelectCell from "@/views/components/app/buttons/StatusSelectCell.vue";
import BooleanSelectCell from "@/views/components/app/buttons/BooleanSelectCell.vue";
import ClientButtonCell from "@/views/components/app/buttons/ClientButtonCell.vue";
import DateUserCell from '@/views/components/app/buttons/DateUserCell.vue';
import { buildDateUserCellProps } from '@/utils/userCellUtils';
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
import { enrichProjectContractForTable } from '@/utils/projectContractTableRow';
import { patchProjectContractTableField } from '@/utils/projectContractTableSave';
import { getContractLifecycleStatusCellProps } from '@/utils/contractLifecycleStatusCell';
import { formatCashRegisterDisplay } from '@/utils/cashRegisterUtils';
import { VueDraggableNext } from 'vue-draggable-next';
import { markRaw } from "vue";

import listQueryMixin from "@/mixins/listQueryMixin";
import filterPresetsMixin from "@/mixins/filterPresetsMixin";
import companyChangeMixin from "@/mixins/companyChangeMixin";
import { FILTER_PRESET_SOURCE_CONTRACTS } from "@/constants/filterPresetSources";
import { translateProjectStatus } from "@/utils/translationUtils";

const projectContractsViewModeMixin = createStoreViewModeMixin({
  listPageKey: "projectContracts",
  modes: ["table", "cards"],
});

export default {
  components: {
    DraggableTable,
    SideModalDialog,
    PrimaryButton,
    TableFilterButton,
    FiltersContainer,
    ListPageToolbar,
    ProjectContractsFilterFields,
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
  mixins: [notificationMixin, getApiErrorMessageMixin, listQueryMixin, filterPresetsMixin, companyChangeMixin, cardFieldsVisibilityMixin, projectContractsViewModeMixin],
  data() {
    return {
      filterPresetSource: FILTER_PRESET_SOURCE_CONTRACTS,
      loading: false,
      data: null,
      selectedIds: [],
      contractModalOpen: false,
      editingContractItem: null,
      contractLoading: false,
      perPage: 20,
      perPageOptions: [20, 50],
      cardFieldsKey: "project.contracts.all.cards",
      projectFilter: '',
      projectStatusFilter: '',
      paymentStatusFilter: '',
      contractStatusFilter: '',
      lifecycleStatusFilter: '',
      cashRegisterFilter: '',
      typeFilter: '',
      projects: [],
      projectStatuses: [],
      cashRegisters: [],
      returnedOptions: [
        { value: true, label: this.$t('returned'), color: 'var(--color-success)', icon: 'fa-solid fa-file-circle-check' },
        { value: false, label: this.$t('notReturned'), color: 'var(--color-danger)', icon: 'fa-solid fa-file-circle-xmark' },
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
        {
          name: "lifecycleStatus",
          label: this.$t("contractFormat"),
          size: 120,
          component: markRaw(StatusSelectCell),
          props: (i) => getContractLifecycleStatusCellProps(
            i,
            this.$t.bind(this),
            (newValue) => this.saveContractField(i.id, 'status', newValue),
          ),
        },
        { name: "type", label: this.$t("contractType"), size: 120 },
        { name: "amount", label: this.$t("amount"), size: 120, html: true },
        { name: "cashRegisterName", label: this.$t("cashRegister"), size: 150 },
        {
          name: "dateUser",
          label: this.$t("dateUser"),
          size: 100,
          component: markRaw(DateUserCell),
          props: (item) => buildDateUserCellProps(item, this.searchQuery),
        },
        {
          name: "returned",
          label: this.$t("contractDocument"),
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
          label: this.$t("payment"),
          size: 140,
          html: true,
        },
        { name: "note", label: this.$t("note"), size: 200, html: true },
      ],
    };
  },
  computed: {
    listTableControls() {
      const table = this.$refs.contractsTable;
      if (!table) {
        return {
          columns: [],
          resetColumns: () => {},
          toggleVisible: () => {},
          log: () => {},
        };
      }
      return {
        columns: table.columns,
        resetColumns: table.resetColumns.bind(table),
        toggleVisible: table.toggleVisible.bind(table),
        log: table.log.bind(table),
      };
    },
    contractsToolbarBind() {
      return {
        showPagination: true,
        paginationData: this.contractsPaginationData,
        onPageChange: this.fetchContracts,
        onPerPageChange: this.handlePerPageChange,
      };
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
      return {};
    },
    cardConfigBase() {
      return [
        { name: "title", label: null },
        { name: "projectName", label: this.$t("project"), icon: "fas fa-project-diagram text-[#3571A4]" },
        { name: "client", label: this.$t("client"), icon: "fas fa-user text-[#3571A4]" },
        { name: "type", label: this.$t("contractType"), icon: "fas fa-tag text-[#3571A4]" },
        { name: "amount", label: this.$t("amount"), icon: "fas fa-money-bill text-[#3571A4]", html: true },
        { name: "cashRegisterName", label: this.$t("cashRegister"), icon: "fas fa-cash-register text-[#3571A4]" },
        { name: "dateUser", label: this.$t("dateUser"), icon: "fas fa-calendar text-[#3571A4]" },
        { name: "returned", label: this.$t("contractDocument"), icon: "fas fa-file-signature text-[#3571A4]" },
        { name: "paymentStatusText", label: this.$t("payment"), icon: "fas fa-wallet text-[#3571A4]" },
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
    await this.waitForFilterPresetsInitialization();
    if (!this._filterPresetsTriggeredListFetch) {
      this.fetchContracts();
    }
  },
  beforeUnmount() {
    eventBus.off('global-search', this.handleSearch);
  },
  methods: {
    translateProjectStatus,
    cashRegisterOptionLabel(cashRegister) {
      return formatCashRegisterDisplay(cashRegister?.displayName || cashRegister?.name, cashRegister?.currencyCode) || '';
    },
    async saveContractField(contractId, field, value) {
      const item = this.data?.items?.find((i) => i.id === contractId);
      if (!item) {
        return;
      }

      const result = await patchProjectContractTableField(item, contractId, field, value);
      if (!result.ok) {
        const msg = this.getApiErrorMessage(result.error);
        this.showNotification(this.$t('error'), Array.isArray(msg) ? msg.join(', ') : msg, true);
      }
    },
    getContractPaymentStatusClass(item) {
      const status = item.paymentStatus || 'unpaid';
      if (status === 'draft') return 'text-gray-500 font-medium';
      if (status === 'paid') return 'text-[var(--color-success)] font-medium';
      if (status === 'partially_paid') return 'text-[var(--color-warning)] font-medium';
      return 'text-[var(--color-danger)] font-medium';
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

        if (this.lifecycleStatusFilter) {
          params.status = this.lifecycleStatusFilter;
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
        const items = (response.items || []).map((contract) => {
          const row = enrichProjectContractForTable(contract);
          row.projectName = row.projectName || contract.project?.name;
          return row;
        });
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
    refetchList(page = 1) {
      return this.fetchContracts(page);
    },
    async handleCompanyChanged() {
      this.selectedIds = [];
      await this.waitForFilterPresetsInitialization();
    },
    async resetFilters() {
      this.$store.dispatch('setSearchQuery', '');
      await this.resetFiltersToSystemDefaults(() => {
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
        { value: this.lifecycleStatusFilter, defaultValue: '' },
        { value: this.cashRegisterFilter, defaultValue: '' },
        { value: this.typeFilter, defaultValue: '' }
      ]);
    },
    formatTotals(totalsByCurrency) {
      const result = Object.entries(totalsByCurrency || {})
        .map(([currencyCode, amount]) => `${this.$formatNumber(amount || 0, true)} ${currencyCode}`.trim())
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
        const currencyCode = item.currencyCode ?? "";
        if (paidAmount > 0) {
          return `${this.$t("partiallyPaid")} (${this.$formatNumber(paidAmount, true)} ${currencyCode})`.trim();
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
          return searchActive && item.clientName ? highlightMatches(item.clientName, search) : (item.clientName);
        case "projectName":
          return searchActive && item.projectName ? highlightMatches(item.projectName, search) : (item.projectName);
        case "number":
          return searchActive && item.number ? highlightMatches(item.number, search) : (item.number ?? '');
        case "lifecycleStatus":
          return item.status === 'active' ? 1 : 0;
        case "type":
          return item.type === 1 ? this.$t('cash') : this.$t('cashless');
        case "amount": {
          const amountStr = item.formatAmount();
          return searchActive && amountStr ? highlightMatches(amountStr, search) : amountStr;
        }
        case "cashRegisterName":
          return item.cashRegisterName;
        case "dateUser":
          return item.formatDateUser ? item.formatDateUser() : `${item.formatDate()} / ${item.creator?.name}`;
        case "returned":
          return item.returned ? 1 : 0;
        case "paymentStatusText": {
          const status = item.paymentStatus || ((item.paidAmount ?? 0) >= (item.amount ?? 0)
            ? 'paid'
            : ((item.paidAmount ?? 0) > 0 ? 'partially_paid' : 'unpaid'));

          const cls = this.getContractPaymentStatusClass(item);

          let iconClass = 'fas fa-times-circle';
          if (status === 'draft') {
            iconClass = 'fas fa-file-pen';
          } else if (status === 'paid') {
            iconClass = 'fas fa-check-circle';
          } else if (status === 'partially_paid') {
            iconClass = 'fas fa-adjust';
          }

          const paidAmount = item.paidAmount ?? 0;
          const currencyCode = item.currencyCode ?? '';
          const showAmount = status === 'partially_paid' && paidAmount > 0;
          const formattedAmount = showAmount
            ? `${this.$formatNumber(paidAmount, true)} ${currencyCode}`.trim()
            : '';

          const title = item.paymentStatusText;

          const amountHtml = showAmount && formattedAmount
            ? `<span class="ml-1">${formattedAmount}</span>`
            : '';

          return `<span class="${cls}" title="${title}"><i class="${iconClass}"></i>${amountHtml}</span>`;
        }
        case "note":
          return searchActive && item.note ? highlightMatches(item.note, search) : (item.note);
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

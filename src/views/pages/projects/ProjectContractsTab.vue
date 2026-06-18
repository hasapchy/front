<template>
  <div>
    <transition name="fade" mode="out-in">
      <div v-if="!loading" key="content">
        <div v-if="hasContractsTotals" class="mb-4">
          <div class="flex items-center gap-6 flex-wrap">
            <span class="flex items-center gap-2">
              <i class="fas fa-check-circle text-[var(--color-success)]" />
              <b class="text-[var(--color-success)]">{{ paidTotalDisplay }}</b>
            </span>
            <span class="flex items-center gap-2">
              <i class="fas fa-times-circle text-[var(--color-danger)]" />
              <b class="text-[var(--color-danger)]">{{ unpaidTotalDisplay }}</b>
            </span>
            <span class="flex items-center gap-2">
              <i class="fas fa-wallet text-[var(--color-info)]" />
              <b class="text-[var(--color-info)]">{{ totalDisplay }}</b>
            </span>
          </div>
        </div>
        <DraggableTable table-key="project.contracts" :columns-config="columnsConfig" :table-data="filteredContracts"
          :item-mapper="itemMapper" highlight-draft-rows :draft-status-values="['draft']"
          :on-item-click="handleContractClick">
          <template #tableSettingsAdditional>
            <FiltersContainer :has-active-filters="hasActiveFilters" :active-filters-count="getActiveFiltersCount()"
              @reset="resetFilters" @apply="applyFilters">
              <ProjectContractsFilterFields
                :show-project-filters="false"
                :payment-status-filter="paymentStatusFilter"
                :lifecycle-status-filter="lifecycleStatusFilter"
                :contract-status-filter="contractStatusFilter"
                :cash-register-filter="cashRegisterFilter"
                :type-filter="typeFilter"
                :cash-registers="cashRegisters"
                :cash-register-option-label="cashRegisterOptionLabel"
                @update:paymentStatusFilter="paymentStatusFilter = $event"
                @update:lifecycleStatusFilter="lifecycleStatusFilter = $event"
                @update:contractStatusFilter="contractStatusFilter = $event"
                @update:cashRegisterFilter="cashRegisterFilter = $event"
                @update:typeFilter="typeFilter = $event"
              />
            </FiltersContainer>
            <PrimaryButton icon="fas fa-plus" :onclick="showAddContractModal" :aria-label="$t('addContract')"
              :is-small="true" />
          </template>
        </DraggableTable>
      </div>
      <div v-else key="loader" class="min-h-64">
        <TableSkeleton />
      </div>
    </transition>

    <SideModalDialog :show-form="contractModalOpen" :title="contractTabModalTitle" :onclose="closeContractModal"
      :level="2" :timeline-collapsed="timelineCollapsed" :show-timeline-button="!!editingContractItem"
      @toggle-timeline="toggleTimeline">
      <ProjectContractCreatePage v-if="contractModalOpen && !contractLoading && editingItem?.id"
        :key="editingContractItem ? editingContractItem.id : 'new-contract'" :editing-item="editingContractItem"
        :project-id="editingItem.id" :project-client-id="editingItem.clientId" @saved="handleContractSaved"
        @saved-error="handleContractSavedError" @deleted="handleContractDeleted"
        @deleted-error="handleContractDeletedError" @refresh-contract="handleRefreshContract"
        @close-request="closeContractModal" />
      <div v-else-if="contractModalOpen && contractLoading" class="min-h-64">
        <TableSkeleton />
      </div>

      <template #timeline>
        <TimelinePanel v-if="editingContractItem && !timelineCollapsed" :id="editingContractItem.id" ref="timelinePanel"
          :type="'project_contract'" @toggle-timeline="toggleTimeline" />
      </template>
    </SideModalDialog>
  </div>
</template>

<script>
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import SideModalDialog, { sideModalCrudTitle } from "@/views/components/app/dialog/SideModalDialog.vue";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import FiltersContainer from "@/views/components/app/forms/FiltersContainer.vue";
import ProjectContractsFilterFields from "@/views/components/projects/ProjectContractsFilterFields.vue";
import TableSkeleton from "@/views/components/app/TableSkeleton.vue";
import listQueryMixin from "@/mixins/listQueryMixin";
import ProjectContractCreatePage from "./ProjectContractCreatePage.vue";
import notificationMixin from "@/mixins/notificationMixin";
import getApiErrorMessageMixin from "@/mixins/getApiErrorMessageMixin";
import { TimelinePanelAsync } from "@/utils/timelinePanelAsync";
import timelineSideModalMixin from "@/mixins/timelineSideModalMixin";
import { formatContractTotalsByCurrency, sumContractsByCurrency } from '@/utils/contractTotalsUtils';
import { enrichProjectContractForTable, mapProjectContractTableColumn } from '@/utils/projectContractTableRow';
import projectContractModalMixin from '@/mixins/projectContractModalMixin';
import { patchProjectContractTableField } from '@/utils/projectContractTableSave';
import { getContractLifecycleStatusCellProps } from '@/utils/contractLifecycleStatusCell';
import { matchesProjectContractFilters } from '@/utils/projectContractFilters';
import StatusSelectCell from '@/views/components/app/buttons/StatusSelectCell.vue';
import { markRaw } from 'vue';
import DateUserCell from '@/views/components/app/buttons/DateUserCell.vue';
import { buildDateUserCellProps } from '@/utils/userCellUtils';
import { formatCashRegisterDisplay } from '@/utils/cashRegisterUtils';

export default {
  components: {
    DraggableTable,
    SideModalDialog,
    PrimaryButton,
    FiltersContainer,
    ProjectContractsFilterFields,
    TableSkeleton,
    ProjectContractCreatePage,
    TimelinePanel: TimelinePanelAsync,
  },
  mixins: [notificationMixin, getApiErrorMessageMixin, timelineSideModalMixin, listQueryMixin, projectContractModalMixin],
  emits: ['budget-updated'],
  props: {
    editingItem: { type: Object, required: true },
  },
  data() {
    return {
      loading: false,
      allContracts: [],
      lifecycleStatusFilter: '',
      paymentStatusFilter: '',
      contractStatusFilter: '',
      cashRegisterFilter: '',
      typeFilter: '',
      cashRegisters: [],
      lastFetchedProjectId: null,
      forceRefresh: false,
      columnsConfig: [
        { name: "id", label: "ID", size: 80 },
        { name: "number", label: this.$t("contractNumber"), size: 150 },
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
        { name: "amount", label: this.$t("amount"), size: 120, html: true },
        { name: "cashRegisterName", label: this.$t("cashRegister"), size: 150 },
        {
          name: "dateUser",
          label: this.$t("dateUser"),
          size: 100,
          component: markRaw(DateUserCell),
          props: (item, column) => buildDateUserCellProps(item, '', column?.dateDisplayMode),
        },
        { name: "returned", label: this.$t("contractDocument"), size: 100, html: true },
        { name: "paymentStatusText", label: this.$t("payment"), size: 140, html: true },
        { name: "note", label: this.$t("note"), size: 200 },
      ],
    };
  },
  computed: {
    paidTotalDisplay() {
      return this.formatTotals(this.contractTotals.paid);
    },
    unpaidTotalDisplay() {
      return this.formatTotals(this.contractTotals.unpaid);
    },
    totalDisplay() {
      return this.formatTotals(this.contractTotals.total);
    },
    hasContractsTotals() {
      return (this.filteredContracts || []).length > 0;
    },
    filteredContracts() {
      return (this.allContracts || []).filter((item) => matchesProjectContractFilters(item, {
        lifecycleStatusFilter: this.lifecycleStatusFilter,
        contractStatusFilter: this.contractStatusFilter,
        paymentStatusFilter: this.paymentStatusFilter,
        typeFilter: this.typeFilter,
        cashRegisterFilter: this.cashRegisterFilter,
      }));
    },
    contractTabModalTitle() {
      return sideModalCrudTitle(this.$t.bind(this), {
        item: this.editingContractItem,
        entityGenitiveKey: 'sideModalGenContract',
        entityNominativeKey: 'sideModalNomContract',
        getName: (c) => c?.number || c?.name || '',
      });
    },
    contractTotals() {
      return sumContractsByCurrency(this.filteredContracts);
    },
  },
  watch: {
    editingItem: {
      handler() {
        this.fetchContracts();
      },
      immediate: true,
    },
  },
  async mounted() {
    if (!(this.$store.getters.cashRegisters?.length)) {
      await this.$store.dispatch('loadCashRegisters');
    }
    this.cashRegisters = this.$store.getters.cashRegisters || [];
  },
  methods: {
    cashRegisterOptionLabel(cashRegister) {
      return formatCashRegisterDisplay(cashRegister?.displayName || cashRegister?.name, cashRegister?.currencyCode) || '';
    },
    getActiveFiltersCount() {
      return this.getActiveFiltersCountFromConfig([
        { value: this.lifecycleStatusFilter, defaultValue: '' },
        { value: this.paymentStatusFilter, defaultValue: '' },
        { value: this.contractStatusFilter, defaultValue: '' },
        { value: this.cashRegisterFilter, defaultValue: '' },
        { value: this.typeFilter, defaultValue: '' },
      ]);
    },
    resetFilters() {
      this.resetFiltersFromConfig({
        lifecycleStatusFilter: '',
        paymentStatusFilter: '',
        contractStatusFilter: '',
        cashRegisterFilter: '',
        typeFilter: '',
      }, () => { });
    },
    applyFilters() { },
    async saveContractField(contractId, field, value) {
      const item = this.allContracts?.find((i) => i.id === contractId);
      if (!item) {
        return;
      }

      const result = await patchProjectContractTableField(item, contractId, field, value);
      if (!result.ok) {
        const msg = this.getApiErrorMessage(result.error);
        this.showNotification(this.$t('error'), Array.isArray(msg) ? msg.join(', ') : msg, true);
      }
    },
    formatTotals(totalsByCurrency) {
      return formatContractTotalsByCurrency(totalsByCurrency, this.$formatNumber.bind(this));
    },
    onContractModalBeforeOpen() {
      this.resetTimelineSidebar();
    },
    onContractModalClose() {
      this.resetTimelineSidebar();
    },
    onContractSaved() {
      this.forceRefresh = true;
      this.fetchContracts();
      this.$emit('budget-updated');
    },
    async fetchContracts() {
      if (!this.editingItem) return;
      if (this.lastFetchedProjectId === this.editingItem.id && !this.forceRefresh) {
        return;
      }
      this.loading = true;
      try {
        const items = await this.$store.dispatch('loadProjectContractsByProject', this.editingItem.id);
        this.allContracts = (items || []).map(enrichProjectContractForTable);
        this.lastFetchedProjectId = this.editingItem.id;
        this.forceRefresh = false;
      } catch {
        this.allContracts = [];
      }
      this.loading = false;
    },
    itemMapper(item, column) {
      return mapProjectContractTableColumn(item, column, {
        t: this.$t.bind(this),
      });
    },
  },
};
</script>

<template>
  <div class="mt-4">
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
              <div>
                <label class="block mb-2 text-xs font-semibold">{{ $t('contractFormat') }}</label>
                <select v-model="lifecycleStatusFilter" class="w-full">
                  <option value="">
                    {{ $t('allStatuses') }}
                  </option>
                  <option value="draft">
                    {{ $t('contractStatusDraft') }}
                  </option>
                  <option value="active">
                    {{ $t('contractStatusActive') }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block mb-2 text-xs font-semibold">{{ $t('payment') }}</label>
                <select v-model="paymentStatusFilter" class="w-full">
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
                <label class="block mb-2 text-xs font-semibold">{{ $t('contractSignature') }}</label>
                <select v-model="contractStatusFilter" class="w-full">
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
                <select v-model="cashRegisterFilter" class="w-full">
                  <option value="">
                    {{ $t('allCashRegisters') }}
                  </option>
                  <option v-for="cashRegister in cashRegisters" :key="cashRegister.id" :value="cashRegister.id">
                    {{ cashRegisterOptionLabel(cashRegister) }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block mb-2 text-xs font-semibold">{{ $t('contractType') }}</label>
                <select v-model="typeFilter" class="w-full">
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
import TableSkeleton from "@/views/components/app/TableSkeleton.vue";
import listQueryMixin from "@/mixins/listQueryMixin";
import ProjectContractCreatePage from "./ProjectContractCreatePage.vue";
import ProjectContractController from "@/api/ProjectContractController";
import notificationMixin from "@/mixins/notificationMixin";
import getApiErrorMessageMixin from "@/mixins/getApiErrorMessageMixin";
import { TimelinePanelAsync } from "@/utils/timelinePanelAsync";
import timelineSideModalMixin from "@/mixins/timelineSideModalMixin";
import { sumContractsByCurrency } from '@/utils/contractTotalsUtils';
import { enrichProjectContractForTable } from '@/utils/projectContractTableRow';
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
    TableSkeleton,
    ProjectContractCreatePage,
    TimelinePanel: TimelinePanelAsync,
  },
  mixins: [notificationMixin, getApiErrorMessageMixin, timelineSideModalMixin, listQueryMixin],
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
      contractModalOpen: false,
      editingContractItem: null,
      contractLoading: false,
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
          props: (item) => buildDateUserCellProps(item, ''),
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
      const result = Object.entries(totalsByCurrency || {})
        .map(([currencyCode, amount]) => `${this.$formatNumber(amount || 0, true)} ${currencyCode}`.trim())
        .join(' / ');

      return result || '0';
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
      switch (column) {
        case "number":
          return item.number;
        case "lifecycleStatus":
          return item.status === 'active' ? 1 : 0;
        case "amount":
          return item.formatAmount();
        case "cashRegisterName":
          return item.cashRegisterName;
        case "dateUser":
          return item.formatDateUser ? item.formatDateUser() : `${item.formatDate()} / ${item.creator?.name}`;
        case "returned":
          return item.formatReturnedStatus();
        case "paymentStatusText":
          return item.formatPaidStatus();
        case "note":
          return item.note;
        default:
          return item[column];
      }
    },
    async handleContractClick(item) {
      try {
        this.resetTimelineSidebar();
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
      this.resetTimelineSidebar();
      this.editingContractItem = null;
      this.contractModalOpen = true;
    },
    async handleRefreshContract() {
      if (this.editingContractItem?.id) {
        const updated = await ProjectContractController.getItem(this.editingContractItem.id);
        this.editingContractItem = updated;
        this.refreshTimelineIfVisible();
      }
    },
    closeContractModal() {
      this.contractModalOpen = false;
      this.editingContractItem = null;
      this.resetTimelineSidebar();
    },
    handleContractSaved() {
      this.closeContractModal();
      this.forceRefresh = true;
      this.fetchContracts();
      this.$emit('budget-updated');
    },
    handleContractSavedError(error) {
      const msg = this.getApiErrorMessage(error);
      const text = Array.isArray(msg) ? msg.join(', ') : msg;
      this.showNotification(this.$t('error'), text, true);
    },
    handleContractDeleted() {
      this.closeContractModal();
      this.forceRefresh = true;
      this.fetchContracts();
      this.$emit('budget-updated');
    },
    handleContractDeletedError(error) {
      const msg = this.getApiErrorMessage(error);
      const text = Array.isArray(msg) ? msg.join(', ') : msg;
      this.showNotification(this.$t('error'), text, true);
    },
  },
};
</script>

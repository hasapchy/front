<template>
  <div class="layout-flex-fill-col">
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
            table-key="admin.leads"
            :columns-config="columnsConfig"
            :table-data="data.items"
            :item-mapper="itemMapper"
            :on-item-click="onItemClick"
            @selection-change="selectedIds = $event"
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
                  <PrimaryButton
                    :onclick="() => showModal(null)"
                    icon="fas fa-plus"
                    :disabled="!$store.getters.hasPermission('leads_create')"
                  />
                  <transition name="fade">
                    <BatchButton
                      v-if="selectedIds.length"
                      :selected-ids="selectedIds"
                      :batch-actions="getBatchActions()"
                      :show-status-select="false"
                    />
                  </transition>
                  <ViewModeToggle
                    :view-mode="displayViewMode"
                    :show-kanban="true"
                    :show-cards="true"
                    @change="changeViewMode"
                  />
                </template>
                <template #gear="gearSlot">
                  <TableFilterButton
                    :on-reset="gearSlot.resetColumns"
                  >
                    <ul>
                      <draggable
                        v-if="gearSlot.columns && gearSlot.columns.length"
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
                                class="text-sm mr-2 text-[var(--color-info)]"
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
            :disabled="!$store.getters.hasPermission('leads_create')"
          />
          <transition name="fade">
            <BatchButton
              v-if="selectedIds.length"
              :selected-ids="selectedIds"
              :batch-actions="getBatchActions()"
              :show-status-select="false"
            />
          </transition>
          <ViewModeToggle
            :view-mode="displayViewMode"
            :show-kanban="true"
            :show-cards="true"
            @change="changeViewMode"
          />
        </template>
        <template #card-bar-right-after>
          <KanbanFieldsButton mode="leads" />
        </template>
        <template #card-bar-gear />
        <template #cards>
          <MapperCardGrid
            class="mt-4"
            :items="data.items"
            :card-config="leadCardConfig"
            :card-mapper="leadCardMapper"
            title-field="leadTitle"
            title-subtitle-field="leadClient"
            header-suffix-field="leadDate"
            :selected-ids="selectedIds"
            :show-checkbox="canBatchDeleteLeads"
            @dblclick="onItemClick"
            @select-toggle="toggleSelectRow"
          />
        </template>
      </CardListViewShell>

      <div
        v-else-if="displayViewMode === 'kanban'"
        key="kanban-view"
        class="kanban-view-container"
      >
        <TableControlsBar :show-pagination="false">
          <template #left>
            <PrimaryButton
              :onclick="() => showModal(null)"
              icon="fas fa-plus"
              :disabled="!$store.getters.hasPermission('leads_create')"
            />
            <transition name="fade">
              <BatchButton
                v-if="selectedIds.length"
                :selected-ids="selectedIds"
                :batch-actions="getBatchActions()"
                :show-status-select="false"
              />
            </transition>
            <ViewModeToggle
              :view-mode="displayViewMode"
              :show-kanban="true"
              :show-cards="true"
              @change="changeViewMode"
            />
          </template>
          <template #right-after>
            <KanbanFieldsButton mode="leads" />
          </template>
        </TableControlsBar>

        <div class="kanban-board-area">
          <KanbanBoard
            :orders="allKanbanItems"
            :statuses="statuses"
            :selected-ids="selectedIds"
            :loading="kanbanBoardLoading"
            :is-lead-mode="true"
            :status-meta="kanbanByStatus"
            @order-moved="handleLeadMoved"
            @card-dblclick="onItemClick"
            @card-select-toggle="toggleSelectRow"
            @column-select-toggle="handleColumnSelectToggle"
            @load-more="loadMoreKanbanItems($event)"
          />
        </div>
      </div>

      <div
        v-else
        key="loader"
        class="min-h-64"
      >
        <TableSkeleton v-if="displayViewMode === 'table'" />
        <CardsSkeleton v-else-if="displayViewMode === 'cards'" />
        <TableSkeleton v-else />
      </div>
    </transition>

    <SideModalDialog
      :show-form="modalDialog"
      :title="sideModalCrudTitle('sideModalGenLead', 'sideModalNomLead')"
      :onclose="handleModalClose"
    >
      <LeadCreatePage
        v-if="modalDialog"
        :key="editingItem ? editingItem.id : 'new-lead'"
        ref="leadCreateForm"
        :editing-item="editingItem"
        :statuses="statuses"
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
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import KanbanBoard from '@/views/components/app/kanban/KanbanBoard.vue';
import KanbanFieldsButton from '@/views/components/app/kanban/KanbanFieldsButton.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ClientButtonCell from '@/views/components/app/buttons/ClientButtonCell.vue';
import StatusSelectCell from '@/views/components/app/buttons/StatusSelectCell.vue';
import LeadCreatePage from '@/views/pages/leads/LeadCreatePage.vue';
import LeadController from '@/api/LeadController';
import LeadStatusController from '@/api/LeadStatusController';
import { VueDraggableNext } from 'vue-draggable-next';
import { markRaw } from 'vue';
import { eventBus } from '@/eventBus';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import notificationMixin from '@/mixins/notificationMixin';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import modalMixin from '@/mixins/modalMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import listQueryMixin from '@/mixins/listQueryMixin';
import kanbanByStatusMixin from '@/mixins/kanbanByStatusMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';
import { highlightMatches } from '@/utils/searchUtils';
import { dayjsDateTime } from '@/utils/dateUtils';
import { getClientDisplayName } from '@/utils/displayUtils';
import { normalizeKanbanStatuses } from '@/utils/kanbanUtils';

const leadsViewModeMixin = createStoreViewModeMixin({
  getter: 'leadsViewMode',
  dispatch: 'setLeadsViewMode',
  modes: ['table', 'kanban', 'cards'],
});

export default {
  name: 'LeadsPage',
  components: {
    SideModalDialog,
    PrimaryButton,
    DraggableTable,
    TableControlsBar,
    TableFilterButton,
    KanbanBoard,
    KanbanFieldsButton,
    CardListViewShell,
    MapperCardGrid,
    ViewModeToggle,
    TableSkeleton,
    CardsSkeleton,
    BatchButton,
    AlertDialog,
    LeadCreatePage,
    draggable: VueDraggableNext,
  },
  mixins: [
    getApiErrorMessageMixin,
    crudEventMixin,
    notificationMixin,
    batchActionsMixin,
    modalMixin,
    companyChangeMixin,
    listQueryMixin,
    kanbanByStatusMixin,
    leadsViewModeMixin,
  ],
  data() {
    return {
      statuses: [],
      controller: LeadController,
      itemViewRouteName: 'LeadView',
      baseRouteName: 'Leads',
      errorGettingItemText: this.$t('errorGettingLead'),
      savedSuccessText: this.$t('leadSuccessfullyAdded'),
      savedErrorText: this.$t('errorSavingLead'),
      deletedSuccessText: this.$t('leadSuccessfullyDeleted'),
      deletedErrorText: this.$t('errorDeletingLead'),
      deletePermission: ['leads_delete_all', 'leads_delete_own'],
      showStatusSelect: false,
      kanbanErrorMessage: 'errorGettingLeadList',
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
    cardsToolbar() {
      return {
        showPagination: true,
        paginationData: this.paginationData,
        onPageChange: this.fetchItems,
        onPerPageChange: this.handlePerPageChange,
      };
    },
    canBatchDeleteLeads() {
      return (
        this.$store.getters.hasPermission('leads_delete_all') ||
        this.$store.getters.hasPermission('leads_delete_own')
      );
    },
    leadStatusesForSelect() {
      return (this.statuses || []).filter((s) => s.isActive !== false);
    },
    columnsConfig() {
      return [
        { name: 'select', label: '#', size: 15 },
        { name: 'id', label: 'number', size: 56, html: true },
        { name: 'leadTitle', label: 'timelineFieldByType.lead.title' },
        {
          name: 'client',
          label: 'clients',
          component: markRaw(ClientButtonCell),
          props: (item) => ({ client: item.client, searchQuery: this.searchQuery }),
        },
        {
          name: 'statusName',
          label: 'status',
          component: markRaw(StatusSelectCell),
          props: (item) => ({
            value: item.statusId != null ? Number(item.statusId) : null,
            statuses: this.leadStatusesForSelect,
            plainNames: true,
            disabled: !this.canUpdateLeadInTable(item),
            onChange: (newStatusId) => this.handleLeadTableStatusChange(item, newStatusId),
          }),
        },
        { name: 'sourceName', label: 'source' },
        { name: 'comment', label: 'comment' },
        { name: 'filesCount', label: 'files' },
      ];
    },
    leadCardConfig() {
      return [
        { name: 'statusName', label: 'status', icon: 'fas fa-tag text-[#3571A4]' },
        { name: 'sourceName', label: 'source', icon: 'fas fa-bullhorn text-[#3571A4]' },
        { name: 'comment', label: 'comment', icon: 'fas fa-comment text-[#3571A4]' },
        { name: 'filesCount', label: 'files', icon: 'fas fa-paperclip text-[#3571A4]', slot: 'footer' },
      ];
    },
  },
  watch: {
    '$route.params.id': {
      immediate: true,
      handler(value) {
        this.handleRouteItem(value);
      },
    },
    displayViewMode: {
      handler(newMode, oldMode) {
        if (oldMode === undefined) {
          return;
        }
        this.loading = true;
        this.resetKanbanPagination();
        this.$nextTick(() => {
          this.fetchItems(1, false);
        });
      },
      immediate: false,
    },
  },
  created() {
    this.$store.commit('SET_SETTINGS_OPEN', false);
    eventBus.on('global-search', this.handleSearch);
    this.fetchLeadStatuses();
  },
  beforeUnmount() {
    eventBus.off('global-search', this.handleSearch);
  },
  mounted() {
    this.fetchItems();
  },
  methods: {
    showModal(item = null) {
      modalMixin.methods.showModal.call(this, item);
    },
    closeModal(skipScrollRestore = false) {
      modalMixin.methods.closeModal.call(this, skipScrollRestore);
      if (this.$route.params.id) {
        this.$router.replace({ name: 'Leads' });
      }
      this.editingItem = null;
    },
    async fetchLeadStatuses() {
      try {
        const raw = await LeadStatusController.getAllItems();
        this.statuses = normalizeKanbanStatuses(raw);
      } catch (e) {
        this.statuses = [];
        this.showNotification(this.$t('error'), this.getApiErrorMessage(e), true);
      }
    },
    ensureKanbanStatuses() {
      return this.fetchLeadStatuses();
    },
    async fetchKanbanStatusPage(statusId, page) {
      return LeadController.getItems(page, this.kanbanFetchPerPage, { status_id: statusId });
    },
    async handleCompanyChanged(companyId, previousCompanyId) {
      this.selectedIds = [];
      this.resetKanbanPagination();
      await this.fetchLeadStatuses();
      await this.fetchItems(1, previousCompanyId == null);
    },
    async fetchItems(page = 1, silent = false) {
      if (this.displayViewMode === 'kanban') {
        if (page === 1) {
          this.resetKanbanPagination();
        }
        if (!silent) {
          this.loading = true;
        }
        try {
          await this.fetchLeadStatuses();
          await this.fetchKanbanInitial();
        } catch (error) {
          this.showNotification(this.$t('errorGettingLeadList'), error.message, true);
        }
        if (!silent) {
          this.loading = false;
        }
        return;
      }

      if (!silent) {
        this.loading = true;
      }
      try {
        const res = await LeadController.getItems(page, this.perPage);
        this.data = {
          items: res.items || [],
          currentPage: res.currentPage || 1,
          lastPage: res.lastPage || 1,
          total: res.total || 0,
        };
        if (!this.statuses.length) {
          await this.fetchLeadStatuses();
        }
      } catch (error) {
        this.showNotification(this.$t('errorGettingLeadList'), error.message, true);
        this.data = { items: [], currentPage: 1, lastPage: 1, total: 0 };
      }
      if (!silent) {
        this.loading = false;
      }
    },
    getCurrentItems() {
      return this.displayViewMode === 'kanban' ? this.allKanbanItems : (this.data?.items || []);
    },
    async handleLeadMoved(updateData) {
      if (updateData.type !== 'status') {
        return;
      }
      const lead = this.getCurrentItems().find((l) => Number(l.id) === Number(updateData.orderId));
      if (!lead) {
        await this.fetchItems(this.data?.currentPage ?? 1, true);
        return;
      }
      if (Number(lead.statusId) === Number(updateData.statusId)) {
        return;
      }
      try {
        await LeadController.updateItem(lead.id, { status_id: updateData.statusId });
        lead.statusId = Number(updateData.statusId);
        const status = this.statuses.find((s) => Number(s.id) === Number(updateData.statusId));
        if (status) {
          lead.status = { id: status.id, name: status.name, color: status.color };
        }
        this.showNotification(this.$t('statusUpdated'), '', false);
      } catch (error) {
        this.showNotification(this.$t('errorUpdatingStatus'), this.getApiErrorMessage(error), true);
        await this.fetchItems(this.data?.currentPage ?? 1, true);
      }
    },
    canUpdateLeadInTable(lead) {
      if (!lead) {
        return false;
      }
      if (this.$store.getters.hasPermission('leads_update_all')) {
        return true;
      }
      if (this.$store.getters.hasPermission('leads_update_own')) {
        const uid = this.$store.state.user?.id;
        const creatorId = lead.creatorId ?? lead.creator_id;
        return creatorId != null && Number(creatorId) === Number(uid);
      }
      return false;
    },
    async handleLeadTableStatusChange(lead, newStatusId) {
      if (!lead || newStatusId == null || Number(lead.statusId) === Number(newStatusId)) {
        return;
      }
      if (!this.canUpdateLeadInTable(lead)) {
        return;
      }
      try {
        await LeadController.updateItem(lead.id, { status_id: newStatusId });
        lead.statusId = Number(newStatusId);
        const status = this.statuses.find((s) => Number(s.id) === Number(newStatusId));
        if (status) {
          lead.status = { id: status.id, name: status.name, color: status.color };
        }
        this.showNotification(this.$t('statusUpdated'), '', false);
      } catch (error) {
        this.showNotification(this.$t('errorUpdatingStatus'), this.getApiErrorMessage(error), true);
        await this.fetchItems(this.data?.currentPage ?? 1, true);
      }
    },
    handleColumnSelectToggle(leadIds, select) {
      if (select) {
        const next = [...this.selectedIds];
        leadIds.forEach((id) => {
          if (!next.includes(id)) {
            next.push(id);
          }
        });
        this.selectedIds = next;
      } else {
        this.selectedIds = this.selectedIds.filter((id) => !leadIds.includes(id));
      }
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
      const search = this.searchQuery;
      switch (c) {
        case 'id':
          return search ? highlightMatches(String(i.id ?? ''), search) : i.id;
        case 'leadTitle': {
          const t = i.title != null && String(i.title).trim() !== '' ? String(i.title).trim() : '';
          return t ? (search ? highlightMatches(t, search) : t) : '—';
        }
        case 'statusName':
          return i.status?.name || '—';
        case 'sourceName':
          return i.source?.name || '—';
        case 'comment':
          if (!i.comment) {
            return '—';
          }
          return search ? highlightMatches(i.comment, search) : i.comment;
        case 'filesCount': {
          const n = Array.isArray(i.files) ? i.files.length : 0;
          return String(n);
        }
        case 'dateUser':
          return dayjsDateTime(i.date || i.createdAt);
        default:
          return i[c] ?? '—';
      }
    },
    leadCardMapper(item, field) {
      if (!item) {
        return '';
      }
      switch (field) {
        case 'leadTitle':
          if (item.title != null && String(item.title).trim() !== '') {
            return String(item.title).trim();
          }
          return `№${item.id}`;
        case 'leadClient':
          return getClientDisplayName(item.client) || '—';
        case 'leadDate':
          return dayjsDateTime(item.date || item.createdAt) || '';
        case 'statusName':
          return item.status?.name || '—';
        case 'sourceName':
          return item.source?.name || '—';
        case 'comment':
          return item.comment || '—';
        case 'filesCount': {
          const n = Array.isArray(item.files) ? item.files.length : 0;
          return String(n);
        }
        default:
          return item[field] ?? '';
      }
    },
  },
};
</script>


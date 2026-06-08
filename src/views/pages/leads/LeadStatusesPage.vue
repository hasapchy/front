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
            table-key="admin.lead_statuses"
            :columns-config="columnsConfig"
            :table-data="data.items"
            :item-mapper="itemMapper"
            :on-item-click="(i) => { showModal(i) }"
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
                    v-if="canCreateLeadStatus"
                    :onclick="() => { showModal(null) }"
                    icon="fas fa-plus"
                  />
                  <ViewModeToggle
                    :view-mode="displayViewMode"
                    :show-kanban="false"
                    :show-cards="true"
                    @change="changeViewMode"
                  />
                </template>
                <template #gear="{ resetColumns: gearReset, columns: gearColumns, toggleVisible: gearToggleVisible, log: gearLog }">
                  <TableFilterButton
                    v-if="gearColumns && gearColumns.length"
                    :on-reset="gearReset"
                  >
                    <ul>
                      <draggable
                        v-if="gearColumns.length"
                        class="dragArea list-group w-full"
                        :list="gearColumns"
                        @change="gearLog"
                      >
                        <li
                          v-for="(element, index) in gearColumns"
                          v-show="element.name !== 'select'"
                          :key="element.name"
                          class="flex items-center rounded p-2 hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)]"
                          @click="gearToggleVisible(index)"
                        >
                          <div class="flex w-full flex-row justify-between space-x-2 select-none">
                            <div>
                              <i
                                class="mr-2 text-sm text-[var(--color-info)]"
                                :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"
                              />
                              {{ $te(element.label) ? $t(element.label) : element.label }}
                            </div>
                            <div>
                              <i class="fas fa-grip-vertical cursor-grab text-sm text-gray-300" />
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
            v-if="canCreateLeadStatus"
            :onclick="() => { showModal(null) }"
            icon="fas fa-plus"
          />
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
            :card-mapper="leadStatusCardMapper"
            title-field="title"
            :title-prefix="leadStatusCardTitlePrefix"
            :show-checkbox="false"
            @dblclick="(i) => { showModal(i) }"
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
      :title="sideModalCrudTitle('sideModalGenLeadStatus', 'sideModalNomLeadStatus')"
      :onclose="handleModalClose"
    >
      <LeadStatusCreatePage
        :key="editingItem ? editingItem.id : 'new-lead-status'"
        ref="leadstatuscreatepageForm"
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
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import LeadStatusController from '@/api/LeadStatusController';
import LeadStatusCreatePage from '@/views/pages/leads/LeadStatusCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';

const leadStatusesListViewModeMixin = createStoreViewModeMixin({
  listPageKey: 'leadStatuses',
  modes: ['table', 'cards'],
});

export default {
  components: {
    PrimaryButton,
    SideModalDialog,
    LeadStatusCreatePage,
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
  mixins: [
    modalMixin,
    notificationMixin,
    crudEventMixin,
    getApiErrorMessageMixin,
    cardFieldsVisibilityMixin,
    leadStatusesListViewModeMixin,
  ],
  data() {
    return {
      cardFieldsKey: 'admin.lead_statuses.cards',
      controller: LeadStatusController,
      errorGettingItemText: this.$t('errorGettingLeadStatus'),
      savedSuccessText: this.$t('leadStatusSuccessfullyAdded'),
      savedErrorText: this.$t('errorSavingLeadStatus'),
      deletedSuccessText: this.$t('leadStatusSuccessfullyDeleted'),
      deletedErrorText: this.$t('errorDeletingLeadStatus'),
      showStatusSelect: false,
      columnsConfig: [
        { name: 'id', label: 'number', size: 60 },
        { name: 'name', label: 'statusName' },
        { name: 'color', label: 'color', html: true },
        { name: 'isActive', label: 'isActive' },
        { name: 'sort', label: 'sort' },
        { name: 'kanbanOutcome', label: 'leadKanbanOutcome' },
        { name: 'createdAt', label: 'creationDate' },
      ],
    };
  },
  computed: {
    canCreateLeadStatus() {
      return this.$store.getters.hasPermission('lead_statuses_create');
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
    cardConfigBase() {
      return [
        { name: 'title', label: null },
        { name: 'color', label: 'color', icon: 'fas fa-palette text-[#3571A4]', html: true },
        { name: 'isActive', label: 'isActive', icon: 'fas fa-toggle-on text-[#3571A4]' },
        { name: 'sort', label: 'sort', icon: 'fas fa-sort text-[#3571A4]' },
        { name: 'kanbanOutcome', label: 'leadKanbanOutcome', icon: 'fas fa-columns text-[#3571A4]' },
        { name: 'createdAt', label: 'creationDate', icon: 'fas fa-calendar text-[#3571A4]' },
      ];
    },
    cardConfigMerged() {
      const title = { name: 'title', label: null };
      const rest = (this.cardFields || []).map((f) => ({ ...f, visible: f.visible }));
      return [title, ...rest];
    },
  },
  mounted() {
    this.fetchItems();
  },
  methods: {
    leadStatusCardTitlePrefix() {
      return '<i class="fas fa-funnel-dollar text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
    },
    leadStatusCardMapper(item, fieldName) {
      if (!item) {
        return '';
      }
      if (fieldName === 'title') {
        return item.name || String(item.id);
      }
      return this.itemMapper(item, fieldName) ?? '';
    },
    kanbanOutcomeLabel(v) {
      if (v === 'success') {
        return this.$t('leadKanbanOutcomeSuccess');
      }
      if (v === 'failure') {
        return this.$t('leadKanbanOutcomeFailure');
      }
      return '—';
    },
    itemMapper(i, c) {
      switch (c) {
        case 'color':
          if (i.color) {
            return `<div style="width: 20px; height: 20px; background-color: ${i.color}; border-radius: 4px; display: inline-block; border: 1px solid #ddd;"></div>`;
          }
          return '-';
        case 'isActive':
          return i.isActive ? this.$t('yes') : this.$t('no');
        case 'sort':
          return String(i.sort ?? 0);
        case 'kanbanOutcome':
          return this.kanbanOutcomeLabel(i.kanbanOutcome);
        case 'createdAt':
          return i.formatCreatedAt ? i.formatCreatedAt() : i.createdAt;
        default:
          return i[c];
      }
    },
    async fetchItems(page = 1, silent = false) {
      if (!silent) {
        this.loading = true;
      }
      try {
        this.data = await LeadStatusController.getItems(page, this.perPage);
      } catch (error) {
        this.showNotification(this.$t('errorGettingLeadStatusList'), error.message, true);
      }
      if (!silent) {
        this.loading = false;
      }
    },
  },
};
</script>

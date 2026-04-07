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
            table-key="admin.leave_types"
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
                    v-if="canCreateLeaveType"
                    :onclick="() => { showModal(null) }"
                    icon="fas fa-plus"
                  />
                  <transition name="fade">
                    <BatchButton
                      v-if="selectedIds.length"
                      :selected-ids="selectedIds"
                      :batch-actions="getBatchActions()"
                    />
                  </transition>
                  <ViewModeToggle
                    :view-mode="displayViewMode"
                    :show-kanban="false"
                    :show-cards="true"
                    @change="changeViewMode"
                  />
                </template>
                <template #right>
                  <Pagination
                    v-if="paginationData"
                    :current-page="paginationData.currentPage"
                    :last-page="paginationData.lastPage"
                    :per-page="paginationData.perPage"
                    :per-page-options="paginationData.perPageOptions"
                    :show-per-page-selector="true"
                    @change-page="fetchItems"
                    @per-page-change="handlePerPageChange"
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
          <PrimaryButton
            v-if="canCreateLeaveType"
            :onclick="() => { showModal(null) }"
            icon="fas fa-plus"
          />
          <transition name="fade">
            <BatchButton
              v-if="selectedIds.length"
              :selected-ids="selectedIds"
              :batch-actions="getBatchActions()"
            />
          </transition>
          <ViewModeToggle
            :view-mode="displayViewMode"
            :show-kanban="false"
            :show-cards="true"
            @change="changeViewMode"
          />
        </template>
        <template #card-bar-right>
          <Pagination
            v-if="paginationData"
            :current-page="paginationData.currentPage"
            :last-page="paginationData.lastPage"
            :per-page="paginationData.perPage"
            :per-page-options="paginationData.perPageOptions"
            :show-per-page-selector="true"
            @change-page="fetchItems"
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
            :items="data.items"
            :card-config="cardConfigMerged"
            :card-mapper="leaveTypeCardMapper"
            title-field="title"
            :title-prefix="leaveTypeCardTitlePrefix"
            :selected-ids="selectedIds"
            :show-checkbox="$store.getters.hasPermission('leave_types_delete_all')"
            @dblclick="(i) => onItemClick(i)"
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
      :title="sideModalCrudTitle('sideModalGenLeaveType', 'sideModalNomLeaveType')"
      :onclose="handleModalClose"
    >
      <LeaveTypeCreatePage
        :key="editingItem ? editingItem.id : 'new-leave-type'"
        ref="leavetypecreatepageForm"
        :editing-item="editingItem"
        @saved="handleSaved"
        @saved-error="handleSavedError"
        @deleted="handleDeleted"
        @deleted-error="handleDeletedError"
        @close-request="closeModal"
      />
    </SideModalDialog>
    <AlertDialog
      :dialog="deleteDialog"
      :descr="`${$t('confirmDelete')} (${selectedIds.length})?`"
      :confirm-text="$t('delete')"
      :leave-text="$t('cancel')"
      @confirm="confirmDeleteItems"
      @leave="deleteDialog = false"
    />
  </div>
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import LeaveTypeController from '@/api/LeaveTypeController';
import LeaveTypeCreatePage from './LeaveTypeCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';
import { translateLeaveType } from '@/utils/translationUtils';

const leaveTypesListViewModeMixin = createStoreViewModeMixin({
  listPageKey: 'leaveTypes',
  modes: ['table', 'cards'],
});

export default {
  components: {
    PrimaryButton,
    SideModalDialog,
    LeaveTypeCreatePage,
    Pagination,
    DraggableTable,
    BatchButton,
    AlertDialog,
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
    batchActionsMixin,
    getApiErrorMessageMixin,
    cardFieldsVisibilityMixin,
    leaveTypesListViewModeMixin,
  ],
  data() {
    return {
      cardFieldsKey: 'admin.leave_types.cards',
      titleField: 'title',
      controller: LeaveTypeController,
      cacheInvalidationType: 'leaveTypes',
      deletePermission: 'leave_types_delete_all',
      showStatusSelect: false,
      itemViewRouteName: 'LeaveTypeView',
      baseRouteName: 'leave_types',
      errorGettingItemText: this.$t('errorGettingLeaveType'),
      savedSuccessText: this.$t('leaveTypeSuccessfullyAdded'),
      savedErrorText: this.$t('errorSavingLeaveType'),
      deletedSuccessText: this.$t('leaveTypeSuccessfullyDeleted'),
      deletedErrorText: this.$t('errorDeletingLeaveType'),
      columnsConfig: [
        { name: 'select', label: '#', size: 15 },
        { name: 'id', label: 'number', size: 60 },
        { name: 'name', label: 'name' },
        { name: 'color', label: 'color', size: 100, html: true },
        { name: 'isPenalty', label: 'leaveTypeIsPenaltyDays', size: 120 },
        { name: 'createdAt', label: 'creationDate' },
      ],
    };
  },
  computed: {
    canCreateLeaveType() {
      return this.$store.getters.hasPermission('leave_types_create');
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
        { name: 'isPenalty', label: 'leaveTypeIsPenaltyDays', icon: 'fas fa-calendar-times text-[#3571A4]' },
        { name: 'createdAt', label: 'creationDate', icon: 'fas fa-calendar text-[#3571A4]' },
      ];
    },
    cardConfigMerged() {
      const title = { name: 'title', label: null };
      const rest = (this.cardFields || []).map((f) => ({ ...f, visible: f.visible }));
      return [title, ...rest];
    },
  },
  watch: {
    '$route.params.id': {
      immediate: true,
      handler(value) {
        this.handleRouteItem(value);
      },
    },
  },
  mounted() {
    this.fetchItems();
  },
  methods: {
    leaveTypeCardTitlePrefix() {
      return '<i class="fas fa-umbrella-beach text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
    },
    leaveTypeCardMapper(item, fieldName) {
      if (!item) return '';
      if (fieldName === 'title') {
        if (item.name) {
          return translateLeaveType(item.name, this.$t);
        }
        return String(item.id);
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
    itemMapper(i, c) {
      switch (c) {
        case 'name':
          return translateLeaveType(i.name, this.$t);
        case 'createdAt':
          return i.formatCreatedAt();
        case 'color':
          if (i.color) {
            return `<div style="width: 20px; height: 20px; background-color: ${i.color}; border-radius: 4px; display: inline-block; border: 1px solid #ddd;"></div>`;
          }
          return '-';
        case 'isPenalty':
          return i.isPenalty ? this.$t('yes') : this.$t('no');
        default:
          return i[c];
      }
    },
    async fetchItems(page = 1, silent = false) {
      if (!silent) {
        this.loading = true;
      }
      try {
        this.data = await LeaveTypeController.getItems(page, this.perPage);
      } catch (error) {
        this.showNotification(this.$t('errorGettingLeaveTypeList'), error.message, true);
      }
      if (!silent) {
        this.loading = false;
      }
    },
    closeModal(skipScrollRestore = false) {
      modalMixin.methods.closeModal.call(this, skipScrollRestore);
      if (this.$route.params.id) {
        this.$router.replace({ name: 'leave_types' });
      }
    },
  },
};
</script>

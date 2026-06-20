<template>
  <div>
    <transition
      name="fade"
      mode="out-in"
    >
      <CardListViewShell
        v-if="isDataReady"
        display-view-mode="table"
      >
        <template #table>
          <DraggableTable
            table-key="finance.journal_entries"
            :columns-config="columnsConfig"
            :table-data="data.items"
            :item-mapper="itemMapper"
            :on-item-click="onItemClick"
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
                    :disabled="!$store.getters.hasPermission('journal_entries_create')"
                  />
                </template>
                <template #filters-desktop>
                  <JournalEntryFilters
                    :status-filter="statusFilter"
                    :template-key-filter="templateKeyFilter"
                    :date-from="dateFrom"
                    :date-to="dateTo"
                    :has-active-filters="hasActiveFilters"
                    :active-filters-count="activeFiltersCount"
                    @update:status-filter="statusFilter = $event"
                    @update:template-key-filter="templateKeyFilter = $event"
                    @update:date-from="dateFrom = $event"
                    @update:date-to="dateTo = $event"
                    @reset="resetFilters"
                    @apply="applyFilters"
                  />
                </template>
                <template #gear="{ resetColumns, columns, toggleVisible, log }">
                  <TableFilterButton
                    v-if="columns && columns.length"
                    :on-reset="resetColumns"
                  >
                    <TableColumnDateModeSection
                      :items="dateColumnsForSettings(columns)"
                      :resolve-mode="resolveColumnDateMode"
                      @set-mode="(item, mode) => setColumnDateDisplayMode(columns, item.index, mode)"
                    />
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
                </template>
              </TableControlsBar>
            </template>
          </DraggableTable>
        </template>
      </CardListViewShell>
      <TableSkeleton
        v-else
        :columns="5"
      />
    </transition>

    <SideModalDialog
      :show-form="modalDialog"
      :title="sideModalCrudTitle('sideModalGenJournalEntry', 'sideModalNomJournalEntry')"
      :onclose="handleModalClose"
    >
      <JournalEntryCreatePage
        v-if="modalDialog"
        ref="journalentrycreatepageForm"
        @saved="onAfterCreated"
        @saved-error="handleSavedError"
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
import TableColumnDateModeSection from '@/views/components/app/forms/TableColumnDateModeSection.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import JournalEntryFilters from '@/views/components/app/JournalEntryFilters.vue';
import JournalEntryCreatePage from '@/views/pages/journal_entries/JournalEntryCreatePage.vue';
import JournalEntryController from '@/api/JournalEntryController';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import tableColumnDateModeMixin from '@/mixins/tableColumnDateModeMixin';
import { VueDraggableNext } from 'vue-draggable-next';
export default {
    components: {
        PrimaryButton,
        SideModalDialog,
        DraggableTable,
        TableControlsBar,
        TableFilterButton,
        TableColumnDateModeSection,
        TableSkeleton,
        CardListViewShell,
        JournalEntryFilters,
        JournalEntryCreatePage,
        draggable: VueDraggableNext,
    },
    mixins: [
        modalMixin,
        notificationMixin,
        crudEventMixin,
        getApiErrorMessageMixin,
        companyChangeMixin,
        tableColumnDateModeMixin,
    ],
    data() {
        return {
            tableColumnsPersistKey: 'finance.journal_entries',
            controller: JournalEntryController,
            itemViewRouteName: 'JournalEntryView',
            baseRouteName: 'JournalEntries',
            savedSuccessText: this.$t('journalEntrySaved'),
            savedErrorText: this.$t('journalEntrySaveError'),
            statusFilter: '',
            templateKeyFilter: '',
            dateFrom: '',
            dateTo: '',
            columnsConfig: [
                { name: 'entryNumber', label: 'number', visible: true },
                { name: 'entryDateFormatted', label: 'date', visible: true },
                { name: 'description', label: 'description', visible: true },
                { name: 'statusLabel', label: 'status', visible: true },
                { name: 'templateKeyLabel', label: 'type', visible: true },
            ],
        };
    },
    computed: {
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
        hasActiveFilters() {
            return !!(this.statusFilter || this.templateKeyFilter || this.dateFrom || this.dateTo);
        },
        activeFiltersCount() {
            return [this.statusFilter, this.templateKeyFilter, this.dateFrom, this.dateTo].filter(Boolean).length;
        },
        listFilters() {
            const filters = {};
            if (this.statusFilter) {
                filters.status = this.statusFilter;
            }
            if (this.templateKeyFilter) {
                filters.template_key = this.templateKeyFilter;
            }
            if (this.dateFrom) {
                filters.date_from = this.dateFrom;
            }
            if (this.dateTo) {
                filters.date_to = this.dateTo;
            }
            const search = this.$store.state.searchQuery;
            if (search) {
                filters.search = search;
            }
            return filters;
        },
    },
    mounted() {
        this.fetchItems();
        if (this.$route.query.create === '1') {
            this.showModal(null);
        }
    },
    methods: {
        itemMapper(item, column) {
            if (column === 'entryNumber') {
                return item.entryNumber || item.displayName;
            }
            if (column === 'entryDateFormatted') {
                return item.entryDateFormatted();
            }
            if (column === 'statusLabel') {
                return item.statusLabel(this.$t.bind(this));
            }
            if (column === 'templateKeyLabel') {
                return item.templateKeyLabel(this.$t.bind(this));
            }
            return item[column];
        },
        onItemClick(item) {
            if (!item?.id) {
                return;
            }
            this.$router.push({ name: 'JournalEntryView', params: { id: item.id } });
        },
        onAfterCreated(entry) {
            this.handleSaved();
            if (entry?.id) {
                this.$router.push({ name: 'JournalEntryView', params: { id: entry.id } });
            }
        },
        resetFilters() {
            this.statusFilter = '';
            this.templateKeyFilter = '';
            this.dateFrom = '';
            this.dateTo = '';
            this.fetchItems(1);
        },
        applyFilters() {
            this.fetchItems(1);
        },
        onCompanyChanged() {
            this.fetchItems(1);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                this.data = await JournalEntryController.getItems(page, this.perPage, this.listFilters);
            } catch (error) {
                this.showError(this.getApiErrorMessage(error));
            } finally {
                if (!silent) {
                    this.loading = false;
                }
            }
        },
    },
};
</script>

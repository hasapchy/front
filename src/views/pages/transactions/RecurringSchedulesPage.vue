<template>
  <div>
    <transition
      name="fade"
      mode="out-in"
    >
      <div
        v-if="data != null && !loading"
        key="table"
      >
        <DraggableTable
          table-key="admin.recurring_schedules"
          :columns-config="columnsConfig"
          :table-data="data.items"
          :item-mapper="itemMapper"
          :on-item-click="openEdit"
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
              <template #gear>
                <TableFilterButton
                  v-if="columns?.length"
                  :on-reset="resetColumns"
                >
                  <ul>
                    <draggable
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
                          <div><i class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab" /></div>
                        </div>
                      </li>
                    </draggable>
                  </ul>
                </TableFilterButton>
              </template>
            </TableControlsBar>
          </template>
        </DraggableTable>
      </div>
      <div
        v-else
        key="loader"
        class="min-h-64"
      >
        <TableSkeleton />
      </div>
    </transition>
    <SideModalDialog
      :show-form="showEditModal"
      :onclose="closeEdit"
    >
      <RecurringScheduleForm
        ref="scheduleFormRef"
        :schedule-id="editingId"
        :can-delete="editingItem && canDeleteItem(editingItem)"
        @saved="onSaved"
        @deleted="onDeleted"
        @close="closeEdit"
      />
    </SideModalDialog>
  </div>
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import RecurringTransactionController from '@/api/RecurringTransactionController';
import RecurringScheduleForm from '@/views/components/transactions/RecurringScheduleForm.vue';
import { formatDatabaseDate } from '@/utils/dateUtils';
import notificationMixin from '@/mixins/notificationMixin';

const WEEKDAY_LABELS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export default {
    name: 'RecurringSchedulesPage',
    mixins: [notificationMixin],
    components: {
        SideModalDialog,
        DraggableTable,
        TableControlsBar,
        TableFilterButton,
        TableSkeleton,
        RecurringScheduleForm,
        draggable: VueDraggableNext
    },
    data() {
        return {
            data: null,
            loading: true,
            page: 1,
            perPage: 20,
            showEditModal: false,
            editingId: null,
            editingItem: null
        };
    },
    computed: {
        canViewAll() {
            return this.$store.getters.hasPermission('rec_schedules_view_all');
        },
        canDeleteItem() {
            return (item) => this.canActOnItem(item, 'rec_schedules_delete_all', 'rec_schedules_delete');
        },
        paginationData() {
            if (!this.data) return null;
            return {
                currentPage: this.data.currentPage,
                lastPage: this.data.lastPage,
                perPage: this.perPage,
            };
        },
        columnsConfig() {
            const cols = [
                { name: 'id', label: 'id' },
                { name: 'templateName', label: 'template' },
                { name: 'templateCategory', label: 'category' },
                { name: 'templateTypeLabel', label: 'transactionType' },
                { name: 'templateAmountFormatted', label: 'amount' },
                { name: 'recurrenceLabel', label: 'recurrence' },
                { name: 'nextRunAt', label: 'nextRun' },
                { name: 'occurrenceCount', label: 'occurrenceCount' },
                { name: 'endInfo', label: 'end' }
            ];
            if (this.canViewAll) {
                cols.push({ name: 'creatorName', label: 'creator' });
            }
            return cols;
        }
    },
    mounted() {
        this.fetchItems(1);
    },
    methods: {
        canActOnItem(item, allPerm, ownPerm) {
            if (this.$store.getters.hasPermission(allPerm)) return true;
            return this.$store.getters.hasPermission(ownPerm) && item && (item.creator?.id ?? item.creatorId) === this.$store.getters.user?.id;
        },
        async fetchItems(page = 1) {
            this.loading = true;
            try {
                this.data = await RecurringTransactionController.getItems(page, this.perPage);
                this.page = this.data.currentPage;
            } catch (error) {
                this.showNotification(this.$t('errorGettingTransactionList'), error.message, true);
            }
            this.loading = false;
        },
        handlePerPageChange(perPage) {
            this.perPage = perPage;
            this.fetchItems(1);
        },
        formatRecurrence(rule) {
            if (!rule) return '';
            const freq = rule.frequency || 'daily';
            const interval = rule.interval || 1;
            const parts = [];
            if (freq === 'daily') {
                parts.push(interval === 1 ? this.$t('recurrenceDaily') : `${this.$t('every')} ${interval} ${this.$t('days')}`);
            } else if (freq === 'weekly') {
                const weekdays = rule.weekdays;
                if (weekdays && weekdays.length) {
                    const days = weekdays.map(d => WEEKDAY_LABELS[Number(d)]).join(', ');
                    parts.push(`${this.$t('weekly')}: ${days}`);
                } else {
                    parts.push(interval === 1 ? this.$t('recurrenceWeekly') : `${this.$t('every')} ${interval} ${this.$t('weeks')}`);
                }
            } else if (freq === 'monthly') {
                const day = rule.monthDay || 1;
                parts.push(interval === 1
                    ? this.$t('recurrenceMonthly') + ` (${day})`
                    : `${this.$t('every')} ${interval} ${this.$t('months')} (${day})`);
            } else if (freq === 'weekdays') {
                const weekdays = rule.weekdays && rule.weekdays.length ? rule.weekdays.map(d => WEEKDAY_LABELS[Number(d)]).join(', ') : 'Пн–Пт';
                parts.push(this.$t('recurrenceWeekdays') + ': ' + weekdays);
            } else {
                parts.push(freq);
            }
            return parts.join(' ');
        },
        itemMapper(item, columnName) {
            const t = item.template;
            switch (columnName) {
                case 'id':
                    return item.id ?? '';
                case 'templateName':
                    return t?.name ?? '';
                case 'templateCategory':
                    return t?.category?.name ?? '';
                case 'templateTypeLabel':
                    return t?.type ? this.$t('income') : this.$t('outcome');
                case 'templateAmountFormatted': {
                    const n = Number(t?.amount);
                    return Number.isFinite(n) ? n.toLocaleString('ru-RU', { minimumFractionDigits: 2 }) : '';
                }
                case 'recurrenceLabel':
                    return this.formatRecurrence(item.recurrenceRule);
                case 'nextRunAt':
                    return item.nextRunAt ? formatDatabaseDate(item.nextRunAt) : '';
                case 'occurrenceCount':
                    return item.occurrenceCount ?? 0;
                case 'endInfo':
                    if (item.endDate) return formatDatabaseDate(item.endDate);
                    if (item.endCount != null) return `${item.occurrenceCount ?? 0} / ${item.endCount}`;
                    return '';
                case 'creatorName':
                    return item.creator?.name ;
                default:
                    return item[columnName] ?? '';
            }
        },
        openEdit(item) {
            this.editingId = item.id;
            this.editingItem = item;
            this.showEditModal = true;
        },
        closeEdit() {
            this.showEditModal = false;
            this.editingId = null;
            this.editingItem = null;
            this.fetchItems(this.page);
        },
        onSaved() {
            this.closeEdit();
        },
        onDeleted() {
            this.closeEdit();
        }
    }
};
</script>

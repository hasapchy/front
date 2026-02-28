<template>
    <div>
        <transition name="fade" mode="out-in">
            <div v-if="data != null && !loading" key="table">
                <DraggableTable table-key="admin.recurring_schedules" :columns-config="columnsConfig"
                    :table-data="data.items" :item-mapper="itemMapper"
                    :onItemClick="openEdit">
                    <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                        <TableControlsBar :show-pagination="true"
                            :pagination-data="paginationData"
                            :on-page-change="fetchItems" :on-per-page-change="handlePerPageChange"
                            :resetColumns="resetColumns" :columns="columns" :toggleVisible="toggleVisible" :log="log">
                            <template #gear>
                                <TableFilterButton v-if="columns?.length" :onReset="resetColumns">
                                    <ul>
                                        <draggable class="dragArea list-group w-full" :list="columns" @change="log">
                                            <li v-for="(element, index) in columns" :key="element.name"
                                                v-show="element.name !== 'select'"
                                                @click="toggleVisible(index)"
                                                class="flex items-center hover:bg-gray-100 p-2 rounded">
                                                <div class="space-x-2 flex flex-row justify-between w-full select-none">
                                                    <div>
                                                        <i class="text-sm mr-2 text-[#337AB7]"
                                                            :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"></i>
                                                        {{ $te(element.label) ? $t(element.label) : element.label }}
                                                    </div>
                                                    <div><i class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab"></i></div>
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
            <div v-else key="loader" class="min-h-64">
                <TableSkeleton />
            </div>
        </transition>
        <SideModalDialog :showForm="showEditModal" :onclose="closeEdit">
            <RecurringScheduleForm ref="scheduleFormRef" :schedule-id="editingId" :can-delete="editingItem && canDeleteItem(editingItem)"
                @saved="onSaved" @deleted="onDeleted" @close="closeEdit" />
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

const WEEKDAY_LABELS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export default {
    name: 'RecurringSchedulesPage',
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
            perPageOptions: [10, 20, 50],
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
                currentPage: this.data.current_page,
                lastPage: this.data.last_page,
                perPage: this.data.per_page,
                perPageOptions: this.perPageOptions
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
            return this.$store.getters.hasPermission(ownPerm) && item && item.creator_id === this.$store.getters.user?.id;
        },
        async fetchItems(page = 1) {
            this.loading = true;
            try {
                const res = await RecurringTransactionController.getItems(page, this.perPage);
                this.data = {
                    items: res.items || [],
                    current_page: res.current_page ?? res.currentPage ?? 1,
                    last_page: res.last_page ?? res.lastPage ?? 1,
                    per_page: res.per_page ?? res.perPage ?? this.perPage,
                    total: res.total ?? 0
                };
                this.page = this.data.current_page;
            } catch (e) {
                this.data = { items: [], current_page: 1, last_page: 1, per_page: this.perPage, total: 0 };
            }
            this.loading = false;
        },
        handlePerPageChange(perPage) {
            this.perPage = perPage;
            this.fetchItems(1);
        },
        formatRecurrence(rule) {
            if (!rule || typeof rule !== 'object') return '—';
            const freq = rule.frequency || 'daily';
            const interval = rule.interval || 1;
            const parts = [];
            if (freq === 'daily') {
                parts.push(interval === 1 ? (this.$t('recurrenceDaily') || 'Ежедневно') : `${this.$t('every') || 'Каждые'} ${interval} ${this.$t('days') || 'дн.'}`);
            } else if (freq === 'weekly') {
                const weekdays = rule.weekdays;
                if (weekdays && weekdays.length) {
                    const days = weekdays.map(d => WEEKDAY_LABELS[Number(d)]).join(', ');
                    parts.push(`${this.$t('weekly') || 'Еженедельно'}: ${days}`);
                } else {
                    parts.push(interval === 1 ? (this.$t('recurrenceWeekly') || 'Еженедельно') : `${this.$t('every') || 'Каждые'} ${interval} ${this.$t('weeks') || 'нед.'}`);
                }
            } else if (freq === 'monthly') {
                const day = rule.month_day || 1;
                parts.push(interval === 1
                    ? (this.$t('recurrenceMonthly') || 'Ежемесячно') + ` (${day})`
                    : `${this.$t('every') || 'Каждые'} ${interval} ${this.$t('months') || 'мес.'} (${day})`);
            } else if (freq === 'weekdays') {
                const weekdays = rule.weekdays && rule.weekdays.length ? rule.weekdays.map(d => WEEKDAY_LABELS[Number(d)]).join(', ') : 'Пн–Пт';
                parts.push((this.$t('recurrenceWeekdays') || 'Будни') + ': ' + weekdays);
            } else {
                parts.push(freq);
            }
            return parts.join(' ');
        },
        itemMapper(item, columnName) {
            const t = item.template;
            switch (columnName) {
                case 'id':
                    return item.id ?? '—';
                case 'templateName':
                    return t?.name ?? '—';
                case 'templateCategory':
                    return t?.category?.name ?? '—';
                case 'templateTypeLabel':
                    return t?.type ? (this.$t('income') || 'Приход') : (this.$t('outcome') || 'Расход');
                case 'templateAmountFormatted': {
                    const n = Number(t?.amount);
                    return Number.isFinite(n) ? n.toLocaleString('ru-RU', { minimumFractionDigits: 2 }) : '—';
                }
                case 'recurrenceLabel':
                    return this.formatRecurrence(item.recurrence_rule);
                case 'nextRunAt':
                    return item.next_run_at ? formatDatabaseDate(item.next_run_at) : '—';
                case 'occurrenceCount':
                    return item.occurrence_count ?? 0;
                case 'endInfo':
                    if (item.end_date) return formatDatabaseDate(item.end_date);
                    if (item.end_count != null) return `${item.occurrence_count ?? 0} / ${item.end_count}`;
                    return '—';
                case 'creatorName':
                    return item.creator ? [item.creator.name, item.creator.surname].filter(Boolean).join(' ') : '—';
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

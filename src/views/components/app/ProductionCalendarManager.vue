<template>
  <div class="production-calendar-manager">
    <p class="text-sm text-gray-600 mb-4">
      {{ $t('productionCalendarHelp') }}
    </p>
    <div class="flex flex-wrap items-end gap-3 mb-1">
      <div>
        <label class="block text-sm font-medium mb-1">{{ $t('dateFrom') }}</label>
        <input
          v-model="periodFrom"
          type="date"
          class="px-2 py-1 border rounded"
          :disabled="!canCreate"
        >
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">{{ $t('dateTo') }}</label>
        <input
          v-model="periodTo"
          type="date"
          class="px-2 py-1 border rounded"
          :disabled="!canCreate"
        >
      </div>
      <PrimaryButton
        :onclick="addPeriod"
        icon="fas fa-plus"
        :disabled="!canCreate || !periodFrom || saving"
      >
        {{ $t('add') }}
      </PrimaryButton>
    </div>
    <p class="text-xs text-gray-500 mb-4">
      {{ $t('productionCalendarPeriodOptionalTo') }}
    </p>

    <transition
      name="fade"
      mode="out-in"
    >
      <TableSkeleton
        v-if="loading"
        key="sk"
        class="min-h-48"
      />
      <DraggableTable
        v-else
        key="tbl"
        table-key="company.productionCalendar"
        :columns-config="columnsConfig"
        :table-data="items"
        :item-mapper="itemMapper"
      />
    </transition>
  </div>
</template>

<script>
import dayjs from 'dayjs';
import { markRaw } from 'vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import ProductionCalendarDeleteCell from '@/views/components/app/ProductionCalendarDeleteCell.vue';
import CompanyProductionCalendarController from '@/api/CompanyProductionCalendarController';
import notificationMixin from '@/mixins/notificationMixin';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';

const productionCalendarDeleteCell = markRaw(ProductionCalendarDeleteCell);

export default {
    name: 'ProductionCalendarManager',
    components: { PrimaryButton, DraggableTable, TableSkeleton },
    mixins: [notificationMixin, getApiErrorMessage],
    props: {
        companyId: {
            type: Number,
            default: null,
        },
    },
    data() {
        return {
            periodFrom: '',
            periodTo: '',
            items: [],
            loading: false,
            saving: false,
            deletingId: null,
        };
    },
    computed: {
        canCreate() {
            return this.$store.getters.hasPermission('company_production_calendar_create');
        },
        canDelete() {
            return this.$store.getters.hasPermission('company_production_calendar_delete_all');
        },
        columnsConfig() {
            const cols = [
                { name: 'date', label: 'date', size: 200 },
            ];
            if (this.canDelete) {
                cols.push({
                    name: 'deleteAction',
                    label: 'actions',
                    size: 120,
                    component: productionCalendarDeleteCell,
                    props: (item) => ({
                        deleting: this.deletingId === item.id,
                        onDelete: () => this.removeRow(item),
                    }),
                });
            }
            return cols;
        },
    },
    watch: {
        companyId: {
            immediate: true,
            handler(v) {
                if (v) {
                    this.load();
                }
            },
        },
    },
    methods: {
        itemMapper(item, column) {
            if (column === 'date') {
                const d = dayjs(item.date);
                return d.isValid() ? d.format('DD.MM.YYYY') : item.date;
            }
            return '';
        },
        async load() {
            if (!this.companyId) {
                return;
            }
            this.loading = true;
            try {
                const list = await CompanyProductionCalendarController.getAll({});
                this.items = list.slice().sort((a, b) => a.date.localeCompare(b.date));
            } catch (e) {
                this.items = [];
                this.showNotification(this.$t('error'), this.getApiErrorMessage(e), true);
            } finally {
                this.loading = false;
            }
        },
        inclusiveDateStrings(start, end) {
            if (!start.isValid() || !end.isValid()) {
                return [];
            }
            const out = [];
            for (let c = start; !c.isAfter(end, 'day'); c = c.add(1, 'day')) {
                out.push(c.format('YYYY-MM-DD'));
            }
            return out;
        },
        async addPeriod() {
            if (!this.periodFrom || !this.canCreate || this.saving) {
                return;
            }
            const start = dayjs(this.periodFrom).startOf('day');
            let dates;
            if (!this.periodTo) {
                if (!start.isValid()) {
                    return;
                }
                dates = [start.format('YYYY-MM-DD')];
            } else {
                const end = dayjs(this.periodTo).startOf('day');
                if (end.isBefore(start, 'day')) {
                    this.showNotification(this.$t('error'), this.$t('dateToMustBeAfterDateFrom'), true);
                    return;
                }
                dates = this.inclusiveDateStrings(start, end);
                if (dates.length > 7) {
                    this.showNotification(this.$t('error'), this.$t('productionCalendarRangeTooLong'), true);
                    return;
                }
                if (!dates.length) {
                    return;
                }
            }
            this.saving = true;
            try {
                await CompanyProductionCalendarController.storeDates(dates);
                this.periodFrom = '';
                this.periodTo = '';
                await this.load();
                this.showNotification(this.$t('success'), this.$t('productionCalendarUpdated'), false);
            } catch (e) {
                this.showNotification(this.$t('error'), this.getApiErrorMessage(e), true);
            } finally {
                this.saving = false;
            }
        },
        async removeRow(row) {
            if (!this.canDelete || !row.id) {
                return;
            }
            this.deletingId = row.id;
            try {
                await CompanyProductionCalendarController.deleteById(row.id);
                await this.load();
                this.showNotification(this.$t('success'), this.$t('productionCalendarUpdated'), false);
            } catch (e) {
                this.showNotification(this.$t('error'), this.getApiErrorMessage(e), true);
            } finally {
                this.deletingId = null;
            }
        },
    },
};
</script>

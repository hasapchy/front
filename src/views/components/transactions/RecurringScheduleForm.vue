<template>
    <div class="flex flex-col h-full">
        <div :class="['flex flex-col overflow-auto flex-1 min-h-0', compact ? '' : 'p-4']">
            <h2 v-if="showHeader" class="text-lg font-bold mb-4">
                {{ isCreateMode ? ($t('createRecurringFromTemplate') || 'Повтор по шаблону') : ($t('recurringSchedules') || 'Повторяющиеся') }}
            </h2>
            <div v-if="loading" class="text-center py-8">{{ $t('loading') }}</div>
            <template v-else-if="isCreateMode || schedule">
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">{{ $t('recurrenceStartDate') || 'Дата начала' }}</label>
                        <input v-model="form.start_date" type="date" class="w-full rounded border border-gray-300 text-sm px-2 py-1.5" />
                    </div>
                    <div>
                        <label class="block text-xs text-gray-600 mb-1">{{ $t('recurrenceFrequency') || 'Частота' }}</label>
                        <select v-model="form.frequency" class="w-full rounded border border-gray-300 text-sm px-2 py-1.5">
                            <option value="daily">{{ $t('recurrenceDaily') || 'Каждый день' }}</option>
                            <option value="weekly">{{ $t('recurrenceWeekly') || 'Каждую неделю' }}</option>
                            <option value="monthly">{{ $t('recurrenceMonthly') || 'Каждый месяц' }}</option>
                            <option value="weekdays">{{ $t('recurrenceWeekdays') || 'По дням недели' }}</option>
                        </select>
                    </div>
                    <div v-if="recNeedsWeekdays">
                        <label class="block text-xs text-gray-600 mb-1">{{ $t('weekdays') || 'Дни недели' }}</label>
                        <div class="flex flex-wrap gap-2">
                            <label v-for="d in weekdayOptions" :key="d.value" class="inline-flex items-center gap-1 text-sm">
                                <input type="checkbox" :value="d.value" v-model="form.weekdays" class="rounded" />
                                {{ d.label }}
                            </label>
                        </div>
                    </div>
                    <div v-if="form.frequency === 'monthly'">
                        <label class="block text-xs text-gray-600 mb-1">{{ $t('dayOfMonth') || 'Число месяца' }}</label>
                        <input v-model.number="form.month_day" type="number" min="1" max="31" class="w-24 rounded border border-gray-300 text-sm px-2 py-1.5" />
                    </div>
                    <div class="flex flex-wrap gap-4 items-end">
                        <label class="flex items-center gap-2">
                            <input type="radio" value="unlimited" v-model="form.endType" class="rounded" />
                            <span class="text-sm">{{ $t('recurrenceEndUnlimited') || 'Без ограничений' }}</span>
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="radio" value="date" v-model="form.endType" class="rounded" />
                            <span class="text-sm">{{ $t('recurrenceEndByDate') || 'По дате' }}</span>
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="radio" value="count" v-model="form.endType" class="rounded" />
                            <span class="text-sm">{{ $t('recurrenceEndByCount') || 'По количеству' }}</span>
                        </label>
                        <input v-if="form.endType === 'date'" v-model="form.end_date" type="date" class="rounded border border-gray-300 text-sm px-2 py-1.5" />
                        <input v-if="form.endType === 'count'" v-model.number="form.end_count" type="number" min="1" class="w-24 rounded border border-gray-300 text-sm px-2 py-1.5" />
                    </div>
                    <div v-if="!isCreateMode" class="pt-2">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input v-model="form.is_active" type="checkbox" class="rounded" />
                            <span>{{ $t('recurringActive') || 'Активно' }}</span>
                        </label>
                    </div>
                </div>
            </template>
            <div v-else class="text-center py-8 text-gray-500">{{ $t('noData') }}</div>
        </div>
        <div
            v-if="showActions"
            :class="[
                'shrink-0 flex flex-wrap gap-2 bg-[#edf4fb]',
                compact ? 'mt-2 px-4 py-3' : 'mt-4 p-4'
            ]"
        >
            <PrimaryButton
                v-if="canDelete && !isCreateMode"
                :onclick="showDeleteDialog"
                :is-danger="true"
                icon="fas fa-trash"
                :aria-label="$t('delete')"
                :disabled="deleteLoading"
                :is-loading="deleteLoading"
            />
            <PrimaryButton
                icon="fas fa-save"
                :onclick="save"
                :disabled="saving"
                :is-loading="saving"
                :aria-label="$t('save')"
            />
        </div>
        <AlertDialog :dialog="deleteDialog" :descr="$t('confirmDelete')" :confirm-text="$t('delete')"
            :leave-text="$t('cancel')" @confirm="performDelete" @leave="deleteDialog = false" />
    </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import RecurringTransactionController from '@/api/RecurringTransactionController';

const WEEKDAY_OPTIONS = [
    { value: 0, labelKey: 'weekdaySun', fallback: 'Вс' },
    { value: 1, labelKey: 'weekdayMon', fallback: 'Пн' },
    { value: 2, labelKey: 'weekdayTue', fallback: 'Вт' },
    { value: 3, labelKey: 'weekdayWed', fallback: 'Ср' },
    { value: 4, labelKey: 'weekdayThu', fallback: 'Чт' },
    { value: 5, labelKey: 'weekdayFri', fallback: 'Пт' },
    { value: 6, labelKey: 'weekdaySat', fallback: 'Сб' }
];

function todayDateString() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export default {
    name: 'RecurringScheduleForm',
    components: { PrimaryButton, AlertDialog },
    props: {
        scheduleId: { type: [Number, String], default: null },
        templateId: { type: [Number, String], default: null },
        templateName: { type: String, default: '' },
        canDelete: { type: Boolean, default: false },
        showHeader: { type: Boolean, default: true },
        showActions: { type: Boolean, default: true },
        compact: { type: Boolean, default: false }
    },
    emits: ['saved', 'deleted', 'close'],
    data() {
        return {
            schedule: null,
            loading: true,
            saving: false,
            deleteLoading: false,
            deleteDialog: false,
            form: {
                start_date: todayDateString(),
                frequency: 'daily',
                weekdays: [],
                month_day: 1,
                endType: 'unlimited',
                end_date: null,
                end_count: null,
                is_active: true
            }
        };
    },
    computed: {
        isCreateMode() {
            return this.templateId != null && this.scheduleId == null;
        },
        recNeedsWeekdays() {
            return this.form.frequency === 'weekly' || this.form.frequency === 'weekdays';
        },
        weekdayOptions() {
            return WEEKDAY_OPTIONS.map(d => ({
                value: d.value,
                label: this.$te(d.labelKey) ? this.$t(d.labelKey) : d.fallback
            }));
        }
    },
    watch: {
        scheduleId: { immediate: true, handler(id) { this.load(id); } },
        templateId: { immediate: true, handler(id) {
            if (id != null && this.scheduleId == null) {
                this.loading = false;
                this.schedule = { template: { name: this.templateName || '' } };
                this.form.start_date = todayDateString();
                this.form.frequency = 'daily';
                this.form.weekdays = [];
                this.form.month_day = 1;
                this.form.endType = 'unlimited';
                this.form.end_date = null;
                this.form.end_count = null;
                this.form.is_active = true;
            }
        } }
    },
    methods: {
        async load(id) {
            this.loading = true;
            this.schedule = null;
            if (!id) {
                if (!this.templateId) this.loading = false;
                return;
            }
            try {
                const res = await RecurringTransactionController.getItem(id);
                this.schedule = res?.item ? res.item : res;
                const r = this.schedule.recurrence_rule || {};
                this.form.start_date = this.schedule.start_date || todayDateString();
                this.form.frequency = r.frequency || 'daily';
                this.form.weekdays = Array.isArray(r.weekdays) ? r.weekdays : [];
                this.form.month_day = r.month_day ?? 1;
                this.form.endType = this.schedule.end_date ? 'date' : (this.schedule.end_count != null ? 'count' : 'unlimited');
                this.form.end_date = this.schedule.end_date || null;
                this.form.end_count = this.schedule.end_count ?? null;
                this.form.is_active = Boolean(this.schedule.is_active);
            } catch (e) {
                this.schedule = null;
            }
            this.loading = false;
        },
        buildRecurrenceRule() {
            const rule = {
                frequency: this.form.frequency,
                interval: 1
            };
            if (this.recNeedsWeekdays && Array.isArray(this.form.weekdays)) {
                rule.weekdays = this.form.weekdays;
            }
            if (this.form.frequency === 'monthly') {
                rule.month_day = Math.min(31, Math.max(1, this.form.month_day || 1));
            }
            return rule;
        },
        async save() {
            const payload = {
                start_date: this.form.start_date,
                recurrence_rule: this.buildRecurrenceRule(),
                end_date: this.form.endType === 'date' ? this.form.end_date : null,
                end_count: this.form.endType === 'count' ? (this.form.end_count || null) : null
            };
            if (this.isCreateMode) {
                if (!this.templateId) return;
                this.saving = true;
                try {
                    await RecurringTransactionController.storeItem({ template_id: Number(this.templateId), ...payload });
                    this.$emit('saved');
                } catch (e) {
                    this.$store.dispatch('showNotification', {
                        title: this.$t('error') || 'Ошибка',
                        subtitle: e?.message || String(e),
                        isDanger: true
                    });
                }
                this.saving = false;
                return;
            }
            if (!this.schedule?.id) return;
            payload.is_active = this.form.is_active;
            this.saving = true;
            try {
                await RecurringTransactionController.updateItem(this.schedule.id, payload);
                this.$emit('saved');
            } catch (e) {
                this.$store.dispatch('showNotification', {
                    title: this.$t('error') || 'Ошибка',
                    subtitle: e?.message || String(e),
                    isDanger: true
                });
            }
            this.saving = false;
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        async performDelete() {
            if (!this.schedule?.id) return;
            this.deleteLoading = true;
            try {
                await RecurringTransactionController.deleteItem(this.schedule.id);
                this.$store.dispatch('showNotification', {
                    title: this.$t('success') || 'Успешно',
                    subtitle: this.$t('recurringDeleted') || 'Расписание удалено',
                    isDanger: false
                });
                this.$emit('deleted');
            } catch (e) {
                this.$store.dispatch('showNotification', {
                    title: this.$t('error') || 'Ошибка',
                    subtitle: e?.message || String(e),
                    isDanger: true
                });
            }
            this.deleteLoading = false;
            this.deleteDialog = false;
        }
    }
};
</script>

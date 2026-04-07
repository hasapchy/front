<template>
  <div class="flex h-full min-h-0 flex-col">
    <div :class="['min-h-0 flex-1 overflow-auto', compact ? '' : 'p-4']">
      <div
        v-if="loading"
        class="text-center py-8"
      >
        {{ $t('loading') }}
      </div>
      <template v-else-if="isCreateMode || schedule">
        <div class="space-y-4">
          <div>
            <label class="block text-xs text-gray-600 mb-1">{{ $t('recurrenceStartDate') }}</label>
            <input
              v-model="form.startDate"
              type="date"
              class="w-full rounded border border-gray-300 text-sm px-2 py-1.5"
            >
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">{{ $t('recurrenceFrequency') }}</label>
            <select
              v-model="form.frequency"
              class="w-full rounded border border-gray-300 text-sm px-2 py-1.5"
            >
              <option value="daily">
                {{ $t('recurrenceDaily') }}
              </option>
              <option value="weekly">
                {{ $t('recurrenceWeekly') }}
              </option>
              <option value="monthly">
                {{ $t('recurrenceMonthly') }}
              </option>
              <option value="weekdays">
                {{ $t('recurrenceWeekdays') }}
              </option>
            </select>
          </div>
          <div v-if="recNeedsWeekdays">
            <label class="block text-xs text-gray-600 mb-1">{{ $t('weekdays') }}</label>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="d in weekdayOptions"
                :key="d.value"
                class="inline-flex items-center gap-1 text-sm"
              >
                <input
                  v-model="form.weekdays"
                  type="checkbox"
                  :value="d.value"
                  class="rounded"
                >
                {{ d.label }}
              </label>
            </div>
          </div>
          <div v-if="form.frequency === 'monthly'">
            <label class="block text-xs text-gray-600 mb-1">{{ $t('dayOfMonth') }}</label>
            <input
              v-model.number="form.monthDay"
              type="number"
              min="1"
              max="31"
              class="w-24 rounded border border-gray-300 text-sm px-2 py-1.5"
            >
          </div>
          <div class="flex flex-wrap gap-4 items-end">
            <label class="flex items-center gap-2">
              <input
                v-model="form.endType"
                type="radio"
                value="unlimited"
                class="rounded"
              >
              <span class="text-sm">{{ $t('recurrenceEndUnlimited') }}</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                v-model="form.endType"
                type="radio"
                value="date"
                class="rounded"
              >
              <span class="text-sm">{{ $t('recurrenceEndByDate') }}</span>
            </label>
            <label class="flex items-center gap-2">
              <input
                v-model="form.endType"
                type="radio"
                value="count"
                class="rounded"
              >
              <span class="text-sm">{{ $t('recurrenceEndByCount') }}</span>
            </label>
            <input
              v-if="form.endType === 'date'"
              v-model="form.endDate"
              type="date"
              class="rounded border border-gray-300 text-sm px-2 py-1.5"
            >
            <input
              v-if="form.endType === 'count'"
              v-model.number="form.endCount"
              type="number"
              min="1"
              class="w-24 rounded border border-gray-300 text-sm px-2 py-1.5"
            >
          </div>
          <div
            v-if="!isCreateMode"
            class="pt-2"
          >
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.isActive"
                type="checkbox"
                class="rounded"
              >
              <span>{{ $t('recurringActive') }}</span>
            </label>
          </div>
        </div>
      </template>
      <div
        v-else
        class="text-center py-8 text-gray-500"
      >
        {{ $t('noData') }}
      </div>
    </div>
    <teleport v-bind="sideModalFooterTeleportBind">
      <div
        v-if="showActions"
        class="flex w-full flex-wrap items-center gap-2"
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
    </teleport>
    <AlertDialog
      :dialog="deleteDialog"
      :descr="$t('confirmDelete')"
      :confirm-text="$t('delete')"
      :leave-text="$t('cancel')"
      @confirm="performDelete"
      @leave="deleteDialog = false"
    />
  </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import RecurringTransactionController from '@/api/RecurringTransactionController';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';

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
    mixins: [sideModalFooterPortal],
    props: {
        scheduleId: { type: [Number, String], default: null },
        templateId: { type: [Number, String], default: null },
        templateName: { type: String, default: '' },
        canDelete: { type: Boolean, default: false },
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
                startDate: todayDateString(),
                frequency: 'daily',
                weekdays: [],
                monthDay: 1,
                endType: 'unlimited',
                endDate: null,
                endCount: null,
                isActive: true
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
                this.schedule = { template: { name: this.templateName  } };
                this.form.startDate = todayDateString();
                this.form.frequency = 'daily';
                this.form.weekdays = [];
                this.form.monthDay = 1;
                this.form.endType = 'unlimited';
                this.form.endDate = null;
                this.form.endCount = null;
                this.form.isActive = true;
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
                this.schedule = res;
                const r = this.schedule.recurrenceRule || {};
                this.form.startDate = this.schedule.startDate || todayDateString();
                this.form.frequency = r.frequency || 'daily';
                this.form.weekdays = Array.isArray(r.weekdays) ? r.weekdays : [];
                this.form.monthDay = r.monthDay ?? 1;
                this.form.endType = this.schedule.endDate ? 'date' : (this.schedule.endCount != null ? 'count' : 'unlimited');
                this.form.endDate = this.schedule.endDate || null;
                this.form.endCount = this.schedule.endCount ?? null;
                this.form.isActive = Boolean(this.schedule.isActive);
            } catch {
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
                rule.monthDay = Math.min(31, Math.max(1, this.form.monthDay || 1));
            }
            return rule;
        },
        async save() {
            const payload = {
                startDate: this.form.startDate,
                recurrenceRule: this.buildRecurrenceRule(),
                endDate: this.form.endType === 'date' ? this.form.endDate : null,
                endCount: this.form.endType === 'count' ? (this.form.endCount || null) : null
            };
            if (this.isCreateMode) {
                if (!this.templateId) return;
                this.saving = true;
                try {
                    await RecurringTransactionController.storeItem({ templateId: Number(this.templateId), ...payload });
                    this.$emit('saved');
                } catch (e) {
                    this.$store.dispatch('showNotification', {
                        title: this.$t('error'),
                        subtitle: e?.message || String(e),
                        isDanger: true
                    });
                }
                this.saving = false;
                return;
            }
            if (!this.schedule?.id) return;
            payload.isActive = this.form.isActive;
            this.saving = true;
            try {
                await RecurringTransactionController.updateItem(this.schedule.id, payload);
                this.$emit('saved');
            } catch (e) {
                this.$store.dispatch('showNotification', {
                    title: this.$t('error'),
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
                    title: this.$t('success'),
                    subtitle: this.$t('recurringDeleted'),
                    isDanger: false
                });
                this.$emit('deleted');
            } catch (e) {
                this.$store.dispatch('showNotification', {
                    title: this.$t('error'),
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

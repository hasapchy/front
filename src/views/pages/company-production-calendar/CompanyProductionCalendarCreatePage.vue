<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
      <div>
        <label class="required">{{ $t('date') }}</label>
        <input
          v-model="periodFrom"
          type="date"
          required
        >
      </div>
      <div
        v-if="editingItem == null"
        class="mt-4"
      >
        <label>{{ $t('dateTo') }}</label>
        <input
          v-model="periodTo"
          type="date"
          :min="periodFrom"
        >
      </div>
      <p
        v-if="editingItem == null"
        class="mt-4 text-xs text-gray-500 dark:text-[var(--text-secondary)]"
      >
        {{ $t('productionCalendarPeriodOptionalTo') }}
      </p>
    </div>
    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton
          v-if="editingItem != null"
          :onclick="showDeleteDialog"
          :is-danger="true"
          :is-loading="deleteLoading"
          icon="fas fa-trash"
          :disabled="!canDelete"
          :aria-label="$t('delete')"
        />
        <PrimaryButton
          icon="fas fa-save"
          :onclick="save"
          :is-loading="saveLoading"
          :aria-label="$t('save')"
          :disabled="!periodFrom || !canSave"
        />
      </div>
    </teleport>
  </div>
  <AlertDialog
    :dialog="deleteDialog"
    :descr="$t('confirmDelete')"
    :confirm-text="$t('delete')"
    :leave-text="$t('cancel')"
    @confirm="deleteItem"
    @leave="closeDeleteDialog"
  />
  <AlertDialog
    :dialog="closeConfirmDialog"
    :descr="$t('unsavedChanges')"
    :confirm-text="$t('closeWithoutSaving')"
    :leave-text="$t('stay')"
    @confirm="confirmClose"
    @leave="cancelClose"
  />
</template>

<script>
import dayjs from 'dayjs';
import ProductionCalendarController from '@/api/ProductionCalendarController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';

export default {
  components: { PrimaryButton, AlertDialog },
  mixins: [getApiErrorMessageMixin, crudFormMixin, sideModalFooterPortal],
  props: {
    editingItem: { type: Object, default: null },
  },
  emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
  data() {
    return {
      periodFrom: this.editingItem?.date ?? '',
      periodTo: '',
    };
  },
  computed: {
    canCreate() {
      return this.$store.getters.hasPermission('production_calendar_create');
    },
    canUpdate() {
      return this.$store.getters.hasPermission('production_calendar_update_all');
    },
    canSave() {
      if (this.editingItem != null) {
        return this.canUpdate;
      }
      return this.canCreate;
    },
    canDelete() {
      return this.$store.getters.hasPermission('production_calendar_delete_all');
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.saveInitialState();
    });
  },
  methods: {
    getFormState() {
      return {
        periodFrom: this.periodFrom,
        periodTo: this.periodTo,
      };
    },
    onEditingItemChanged(newEditingItem) {
      this.periodFrom = newEditingItem?.date ?? '';
      this.periodTo = '';
    },
    buildDateRange() {
      const start = dayjs(this.periodFrom).startOf('day');
      if (!start.isValid()) {
        throw new Error(this.$t('error'));
      }
      if (!this.periodTo) {
        return [start.format('YYYY-MM-DD')];
      }
      const end = dayjs(this.periodTo).startOf('day');
      if (!end.isValid() || end.isBefore(start, 'day')) {
        throw new Error(this.$t('dateToMustBeAfterDateFrom'));
      }
      const dates = [];
      for (let current = start; !current.isAfter(end, 'day'); current = current.add(1, 'day')) {
        dates.push(current.format('YYYY-MM-DD'));
      }
      if (dates.length > 7) {
        throw new Error(this.$t('productionCalendarRangeTooLong'));
      }
      return dates;
    },
    prepareSave() {
      if (this.editingItem != null) {
        return { date: this.periodFrom };
      }
      return {
        dates: this.buildDateRange(),
      };
    },
    async performSave(data) {
      if (this.editingItemId) {
        await ProductionCalendarController.updateById(this.editingItemId, data.date);
        return data;
      }
      await ProductionCalendarController.storeDates(data.dates || []);
      return data;
    },
    async performDelete() {
      if (!this.editingItemId) {
        return { message: 'ok' };
      }
      return ProductionCalendarController.deleteById(this.editingItemId);
    },
    clearForm() {
      this.periodFrom = '';
      this.periodTo = '';
      this.resetFormChanges();
    },
  },
};
</script>

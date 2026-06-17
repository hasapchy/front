<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="app-form-scroll-container">
      <AppFormField
        :label="$t('date')"
        :required="true"
        :error="fieldErrors.entryDate"
      >
        <input
          v-model="entryDate"
          type="date"
          @input="clearFieldError('entryDate')"
        >
      </AppFormField>
      <AppFormField
        :label="$t('description')"
        :error="fieldErrors.description"
      >
        <input
          v-model="description"
          type="text"
          @input="clearFieldError('description')"
        >
      </AppFormField>

      <div
        v-for="(line, index) in lines"
        :key="index"
        class="mb-3 grid grid-cols-1 gap-2 md:grid-cols-4"
      >
        <AppFormField
          :label="$t('financialAccount')"
          :error="fieldErrors[`line_${index}_account`]"
        >
          <input
            v-model="line.account_code"
            type="text"
            :placeholder="$t('accountCode')"
            @input="clearFieldError(`line_${index}_account`)"
          >
        </AppFormField>
        <AppFormField :label="$t('debit')">
          <input
            v-model.number="line.debit"
            type="number"
            min="0"
            step="0.01"
          >
        </AppFormField>
        <AppFormField :label="$t('credit')">
          <input
            v-model.number="line.credit"
            type="number"
            min="0"
            step="0.01"
          >
        </AppFormField>
        <div class="flex items-end">
          <PrimaryButton
            :onclick="() => removeLine(index)"
            :is-danger="true"
            icon="fas fa-trash"
            :aria-label="$t('delete')"
          />
        </div>
      </div>

      <PrimaryButton
        :onclick="addLine"
        icon="fas fa-plus"
        :aria-label="$t('add')"
      />

      <p
        class="mt-4 text-sm"
        :class="isBalanced ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'"
      >
        Σ {{ $t('debit') }}: {{ debitSum }} · Σ {{ $t('credit') }}: {{ creditSum }}
      </p>
    </div>

    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton
          icon="fas fa-save"
          :onclick="save"
          :is-loading="saveLoading"
          :aria-label="$t('save')"
          :disabled="!canSave"
        />
      </div>
    </teleport>

    <AlertDialog
      :dialog="closeConfirmDialog"
      :descr="$t('unsavedChanges')"
      :confirm-text="$t('closeWithoutSaving')"
      :leave-text="$t('stay')"
      @confirm="confirmClose"
      @leave="cancelClose"
    />
  </div>
</template>

<script>
import JournalEntryController from '@/api/JournalEntryController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AppFormField from '@/views/components/app/forms/AppFormField.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import notificationMixin from '@/mixins/notificationMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';

export default {
    components: { PrimaryButton, AppFormField, AlertDialog },
    mixins: [getApiErrorMessage, notificationMixin, crudFormMixin, sideModalFooterPortal],
    emits: ['saved', 'saved-error', 'close-request'],
    data() {
        return {
            entryDate: new Date().toISOString().slice(0, 10),
            description: '',
            lines: [
                { account_code: '1000', debit: 0, credit: 0 },
                { account_code: '4000', debit: 0, credit: 0 },
            ],
            fieldErrors: {},
        };
    },
    computed: {
        debitSum() {
            return this.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0).toFixed(2);
        },
        creditSum() {
            return this.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0).toFixed(2);
        },
        isBalanced() {
            return Math.abs(Number(this.debitSum) - Number(this.creditSum)) < 0.01
                && Number(this.debitSum) > 0;
        },
        canSave() {
            return this.isBalanced && this.$store.getters.hasPermission('journal_entries_create');
        },
        isDirty() {
            return this.description !== ''
                || this.lines.some((line) => line.account_code || line.debit || line.credit);
        },
    },
    methods: {
        addLine() {
            this.lines.push({ account_code: '', debit: 0, credit: 0 });
        },
        removeLine(index) {
            if (this.lines.length <= 2) {
                return;
            }
            this.lines.splice(index, 1);
        },
        clearFieldError(field) {
            if (this.fieldErrors[field]) {
                delete this.fieldErrors[field];
            }
        },
        getValidationFields() {
            const errors = {};
            if (!this.entryDate) {
                errors.entryDate = this.$t('fieldRequired');
            }
            this.lines.forEach((line, index) => {
                if (!line.account_code) {
                    errors[`line_${index}_account`] = this.$t('fieldRequired');
                }
            });
            if (!this.isBalanced) {
                errors.balance = this.$t('journalEntryUnbalanced');
            }
            return errors;
        },
        prepareSave() {
            const errors = this.getValidationFields();
            if (Object.keys(errors).length > 0) {
                this.fieldErrors = errors;
                return null;
            }
            return {
                entry_date: this.entryDate,
                description: this.description,
                lines: this.lines.map((line) => ({
                    account_code: line.account_code,
                    debit: Number(line.debit) || 0,
                    credit: Number(line.credit) || 0,
                })),
            };
        },
        async performSave(data) {
            return JournalEntryController.store(data);
        },
    },
};
</script>

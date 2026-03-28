<template>
  <div class="flex flex-col overflow-auto h-full p-4">
    <h2 class="text-lg font-bold mb-4">
      {{ editingItem ? $t('editHoliday') : $t('createHoliday') }}
    </h2>
    <div>
      <label class="required">{{ $t('name') }}</label>
      <input
        v-model="name"
        type="text"
        :placeholder="$t('holidayName')"
        required
      >
    </div>
    <div class="mt-4">
      <label class="required">{{ $t('date') }}</label>
      <input
        v-model="date"
        type="date"
        required
      >
    </div>
    <div class="mt-4">
      <label>{{ $t('endDate') }}</label>
      <input
        v-model="endDate"
        type="date"
        :min="date"
      >
    </div>
    <div class="mt-4">
      <label class="flex items-center space-x-2 cursor-pointer">
        <input
          v-model="isRecurring"
          type="checkbox"
          class="rounded"
        >
        <span>{{ $t('recurringHoliday') }}</span>
      </label>
    </div>
    <div class="mt-4">
      <label>{{ $t('color') }}</label>
      <div class="flex items-center gap-2">
        <input
          v-model="color"
          type="color"
          class="w-16 h-10 rounded border cursor-pointer"
        >
        <input
          v-model="color"
          type="text"
          class="flex-1"
          placeholder="#FF5733"
          maxlength="7"
        >
      </div>
    </div>
  </div>
  <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
    <PrimaryButton
      v-if="editingItem != null"
      :onclick="showDeleteDialog"
      :is-danger="true"
      :is-loading="deleteLoading"
      icon="fas fa-trash"
      :disabled="!$store.getters.hasPermission('company_holidays_delete')"
      :aria-label="$t('delete')"
    />
    <PrimaryButton
      icon="fas fa-save"
      :onclick="save"
      :is-loading="saveLoading"
      :aria-label="$t('save')"
      :disabled="!name || !date || 
        (editingItemId != null && !$store.getters.hasPermission('company_holidays_update')) ||
        (editingItemId == null && !$store.getters.hasPermission('company_holidays_create'))"
    />
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
import CompanyHolidayDto from '@/dto/companyHoliday/CompanyHolidayDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from "@/mixins/crudFormMixin";

export default {
    components: { PrimaryButton, AlertDialog },
    mixins: [getApiErrorMessage, crudFormMixin],
    props: {
        editingItem: { type: CompanyHolidayDto, required: false, default: null }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            date: this.editingItem ? this.editingItem.date : '',
            endDate: this.editingItem ? this.editingItem.endDate : '',
            isRecurring: this.editingItem ? this.editingItem.isRecurring : true,
            color: this.editingItem ? this.editingItem.color : '#FF5733',
        }
    },
    watch: {
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.name = newEditingItem.name ;
                    this.date = newEditingItem.date ;
                    this.endDate = newEditingItem.endDate ?? '';
                    this.isRecurring = newEditingItem.isRecurring !== undefined ? newEditingItem.isRecurring : true;
                    this.color = newEditingItem.color || '#FF5733';
                    this.editingItemId = newEditingItem.id || null;
                } else {
                    this.name = '';
                    this.date = '';
                    this.endDate = '';
                    this.isRecurring = true;
                    this.color = '#FF5733';
                    this.editingItemId = null;
                }
                this.$nextTick(() => {
                    this.saveInitialState();
                });
            },
            deep: true,
            immediate: true
        }
    },
    mounted() {
        this.$nextTick(() => {
            this.saveInitialState();
        });
    },
    methods: {
        getFormState() {
            return {
                name: this.name,
                date: this.date,
                endDate: this.endDate,
                isRecurring: this.isRecurring,
                color: this.color
            };
        },
        save() {
            if (!this.name || !this.date) {
                this.emitSavedError(this.$t('allRequiredFieldsMustBeFilled'));
                return;
            }

            this.saveLoading = true;
            try {
                const holidayData = {
                    id: this.editingItemId || null,
                    name: this.name,
                    date: this.date,
                    endDate: this.endDate || null,
                    isRecurring: this.isRecurring,
                    color: this.color || '#FF5733',
                };
                this.$emit('saved', holidayData);
                this.onSaveSuccess(holidayData);
            } catch (error) {
                this.emitSavedError(error);
                this.onSaveError(error);
            } finally {
                this.saveLoading = false;
            }
        },
        async performSave() {
            return { message: 'OK' };
        },
        async performDelete() {
            return { message: 'OK' };
        },
        onSaveSuccess(response) {
            // Всегда очищаем форму после успешного сохранения
            if (this.clearForm) {
                this.clearForm();
            }
        },
        clearForm() {
            this.name = '';
            this.date = '';
            this.endDate = '';
            this.isRecurring = true;
            this.color = '#FF5733';
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        showDeleteDialog() { this.deleteDialog = true; },
        closeDeleteDialog() { this.deleteDialog = false; }
    }
}
</script>


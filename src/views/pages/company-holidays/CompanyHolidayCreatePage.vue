<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
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
      <div class="flex items-center justify-between gap-3">
        <span class="text-sm text-gray-900 dark:text-[var(--text-primary)]">{{ $t('recurringHoliday') }}</span>
        <ToggleSwitch
          v-model="isRecurring"
          :aria-label="$t('recurringHoliday')"
        />
      </div>
    </div>
    <IconSelectField
      v-model="icon"
      class="mt-4"
      preset="companyHoliday"
      :allow-empty="false"
      :required="true"
    />
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
    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton
          v-if="editingItem != null"
          :onclick="showDeleteDialog"
          :is-danger="true"
          :is-loading="deleteLoading"
          icon="fas fa-trash"
          :disabled="!$store.getters.hasPermission('holidays_delete')"
          :aria-label="$t('delete')"
        />
        <PrimaryButton
          icon="fas fa-save"
          :onclick="save"
          :is-loading="saveLoading"
          :aria-label="$t('save')"
          :disabled="!name || !date ||
            (editingItemId != null && !$store.getters.hasPermission('holidays_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('holidays_create'))"
        />
      </div>
    </teleport>
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
  </div>
</template>

<script>
import HolidayDto from '@/dto/holiday/HolidayDto';
import HolidayController from '@/api/HolidayController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from "@/mixins/crudFormMixin";
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import ToggleSwitch from '@/views/components/app/forms/ToggleSwitch.vue';
import IconSelectField from '@/views/components/app/forms/IconSelectField.vue';
import { HOLIDAY_DEFAULT_ICON } from '@/constants/holidayIconOptions';

export default {
    components: { PrimaryButton, AlertDialog, ToggleSwitch, IconSelectField },
    mixins: [getApiErrorMessage, crudFormMixin, sideModalFooterPortal],
    props: {
        editingItem: { type: HolidayDto, required: false, default: null },
        companyId: { type: Number, required: false, default: null }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            date: this.editingItem ? this.editingItem.date : '',
            endDate: this.editingItem ? this.editingItem.endDate : '',
            isRecurring: this.editingItem ? this.editingItem.isRecurring : true,
            color: this.editingItem ? this.editingItem.color : '#FF5733',
            icon: this.editingItem ? this.editingItem.icon : HOLIDAY_DEFAULT_ICON,
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
                    this.icon = newEditingItem.icon;
                    this.editingItemId = newEditingItem.id || null;
                } else {
                    this.name = '';
                    this.date = '';
                    this.endDate = '';
                    this.isRecurring = true;
                    this.color = '#FF5733';
                    this.icon = HOLIDAY_DEFAULT_ICON;
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
        resolveCompanyId() {
            return this.companyId ?? this.$store.state.currentCompany?.id ?? null;
        },
        getFormState() {
            return {
                name: this.name,
                date: this.date,
                endDate: this.endDate,
                isRecurring: this.isRecurring,
                color: this.color,
                icon: this.icon,
            };
        },
        prepareSave() {
            return {
                id: this.editingItemId || null,
                companyId: this.resolveCompanyId(),
                name: this.name,
                date: this.date,
                endDate: this.endDate || null,
                isRecurring: this.isRecurring,
                color: this.color || '#FF5733',
                icon: this.icon,
            };
        },
        async performSave(data) {
            if (!data.companyId) {
                throw new Error(this.$t('errorSavingData'));
            }
            if (this.editingItemId) {
                await HolidayController.updateItem(this.editingItemId, data);
                return {
                    ...data,
                    id: this.editingItemId,
                };
            }
            const response = await HolidayController.storeItem(data);
            const item = response?.item ?? response?.data ?? null;
            if (!item) {
                return data;
            }
            return HolidayDto.fromApi(item);
        },
        async save() {
            if (!this.name || !this.date || !this.icon) {
                this.emitSavedError(this.$t('allRequiredFieldsMustBeFilled'));
                return;
            }
            return crudFormMixin.methods.save.call(this);
        },
        async performDelete() {
            await HolidayController.deleteItem(this.editingItemId);
            return { message: 'ok' };
        },
        onSaveSuccess() {
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
            this.icon = HOLIDAY_DEFAULT_ICON;
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
    }
}
</script>


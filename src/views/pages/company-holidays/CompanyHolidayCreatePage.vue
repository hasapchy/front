<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editHoliday') : $t('createHoliday') }}</h2>
        <div>
            <label class="required">{{ $t('name') }}</label>
            <input type="text" v-model="name" :placeholder="$t('holidayName')" required />
        </div>
        <div class="mt-4">
            <label class="required">{{ $t('date') }}</label>
            <input type="date" v-model="date" required />
        </div>
        <div class="mt-4">
            <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" v-model="isRecurring" class="rounded" />
                <span>{{ $t('recurringHoliday') || 'Ежегодный праздник' }}</span>
            </label>
        </div>
        <div class="mt-4">
            <label>{{ $t('color') }}</label>
            <div class="flex items-center gap-2">
                <input type="color" v-model="color" class="w-16 h-10 rounded border cursor-pointer" />
                <input type="text" v-model="color" class="flex-1" placeholder="#FF5733" maxlength="7" />
            </div>
        </div>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-trash"
            :disabled="!$store.getters.hasPermission('company_holidays_delete')">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" 
            :disabled="!name || !date || 
            (editingItemId != null && !$store.getters.hasPermission('company_holidays_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('company_holidays_create'))">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('confirmDelete')" :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
</template>

<script>
import CompanyHolidayDto from '@/dto/companyHoliday/CompanyHolidayDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import crudFormMixin from "@/mixins/crudFormMixin";

export default {
    mixins: [getApiErrorMessage, formChangesMixin, crudFormMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { PrimaryButton, AlertDialog },
    props: {
        editingItem: { type: CompanyHolidayDto, required: false, default: null }
    },
    data() {
        return {
            name: this.editingItem ? this.editingItem.name : '',
            date: this.editingItem ? this.editingItem.date : '',
            isRecurring: this.editingItem ? this.editingItem.isRecurring : true,
            color: this.editingItem ? this.editingItem.color : '#FF5733',
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
                isRecurring: this.isRecurring,
                color: this.color
            };
        },
        save() {
            if (!this.name || !this.date) {
                this.$emit('saved-error', this.$t('allRequiredFieldsMustBeFilled') || 'Все обязательные поля должны быть заполнены');
                return;
            }

            // Устанавливаем loading состояние
            this.saveLoading = true;
            
            try {
                // НЕ вызываем API, только формируем данные для локального сохранения
                const holidayData = {
                    id: this.editingItemId || null, // Сохраняем id если редактируем
                    name: this.name,
                    date: this.date,
                    isRecurring: this.isRecurring,
                    color: this.color || '#FF5733',
                };
                
                // Эмитим событие с данными
                this.$emit('saved', holidayData);
                this.onSaveSuccess(holidayData);
            } catch (error) {
                this.$emit('saved-error', this.getApiErrorMessage(error));
                this.onSaveError(error);
            } finally {
                this.saveLoading = false;
            }
        },
        async performSave(data) {
            // Не используется, так как сохранение происходит локально
            return { message: 'OK' };
        },
        async performDelete() {
            // Не используется, так как удаление происходит локально
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
            this.isRecurring = true;
            this.color = '#FF5733';
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        showDeleteDialog() { this.deleteDialog = true; },
        closeDeleteDialog() { this.deleteDialog = false; }
    },
    watch: {
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.name = newEditingItem.name || '';
                    this.date = newEditingItem.date || '';
                    this.isRecurring = newEditingItem.isRecurring !== undefined ? newEditingItem.isRecurring : true;
                    this.color = newEditingItem.color || '#FF5733';
                    this.editingItemId = newEditingItem.id || null;
                } else {
                    this.name = '';
                    this.date = '';
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
    }
}
</script>


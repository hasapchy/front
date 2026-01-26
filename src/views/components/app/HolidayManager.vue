<template>
    <div class="holiday-manager">
        <div class="flex justify-end items-center mb-4">
            <PrimaryButton 
                :onclick="addHoliday" 
                icon="fas fa-plus"
                :disabled="!$store.getters.hasPermission('company_holidays_create')"
            >
                {{ $t('add_holiday') }}
            </PrimaryButton>
        </div>

        <!-- Desktop/Tablet Table View -->
        <div v-if="holidays.length > 0" class="overflow-x-auto w-full mb-4">
            <table class="min-w-full bg-white shadow-md rounded" style="font-size: 12px;">
                <thead class="bg-gray-100 rounded-t-sm">
                    <tr>
                        <th class="text-left border border-gray-300 py-2 px-2 sm:px-3 md:px-4 font-medium">
                            {{ $t('name') }}
                        </th>
                        <th class="text-left border border-gray-300 py-2 px-2 sm:px-3 md:px-4 font-medium whitespace-nowrap">
                            {{ $t('date') }}
                        </th>
                        <th class="text-left border border-gray-300 py-2 px-2 sm:px-3 md:px-4 font-medium whitespace-nowrap">
                            {{ $t('color') }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(holiday, index) in holidays" :key="holiday.id || index" 
                        class="hover:bg-gray-100 transition-all border-b border-gray-300"
                        :class="{ 'cursor-pointer': $store.getters.hasPermission('company_holidays_update_all') }"
                        @dblclick="$store.getters.hasPermission('company_holidays_update_all') ? editHoliday(index) : null">
                        <td class="py-2 px-2 sm:px-3 md:px-4 border-x border-gray-300">
                            {{ holiday.name }}
                        </td>
                        <td class="py-2 px-2 sm:px-3 md:px-4 border-x border-gray-300 whitespace-nowrap">
                            {{ formatDate(holiday.date) }}
                        </td>
                        <td class="py-2 px-2 sm:px-3 md:px-4 border-x border-gray-300">
                            <div class="flex items-center gap-2">
                                <div 
                                    class="w-6 h-6 rounded border border-gray-300" 
                                    :style="{ backgroundColor: holiday.color }"
                                ></div>
                                <span class="text-gray-600">{{ holiday.color }}</span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Empty State -->
        <div v-if="holidays.length === 0" class="p-6 text-center text-gray-500 bg-gray-50 rounded border border-gray-200 mb-4">
            <i class="fas fa-calendar-alt text-3xl text-gray-300 mb-2"></i>
            <p>{{ $t('no_holidays_added') }}</p>
        </div>

        <!-- Модалка для добавления/редактирования праздника -->
        <SideModalDialog :showForm="modalDialog" :onclose="closeModal" :level="1">
            <CompanyHolidayCreatePage 
                :key="editingHoliday ? editingHoliday.id : 'new-holiday'" 
                ref="holidayForm"
                @saved="handleHolidaySaved" 
                @saved-error="handleHolidaySavedError"
                @deleted="handleHolidayDeleted"
                @deleted-error="handleHolidayDeletedError"
                @close-request="closeModal"
                :editingItem="editingHoliday"
            />
        </SideModalDialog>
    </div>
</template>

<script>
import dayjs from 'dayjs';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import CompanyHolidayCreatePage from '@/views/pages/company-holidays/CompanyHolidayCreatePage.vue';

export default {
    name: 'HolidayManager',
    components: {
        PrimaryButton,
        SideModalDialog,
        CompanyHolidayCreatePage
    },
    props: {
        modelValue: {
            type: Array,
            default: () => []
        },
        companyId: {
            type: Number,
            default: null
        }
    },
    emits: ['update:modelValue'],
    data() {
        return {
            holidays: [],
            modalDialog: false,
            editingHoliday: null,
            editingHolidayIndex: null
        };
    },
    watch: {
        modelValue: {
            immediate: true,
            handler(val) {
                this.holidays = val ? [...val] : [];
            }
        }
    },
    methods: {
        addHoliday() {
            this.editingHoliday = null;
            this.editingHolidayIndex = null;
            this.modalDialog = true;
        },
        editHoliday(index) {
            const holiday = this.holidays[index];
            this.editingHolidayIndex = index;
            this.editingHoliday = {
                id: holiday.id,
                name: holiday.name,
                date: holiday.date,
                isRecurring: holiday.isRecurring ?? true,
                color: holiday.color || '#FF5733',
            };
            this.modalDialog = true;
        },
        closeModal() {
            this.modalDialog = false;
            this.editingHoliday = null;
            this.editingHolidayIndex = null;
        },
        handleHolidaySaved(savedHoliday) {
            if (!savedHoliday) {
                this.closeModal();
                return;
            }

            // Форматируем данные для локального массива
            // Если дата уже в формате YYYY-MM-DD, не нужно форматировать
            let formattedDate = savedHoliday.date;
            if (savedHoliday.date && !/^\d{4}-\d{2}-\d{2}$/.test(savedHoliday.date)) {
                formattedDate = this.formatDateForInput(savedHoliday.date);
            }

            const formattedHoliday = {
                id: savedHoliday.id || null, // null для новых праздников
                name: savedHoliday.name || '',
                date: formattedDate,
                isRecurring: savedHoliday.isRecurring !== undefined ? savedHoliday.isRecurring : 
                            (savedHoliday.is_recurring !== undefined ? savedHoliday.is_recurring : true),
                color: savedHoliday.color || '#FF5733',
            };

            let updatedHolidays;
            if (this.editingHoliday?.id) {
                // Редактирование существующего с id - обновляем по id
                updatedHolidays = this.holidays.map(h => 
                    h.id === formattedHoliday.id ? formattedHoliday : h
                );
            } else if (this.editingHolidayIndex !== null) {
                // Редактирование несохранённого (без id) - обновляем по индексу
                updatedHolidays = [...this.holidays];
                updatedHolidays[this.editingHolidayIndex] = formattedHoliday;
            } else {
                // Добавление нового - добавляем в массив (без id, будет создан при сохранении компании)
                updatedHolidays = [...this.holidays, formattedHoliday];
            }
            
            this.$emit('update:modelValue', updatedHolidays);
            this.closeModal();
        },
        handleHolidaySavedError(error) {
            console.error('Ошибка сохранения праздника:', error);
        },
        handleHolidayDeleted() {
            // Удаляем из локального массива, НЕ вызываем API
            if (this.editingHoliday?.id) {
                // Удаляем по id
                const updatedHolidays = this.holidays.filter(h => h.id !== this.editingHoliday.id);
                this.$emit('update:modelValue', updatedHolidays);
            } else if (this.editingHolidayIndex !== null) {
                // Удаляем по индексу (для несохранённых)
                const updatedHolidays = this.holidays.filter((_, index) => index !== this.editingHolidayIndex);
                this.$emit('update:modelValue', updatedHolidays);
            }
            this.closeModal();
        },
        handleHolidayDeletedError(error) {
            console.error('Ошибка удаления праздника:', error);
        },
        formatDate(date) {
            return dayjs(date).format('DD.MM.YYYY');
        },
        formatDateForInput(date) {
            if (!date) return '';
            if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                return date;
            }
            try {
                const d = new Date(date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            } catch (e) {
                return date;
            }
        }
    }
};
</script>


<template>
    <div class="holiday-manager">
        <div class="flex justify-end items-center mb-4">
            <PrimaryButton 
                :onclick="addHoliday" 
                icon="fas fa-plus"
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
                        <th class="text-left border border-gray-300 py-2 px-2 sm:px-3 md:px-4 font-medium whitespace-nowrap">
                            {{ $t('actions') }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(holiday, index) in holidays" :key="index" 
                        class="hover:bg-gray-100 transition-all border-b border-gray-300">
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
                        <td class="py-2 px-2 sm:px-3 md:px-4 border-x border-gray-300">
                            <div class="flex items-center gap-2">
                                <button 
                                    @click="editHoliday(index)" 
                                    class="text-[#337AB7] hover:text-[#3571A4] transition-colors"
                                    type="button"
                                    :title="$t('edit')"
                                >
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button 
                                    @click="deleteHoliday(index)" 
                                    class="text-[#EE4F47] hover:text-[#D53935] transition-colors"
                                    type="button"
                                    :title="$t('delete')"
                                >
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Mobile Card View (visible on small screens) -->
        <div v-if="false && holidays.length > 0" class="md:hidden space-y-3 mb-4">
            <div v-for="(holiday, index) in holidays" :key="index" 
                class="bg-white shadow-md rounded-lg p-4 transition-shadow">
                <div class="space-y-3">
                    <div class="flex flex-col border-b border-gray-100 pb-2">
                        <div class="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                            {{ $t('name') }}
                        </div>
                        <div class="text-sm text-gray-900">
                            {{ holiday.name }}
                        </div>
                    </div>
                    <div class="flex flex-col border-b border-gray-100 pb-2">
                        <div class="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                            {{ $t('date') }}
                        </div>
                        <div class="text-sm text-gray-900">
                            {{ formatDate(holiday.date) }}
                        </div>
                    </div>
                    <div class="flex flex-col border-b border-gray-100 pb-2">
                        <div class="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                            {{ $t('color') }}
                        </div>
                        <div class="flex items-center gap-2">
                            <div 
                                class="w-6 h-6 rounded border border-gray-300" 
                                :style="{ backgroundColor: holiday.color }"
                            ></div>
                            <span class="text-sm text-gray-600">{{ holiday.color }}</span>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <div class="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                            {{ $t('actions') }}
                        </div>
                        <div class="flex items-center gap-3">
                            <button 
                                @click="editHoliday(index)" 
                                class="flex items-center gap-2 text-[#337AB7] hover:text-[#3571A4] transition-colors"
                                type="button"
                            >
                                <i class="fas fa-edit"></i>
                                <span class="text-sm">{{ $t('edit') }}</span>
                            </button>
                            <button 
                                @click="deleteHoliday(index)" 
                                class="flex items-center gap-2 text-[#EE4F47] hover:text-[#D53935] transition-colors"
                                type="button"
                            >
                                <i class="fas fa-trash"></i>
                                <span class="text-sm">{{ $t('delete') }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-if="holidays.length === 0" class="p-6 text-center text-gray-500 bg-gray-50 rounded border border-gray-200 mb-4">
            <i class="fas fa-calendar-alt text-3xl text-gray-300 mb-2"></i>
            <p>{{ $t('no_holidays_added') }}</p>
        </div>

        <!-- Форма добавления/редактирования праздника -->
        <div v-if="showForm" class="mt-6 pt-6 border-t-2 border-gray-200">
            <h4 class="text-md font-semibold mb-4">
                {{ editingIndex !== null ? $t('edit_holiday') : $t('add_holiday') }}
            </h4>
            
            <div class="space-y-4">
                <!-- Название -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        {{ $t('name') }} <span class="text-red-500">*</span>
                    </label>
                    <input
                        v-model="form.name"
                        type="text"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        :placeholder="$t('holiday_name')"
                        required
                    />
                </div>

                <!-- Дата -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        {{ $t('date') }} <span class="text-red-500">*</span>
                    </label>
                    <input
                        v-model="form.date"
                        type="date"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <!-- Ежегодный праздник -->
                <div>
                    <label class="flex items-center space-x-2 cursor-pointer">
                        <input
                            v-model="form.isRecurring"
                            type="checkbox"
                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span class="text-sm text-gray-700">{{ $t('recurring_holiday') }}</span>
                    </label>
                </div>

                <!-- Цвет -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        {{ $t('color') }}
                    </label>
                    <div class="flex items-center gap-2">
                        <input
                            v-model="form.color"
                            type="color"
                            class="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                            v-model="form.color"
                            type="text"
                            class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="#FF5733"
                            maxlength="7"
                            pattern="^#[0-9A-Fa-f]{6}$"
                        />
                    </div>
                </div>

                <!-- Кнопки -->
                <div class="flex justify-end gap-2 pt-2">
                    <PrimaryButton
                        :onclick="cancelForm"
                        :is-light="true"
                    >
                        {{ $t('cancel') }}
                    </PrimaryButton>
                    <PrimaryButton
                        :onclick="saveHoliday"
                        icon="fas fa-save"
                    >
                        {{ editingIndex !== null ? $t('save') : $t('add') }}
                    </PrimaryButton>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import dayjs from 'dayjs';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';

export default {
    name: 'HolidayManager',
    components: {
        PrimaryButton
    },
    props: {
        modelValue: {
            type: Array,
            default: () => []
        }
    },
    emits: ['update:modelValue'],
    data() {
        return {
            holidays: [],
            showForm: false,
            editingIndex: null,
            form: {
                name: '',
                date: dayjs().format('YYYY-MM-DD'),
                isRecurring: true,
                color: '#FF5733',
            }
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
            this.form = {
                name: '',
                date: dayjs().format('YYYY-MM-DD'),
                isRecurring: true,
                color: '#FF5733',
            };
            this.editingIndex = null;
            this.showForm = true;
        },
        editHoliday(index) {
            const holiday = this.holidays[index];
            this.form = {
                name: holiday.name,
                date: holiday.date,
                isRecurring: holiday.isRecurring !== undefined ? holiday.isRecurring : true,
                color: holiday.color,
            };
            this.editingIndex = index;
            this.showForm = true;
        },
        saveHoliday() {
            if (!this.form.name.trim() || !this.form.date) {
                alert(this.$t('please_fill_required_fields'));
                return;
            }

            const holidayData = {
                name: this.form.name.trim(),
                date: this.form.date,
                isRecurring: this.form.isRecurring,
                color: this.form.color,
            };

            let updatedHolidays;
            if (this.editingIndex !== null) {
                // Редактирование существующего праздника
                updatedHolidays = [...this.holidays];
                updatedHolidays[this.editingIndex] = holidayData;
            } else {
                // Добавление нового праздника
                updatedHolidays = [...this.holidays, holidayData];
            }

            this.$emit('update:modelValue', updatedHolidays);
            this.cancelForm();
        },
        deleteHoliday(index) {
            if (confirm(this.$t('confirm_delete'))) {
                const updatedHolidays = this.holidays.filter((_, i) => i !== index);
                this.$emit('update:modelValue', updatedHolidays);
            }
        },
        cancelForm() {
            this.showForm = false;
            this.editingIndex = null;
            this.form = {
                name: '',
                date: dayjs().format('YYYY-MM-DD'),
                isRecurring: true,
                color: '#FF5733',
            };
        },
        formatDate(date) {
            return dayjs(date).format('DD.MM.YYYY');
        }
    }
};
</script>

<style scoped>
.holiday-manager {
    /* Используем стандартные Tailwind классы */
}
</style>


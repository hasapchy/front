<template>
    <div class="date-picker-container bg-white border border-gray-300 rounded shadow-lg p-4" style="min-width: 600px;">
        <div class="flex gap-4">
            <!-- Календарь слева -->
            <div class="flex-1">
                <!-- Навигация по месяцам -->
                <div class="flex items-center justify-between mb-4">
                    <button 
                        @click="previousMonth" 
                        class="text-gray-600 hover:text-gray-800 px-2 py-1"
                        type="button">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <h3 class="text-lg font-semibold text-gray-800">
                        {{ currentMonthName }} {{ currentYear }}
                    </h3>
                    <button 
                        @click="nextMonth" 
                        class="text-gray-600 hover:text-gray-800 px-2 py-1"
                        type="button">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>

                <!-- Дни недели -->
                <div class="grid grid-cols-7 gap-1 mb-2">
                    <div 
                        v-for="day in weekDays" 
                        :key="day" 
                        class="text-center text-sm font-medium text-gray-600 py-1">
                        {{ day }}
                    </div>
                </div>

                <!-- Календарная сетка -->
                <div class="grid grid-cols-7 gap-1">
                    <button
                        v-for="(date, index) in calendarDays"
                        :key="index"
                        @click="selectDate(date)"
                        :class="[
                            'date-cell py-2 px-1 text-sm rounded transition-colors',
                            {
                                'text-gray-400': date.isOtherMonth,
                                'text-gray-800': !date.isOtherMonth && !date.isToday && !date.isWeekend && !date.isSelected,
                                'text-red-600 font-semibold': !date.isOtherMonth && date.isWeekend && !date.isSelected,
                                'bg-blue-200 text-blue-800 font-semibold': date.isToday,
                                'bg-blue-100 text-blue-800': date.isSelected && !date.isToday,
                                'bg-blue-100 text-red-600': date.isSelected && !date.isToday && date.isWeekend,
                                'hover:bg-gray-100': !date.isSelected && !date.isToday
                            }
                        ]"
                        type="button">
                        {{ date.day }}
                    </button>
                </div>

                <!-- Выбор времени -->
                <div class="mt-4 pt-4 border-t border-gray-200">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        {{ $t('time') || 'Время' }}
                    </label>
                    <div class="flex gap-2">
                        <input
                            type="time"
                            v-model="selectedTime"
                            class="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            @change="updateDateTime" />
                    </div>
                </div>
            </div>

            <!-- Панель быстрого выбора справа -->
            <div class="w-64 border-l border-gray-200 pl-4">
                <h4 class="text-sm font-semibold text-gray-700 mb-3">
                    {{ $t('quickSelect') || 'Быстрый выбор' }}
                </h4>
                <div class="space-y-2">
                    <button
                        v-for="option in quickSelectOptions"
                        :key="option.key"
                        @click="selectQuickDate(option.key)"
                        :class="[
                            'w-full text-left px-3 py-2 rounded border transition-colors',
                            option.isSelected 
                                ? 'bg-blue-100 border-blue-300 text-blue-800' 
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        ]"
                        type="button">
                        <div class="font-medium text-sm">{{ option.label }}</div>
                        <div class="text-xs text-gray-500 mt-1">{{ option.dateText }}</div>
                    </button>
                </div>
            </div>
        </div>
        <div class="mt-2">
            <button
                @click="clearDate"
                type="button"
                class="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
                {{ $t('clear') || 'Очистить' }}
            </button>
        </div>
    </div>
</template>

<script>
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';

dayjs.extend(customParseFormat);
dayjs.extend(weekday);
dayjs.extend(localeData);

export default {
    name: 'DatePicker',
    props: {
        modelValue: {
            type: String,
            default: null
        },
        minDate: {
            type: String,
            default: null
        }
    },
    emits: ['update:modelValue'],
    data() {
        const today = dayjs();
        const initialDate = this.modelValue ? dayjs(this.modelValue) : today;
        
        return {
            currentMonth: initialDate.month(),
            currentYear: initialDate.year(),
            selectedDate: initialDate,
            selectedTime: initialDate.format('HH:mm')
        };
    },
    computed: {
        currentMonthName() {
            const months = [
                'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
            ];
            return months[this.currentMonth];
        },
        weekDays() {
            return ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        },
        calendarDays() {
            const firstDayOfMonth = dayjs().year(this.currentYear).month(this.currentMonth).date(1);
            // Вычисляем понедельник недели, в которую попадает первое число месяца
            // dayjs: 0 = воскресенье, 1 = понедельник, ..., 6 = суббота
            const firstDayWeekday = firstDayOfMonth.day();
            let daysToSubtract = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1; // Если воскресенье, вычитаем 6 дней, иначе (день недели - 1)
            const startOfCalendar = firstDayOfMonth.subtract(daysToSubtract, 'day');
            
            const days = [];
            const today = dayjs();
            const selectedDateStr = this.selectedDate.format('YYYY-MM-DD');

            for (let i = 0; i < 42; i++) {
                const date = startOfCalendar.add(i, 'day');
                const dateStr = date.format('YYYY-MM-DD');
                const isOtherMonth = date.month() !== this.currentMonth;
                const isToday = dateStr === today.format('YYYY-MM-DD');
                const isWeekend = date.day() === 0 || date.day() === 6; // Воскресенье или Суббота
                const isSelected = dateStr === selectedDateStr;

                days.push({
                    day: date.date(),
                    date: date,
                    dateStr: dateStr,
                    isOtherMonth,
                    isToday,
                    isWeekend,
                    isSelected
                });
            }

            return days;
        },
        quickSelectOptions() {
            const today = dayjs();
            const tomorrow = today.add(1, 'day');
            // Конец недели - пятница текущей или следующей недели
            // dayjs: 0 = воскресенье, 1 = понедельник, ..., 5 = пятница, 6 = суббота
            let endOfWeek;
            const currentDay = today.day();
            if (currentDay === 0) {
                // Воскресенье - берем пятницу следующей недели
                endOfWeek = today.add(5, 'day');
            } else if (currentDay >= 1 && currentDay <= 5) {
                // Понедельник-пятница - берем пятницу этой недели
                endOfWeek = today.day(5);
            } else {
                // Суббота - берем пятницу следующей недели
                endOfWeek = today.add(6, 'day');
            }
            const nextWeek = today.add(7, 'day');
            const endOfMonth = today.endOf('month');

            const options = [
                {
                    key: 'today',
                    label: this.$t('today') || 'Сегодня',
                    date: today,
                    dateText: this.formatDateText(today)
                },
                {
                    key: 'tomorrow',
                    label: this.$t('tomorrow') || 'Завтра',
                    date: tomorrow,
                    dateText: this.formatDateText(tomorrow)
                },
                {
                    key: 'endOfWeek',
                    label: this.$t('endOfWeek') || 'В конце недели',
                    date: endOfWeek,
                    dateText: this.formatDateText(endOfWeek)
                },
                {
                    key: 'nextWeek',
                    label: this.$t('nextWeek') || 'Через неделю',
                    date: nextWeek,
                    dateText: this.formatDateText(nextWeek)
                },
                {
                    key: 'endOfMonth',
                    label: this.$t('endOfMonth') || 'В конце месяца',
                    date: endOfMonth,
                    dateText: this.formatDateText(endOfMonth)
                }
            ];

            const selectedDateStr = this.selectedDate.format('YYYY-MM-DD');
            return options.map(opt => ({
                ...opt,
                isSelected: opt.date.format('YYYY-MM-DD') === selectedDateStr
            }));
        }
    },
    watch: {
        modelValue(newValue) {
            if (newValue) {
                const date = dayjs(newValue);
                this.selectedDate = date;
                this.selectedTime = date.format('HH:mm');
                this.currentMonth = date.month();
                this.currentYear = date.year();
            } else {
                // Если null, используем текущую дату для отображения, но не устанавливаем значение
                const today = dayjs();
                this.currentMonth = today.month();
                this.currentYear = today.year();
                this.selectedDate = today;
                this.selectedTime = today.format('HH:mm');
            }
        }
    },
    methods: {
        formatDateText(date) {
            const weekDays = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
            const months = [
                'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
            ];
            
            const dayName = weekDays[date.day()];
            const day = date.date();
            const month = months[date.month()];
            
            return `${dayName}, ${day} ${month}`;
        },
        selectDate(dateObj) {
            if (dateObj.isOtherMonth) {
                // Переключаемся на месяц выбранной даты
                this.currentMonth = dateObj.date.month();
                this.currentYear = dateObj.date.year();
            }
            
            this.selectedDate = dateObj.date;
            this.updateDateTime();
        },

        clearDate() {
            this.$emit('update:modelValue', null);
        },
        selectQuickDate(key) {
            const option = this.quickSelectOptions.find(opt => opt.key === key);
            if (option) {
                this.selectedDate = option.date;
                this.currentMonth = option.date.month();
                this.currentYear = option.date.year();
                this.updateDateTime();
            }
        },
        updateDateTime() {
            const [hours, minutes] = this.selectedTime.split(':');
            const dateTime = this.selectedDate
                .hour(parseInt(hours) || 0)
                .minute(parseInt(minutes) || 0)
                .second(0);

            // Проверка минимальной даты
            if (this.minDate && dateTime.isBefore(dayjs(this.minDate))) {
                const minDateTime = dayjs(this.minDate);
                this.selectedDate = minDateTime;
                this.selectedTime = minDateTime.format('HH:mm');
                this.$emit('update:modelValue', minDateTime.format('YYYY-MM-DDTHH:mm'));
                return;
            }

            this.$emit('update:modelValue', dateTime.format('YYYY-MM-DDTHH:mm'));
        },
        previousMonth() {
            const newDate = dayjs().year(this.currentYear).month(this.currentMonth).subtract(1, 'month');
            this.currentMonth = newDate.month();
            this.currentYear = newDate.year();
        },
        nextMonth() {
            const newDate = dayjs().year(this.currentYear).month(this.currentMonth).add(1, 'month');
            this.currentMonth = newDate.month();
            this.currentYear = newDate.year();
        }
    }
};
</script>

<style scoped>
.date-picker-container {
    z-index: 1000;
}

.date-cell {
    min-height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.date-cell:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}
</style>

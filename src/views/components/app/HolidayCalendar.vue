<template>
    <div class="holiday-calendar">
        <!-- Навигация -->
        <div class="calendar-header">
            <button @click="previousMonth" class="btn-nav">
                <i class="fas fa-chevron-left"></i>
            </button>
            <h3 class="month-title">{{ currentMonthYear }}</h3>
            <button @click="nextMonth" class="btn-nav">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>

        <!-- Календарь -->
        <div v-if="!loading" class="calendar-grid">
            <!-- Заголовки дней недели -->
            <div v-for="day in weekDays" :key="day" class="weekday-header">
                {{ day }}
            </div>
            
            <!-- Дни -->
            <div
                v-for="date in calendarDates"
                :key="date.key"
                class="calendar-day"
                :class="{
                    'is-holiday': date.isHoliday,
                    'is-other-month': !date.isCurrentMonth,
                    'is-today': date.isToday
                }"
            >
                <div class="day-number">{{ date.day }}</div>
                <div v-if="date.holiday" class="holiday-badge" :style="{ backgroundColor: date.holiday.color }">
                    <i class="fas fa-star text-xs"></i>
                    <span class="holiday-name">{{ date.holiday.name }}</span>
                </div>
            </div>
        </div>

        <!-- Загрузка -->
        <div v-else class="p-8 text-center">
            <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
        </div>

        <!-- Список праздников текущего месяца -->
        <div class="holidays-list mt-4">
            <h4 class="text-lg font-bold mb-2">{{ $t('holidays_of_month') }}</h4>
            <div v-if="currentMonthHolidays.length === 0" class="text-gray-500 text-sm">
                {{ $t('no_holidays') }}
            </div>
            <div v-else class="space-y-2">
                <div
                    v-for="holiday in currentMonthHolidays"
                    :key="holiday.id"
                    class="holiday-item"
                >
                    <div class="holiday-color" :style="{ backgroundColor: holiday.color }"></div>
                    <div class="flex-1">
                        <div class="font-medium">{{ holiday.name }}</div>
                        <div class="text-sm text-gray-600">{{ formatDate(holiday.date) }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import CompanyHolidayController from '@/api/CompanyHolidayController';
import CompanyHolidayDto from '@/dto/companyHoliday/CompanyHolidayDto';

dayjs.locale('ru');

export default {
    name: 'HolidayCalendar',
    data() {
        return {
            currentDate: dayjs(),
            holidays: [],
            loading: false,
        };
    },
    computed: {
        currentMonthYear() {
            return this.currentDate.format('MMMM YYYY');
        },
        weekDays() {
            return ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        },
        calendarDates() {
            const dates = [];
            const startOfMonth = this.currentDate.startOf('month');
            const endOfMonth = this.currentDate.endOf('month');
            
            // Получаем день недели (понедельник = 1, воскресенье = 7)
            const startDay = startOfMonth.day() === 0 ? 7 : startOfMonth.day();
            
            // Дни предыдущего месяца
            for (let i = startDay - 1; i > 0; i--) {
                const date = startOfMonth.subtract(i, 'day');
                dates.push(this.createDateObject(date, false));
            }
            
            // Дни текущего месяца
            let currentDay = startOfMonth;
            while (currentDay.isBefore(endOfMonth) || currentDay.isSame(endOfMonth, 'day')) {
                dates.push(this.createDateObject(currentDay, true));
                currentDay = currentDay.add(1, 'day');
            }
            
            // Дни следующего месяца
            const remainingDays = 42 - dates.length; // 6 недель
            for (let i = 1; i <= remainingDays; i++) {
                const date = endOfMonth.add(i, 'day');
                dates.push(this.createDateObject(date, false));
            }
            
            return dates;
        },
        currentMonthHolidays() {
            return this.holidays.filter(holiday => {
                const holidayDate = dayjs(holiday.date);
                return holidayDate.month() === this.currentDate.month() &&
                       holidayDate.year() === this.currentDate.year();
            }).sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
        }
    },
    mounted() {
        this.loadHolidays();
    },
    methods: {
        async loadHolidays() {
            this.loading = true;
            try {
                const data = await CompanyHolidayController.getAll({
                    year: this.currentDate.year()
                });
                this.holidays = CompanyHolidayDto.fromArray(data);
            } catch (error) {
                console.error('Ошибка загрузки праздников:', error);
            } finally {
                this.loading = false;
            }
        },
        createDateObject(date, isCurrentMonth) {
            const holiday = this.findHolidayForDate(date);
            const today = dayjs();
            
            return {
                key: date.format('YYYY-MM-DD'),
                day: date.date(),
                date: date,
                isCurrentMonth,
                isToday: date.isSame(today, 'day'),
                isHoliday: !!holiday,
                holiday,
            };
        },
        findHolidayForDate(date) {
            return this.holidays.find(holiday => {
                const holidayDate = dayjs(holiday.date);
                return holidayDate.isSame(date, 'day');
            });
        },
        previousMonth() {
            this.currentDate = this.currentDate.subtract(1, 'month');
            this.loadHolidays();
        },
        nextMonth() {
            this.currentDate = this.currentDate.add(1, 'month');
            this.loadHolidays();
        },
        formatDate(date) {
            return dayjs(date).format('DD MMMM YYYY');
        }
    }
};
</script>

<style scoped>
.holiday-calendar {
    padding: 1rem;
}

.calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.btn-nav {
    padding: 0.5rem;
    background: #f3f4f6;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background-color 0.2s;
}

.btn-nav:hover {
    background: #e5e7eb;
}

.month-title {
    font-size: 1.25rem;
    font-weight: bold;
    text-transform: capitalize;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.25rem;
}

.weekday-header {
    text-align: center;
    font-weight: 600;
    padding: 0.5rem;
    background: #f9fafb;
    border-radius: 0.25rem;
}

.calendar-day {
    min-height: 70px;
    padding: 0.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    position: relative;
    background: white;
    transition: all 0.2s;
}

.calendar-day.is-holiday {
    background: #fef2f2;
    border-color: #fecaca;
}

.calendar-day.is-other-month {
    opacity: 0.4;
}

.calendar-day.is-today {
    border: 2px solid #3b82f6;
    background: #eff6ff;
}

.day-number {
    font-weight: 600;
    font-size: 0.875rem;
}

.holiday-badge {
    margin-top: 0.25rem;
    padding: 0.25rem;
    border-radius: 0.25rem;
    color: white;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.holiday-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.holidays-list {
    margin-top: 1.5rem;
}

.holiday-item {
    position: relative;
    padding: 0.75rem;
    padding-left: 2.5rem;
    background: #f9fafb;
    border-radius: 0.5rem;
}

.holiday-color {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
}
</style>

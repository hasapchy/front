<template>
    <div class="leave-calendar-container" ref="calendarContainer">
        <!-- Навигация по месяцам -->
        <div class="calendar-header mb-4 flex items-center justify-between">
            <button @click="previousMonth" class="p-2 hover:bg-gray-100 rounded transition-colors">
                <i class="fas fa-chevron-left"></i>
            </button>
            <h2 class="text-xl font-semibold">{{ currentMonthYear }}</h2>
            <button @click="nextMonth" class="p-2 hover:bg-gray-100 rounded transition-colors">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>

        <!-- Календарь со списком сотрудников -->
        <div class="calendar-timeline-wrapper">
            <div class="calendar-timeline-container">
                <!-- Заголовок с днями -->
                <div class="timeline-header">
                    <div class="user-header-cell"></div>
                    <div class="days-header">
                        <div 
                            v-for="(day, index) in calendarDays" 
                            :key="index"
                            class="day-header"
                            :class="{
                                'other-month': !day.isCurrentMonth,
                                'today': day.isToday,
                                'weekend': day.isWeekend
                            }"
                        >
                            <div class="day-weekday">{{ day.weekday }}</div>
                            <div class="day-number">{{ day.day }}</div>
                        </div>
                    </div>
                </div>

                <!-- Строки сотрудников -->
                <div class="timeline-rows">
                    <div 
                        v-for="user in usersWithLeaves" 
                        :key="user.id"
                        class="timeline-row"
                    >
                        <!-- Имя сотрудника -->
                        <div class="user-cell">
                            <div class="user-name">{{ user.name }}</div>
                        </div>
                        
                        <!-- Ячейки дней с отпусками -->
                        <div class="days-row">
                            <div 
                                v-for="(day, index) in calendarDays" 
                                :key="index"
                                class="day-cell"
                                :class="{
                                    'other-month': !day.isCurrentMonth,
                                    'today': day.isToday,
                                    'weekend': day.isWeekend
                                }"
                                @click="handleDayClick(day)"
                            >
                            </div>
                            <!-- Полоски отпусков - отображаются поверх ячеек -->
                            <div 
                                v-for="leave in getLeavesForUser(user.id)"
                                :key="`leave-${leave.id}`"
                                class="leave-bar-continuous"
                                :style="getContinuousLeaveBarStyle(leave, user.id)"
                                @click.stop="handleLeaveClick(leave)"
                                @mouseenter="showTooltip($event, leave)"
                                @mouseleave="hideTooltip"
                            >
                                <span class="leave-bar-text">{{ getLeaveBarText(leave) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Кастомный tooltip для комментариев -->
        <Transition name="tooltip-fade">
            <div 
                v-if="tooltip.visible && tooltip.text"
                class="leave-tooltip"
                :style="tooltip.style"
            >
                {{ tooltip.text }}
            </div>
        </Transition>

        <!-- Легенда -->
        <div class="leave-legend mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 class="text-sm font-semibold mb-3">{{ $t('leaveTypes') || 'Типы отпусков' }}</h3>
            <div class="flex flex-wrap gap-4">
                <div v-for="leaveType in leaveTypes" :key="leaveType.id" class="flex items-center gap-2">
                    <div 
                        class="w-5 h-5 rounded" 
                        :style="{ backgroundColor: leaveType.color || '#9CA3AF' }"
                    ></div>
                    <span class="text-sm">{{ getLeaveTypeName(leaveType.name) }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import localeData from 'dayjs/plugin/localeData';
import 'dayjs/locale/ru';
import 'dayjs/locale/en';
import 'dayjs/locale/tk';
import { translateLeaveType } from '@/utils/translationUtils';

dayjs.extend(isoWeek);
dayjs.extend(localeData);

export default {
    name: 'LeaveCalendarView',
    props: {
        leaves: {
            type: Array,
            required: true,
            default: () => []
        },
        leaveTypes: {
            type: Array,
            required: true,
            default: () => []
        }
    },
    emits: ['leave-click', 'day-click'],
    data() {
        return {
            currentDate: dayjs(),
            tooltip: {
                visible: false,
                text: '',
                style: {}
            }
        }
    },
    computed: {
        currentMonthYear() {
            // Используем локализацию dayjs для названий месяцев
            // Они автоматически меняются в зависимости от языка интерфейса
            const locale = this.$i18n.locale === 'ru' ? 'ru' : 
                          this.$i18n.locale === 'tm' ? 'tk' : 'en';
            return this.currentDate.locale(locale).format('MMMM YYYY');
        },
        calendarDays() {
            const startOfMonth = this.currentDate.startOf('month');
            const endOfMonth = this.currentDate.endOf('month');
            // Используем isoWeek для начала недели с понедельника
            const startDate = startOfMonth.startOf('isoWeek');
            const endDate = endOfMonth.endOf('isoWeek');
            
            const days = [];
            let currentDay = startDate;
            const today = dayjs();
            
            while (currentDay.isBefore(endDate) || currentDay.isSame(endDate, 'day')) {
                const locale = this.$i18n.locale === 'ru' ? 'ru' : 
                              this.$i18n.locale === 'tm' ? 'tk' : 'en';
                const weekday = currentDay.locale(locale).format('dd');
                const dayOfWeek = currentDay.day(); // 0 = воскресенье, 6 = суббота
                
                days.push({
                    date: currentDay.toDate(),
                    day: currentDay.date(),
                    weekday: weekday,
                    isCurrentMonth: currentDay.isSame(this.currentDate, 'month'),
                    isToday: currentDay.isSame(today, 'day'),
                    isWeekend: dayOfWeek === 0 || dayOfWeek === 6
                });
                currentDay = currentDay.add(1, 'day');
            }
            
            return days;
        },
        usersWithLeaves() {
            // Получаем уникальных сотрудников из отпусков
            const userMap = new Map();
            
            this.leaves.forEach(leave => {
                if (leave.user && leave.userId) {
                    if (!userMap.has(leave.userId)) {
                        userMap.set(leave.userId, {
                            id: leave.userId,
                            name: leave.userName || (leave.user.name || leave.user.email || `User ${leave.userId}`)
                        });
                    }
                }
            });
            
            // Сортируем по имени
            return Array.from(userMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        },
        // Кэшируем стили отпусков для оптимизации производительности
        leaveBarStylesCache() {
            const cache = new Map();
            const firstVisibleDay = this.calendarDays.length > 0 ? dayjs(this.calendarDays[0].date).startOf('day') : null;
            const lastVisibleDay = this.calendarDays.length > 0 ? dayjs(this.calendarDays[this.calendarDays.length - 1].date).startOf('day') : null;
            
            if (!firstVisibleDay || !lastVisibleDay) {
                return cache;
            }
            
            // Группируем отпуска по пользователям для оптимизации
            const leavesByUser = new Map();
            this.leaves.forEach(leave => {
                if (leave.userId) {
                    if (!leavesByUser.has(leave.userId)) {
                        leavesByUser.set(leave.userId, []);
                    }
                    leavesByUser.get(leave.userId).push(leave);
                }
            });
            
            // Вычисляем стили для всех отпусков
            leavesByUser.forEach((userLeaves, userId) => {
                userLeaves.forEach((leave, leaveIndex) => {
                    const style = this.computeLeaveBarStyle(leave, userId, userLeaves, leaveIndex, firstVisibleDay, lastVisibleDay);
                    cache.set(`${leave.id}-${userId}`, style);
                });
            });
            
            return cache;
        }
    },
    mounted() {
    },
    methods: {
        getLeaveTypeName(typeName) {
            return typeName ? translateLeaveType(typeName, this.$t) : '';
        },
        getLeaveBarText(leave) {
            const comment = leave.comment && leave.comment.trim() ? leave.comment.trim() : null;
            const leaveTypeName = this.getLeaveTypeName(leave.leaveTypeName);
            
            if (comment) {
                // Комментарий занимает всю доступную ширину линии, CSS сам обрежет через text-overflow
                return leaveTypeName ? `${comment} (${leaveTypeName})` : comment;
            }
            
            // Если комментария нет, показываем тип отпуска
            return leaveTypeName || '';
        },
        showTooltip(event, leave) {
            const comment = leave.comment && leave.comment.trim() ? leave.comment.trim() : null;
            
            // Показываем tooltip только если есть комментарий
            if (comment) {
                const targetRect = event.currentTarget.getBoundingClientRect();
                const containerRect = this.$refs.calendarContainer?.getBoundingClientRect() || { left: 0, top: 0 };
                
                // Позиционируем относительно контейнера календаря снизу полоски
                const left = targetRect.left - containerRect.left + targetRect.width / 2;
                const top = targetRect.top - containerRect.top + targetRect.height + 10;
                
                this.tooltip = {
                    visible: true,
                    text: comment,
                    style: {
                        left: `${left}px`,
                        top: `${top}px`,
                        transform: 'translateX(-50%)'
                    }
                };
            }
        },
        hideTooltip() {
            this.tooltip.visible = false;
        },
        getLeavesForUserAndDay(userId, date) {
            const checkDay = dayjs(date).startOf('day');
            
            return this.leaves.filter(leave => {
                if (leave.userId !== userId) return false;
                
                const leaveStart = dayjs(leave.dateFrom).startOf('day');
                const leaveEnd = dayjs(leave.dateTo).startOf('day');
                
                // Проверяем, что день находится в диапазоне отпуска
                return (checkDay.isAfter(leaveStart, 'day') || checkDay.isSame(leaveStart, 'day')) && 
                       (checkDay.isBefore(leaveEnd, 'day') || checkDay.isSame(leaveEnd, 'day'));
            });
        },
        getLeavesForUser(userId) {
            return this.leaves.filter(leave => leave.userId === userId);
        },
        // Оптимизированный метод для вычисления стиля отпуска
        computeLeaveBarStyle(leave, userId, userLeaves, leaveIndex, firstVisibleDay, lastVisibleDay) {
            const leaveStart = dayjs(leave.dateFrom).startOf('day');
            const leaveEnd = dayjs(leave.dateTo).startOf('day');
            
            // Проверяем, что отпуск попадает в видимый период
            if (leaveEnd.isBefore(firstVisibleDay, 'day') || leaveStart.isAfter(lastVisibleDay, 'day')) {
                return { display: 'none' };
            }
            
            // Находим индексы начала и конца отпуска в календаре
            let actualStartIndex = -1;
            let actualEndIndex = -1;
            
            // Определяем видимый диапазон отпуска
            const visibleStart = leaveStart.isBefore(firstVisibleDay, 'day') ? firstVisibleDay : leaveStart;
            const visibleEnd = leaveEnd.isAfter(lastVisibleDay, 'day') ? lastVisibleDay : leaveEnd;
            
            // Оптимизированный поиск индексов (бинарный поиск не нужен для небольшого количества дней)
            for (let i = 0; i < this.calendarDays.length; i++) {
                const dayDate = dayjs(this.calendarDays[i].date).startOf('day');
                
                if (actualStartIndex === -1 && (dayDate.isSame(visibleStart, 'day') || dayDate.isAfter(visibleStart, 'day'))) {
                    actualStartIndex = i;
                }
                
                if (dayDate.isSame(visibleEnd, 'day') || (dayDate.isBefore(visibleEnd, 'day') && 
                    (i === this.calendarDays.length - 1 || dayjs(this.calendarDays[i + 1].date).startOf('day').isAfter(visibleEnd, 'day')))) {
                    actualEndIndex = i;
                    break; // Нашли конец, можно прервать цикл
                }
            }
            
            // Если отпуск начинается до видимого периода
            if (actualStartIndex === -1 && leaveStart.isBefore(firstVisibleDay, 'day')) {
                actualStartIndex = 0;
            }
            
            // Если отпуск заканчивается после видимого периода
            if (actualEndIndex === -1 && leaveEnd.isAfter(lastVisibleDay, 'day')) {
                actualEndIndex = this.calendarDays.length - 1;
            }
            
            // Если отпуск не попадает в видимый период, не отображаем
            if (actualStartIndex === -1 || actualEndIndex === -1 || actualStartIndex > actualEndIndex) {
                return { display: 'none' };
            }
            
            // Вычисляем позицию и ширину
            const dayWidth = 60; // ширина одной ячейки дня
            const left = actualStartIndex * dayWidth;
            const spanDays = actualEndIndex - actualStartIndex + 1;
            const width = spanDays * dayWidth;
            
            const color = leave.leaveType && leave.leaveType.color ? leave.leaveType.color : '#9CA3AF';
            
            // Определяем, является ли первый/последний день видимого периода началом/концом отпуска
            const isStartVisible = dayjs(this.calendarDays[actualStartIndex].date).startOf('day').isSame(leaveStart, 'day');
            const isEndVisible = dayjs(this.calendarDays[actualEndIndex].date).startOf('day').isSame(leaveEnd, 'day');
            
            // Вычисляем вертикальное смещение для перекрывающихся отпусков (оптимизировано)
            let verticalOffset = 0;
            if (leaveIndex > 0) {
                for (let i = 0; i < leaveIndex; i++) {
                    const otherLeave = userLeaves[i];
                    const otherStart = dayjs(otherLeave.dateFrom).startOf('day');
                    const otherEnd = dayjs(otherLeave.dateTo).startOf('day');
                    
                    // Проверяем перекрытие по времени
                    if (!(leaveEnd.isBefore(otherStart, 'day') || leaveStart.isAfter(otherEnd, 'day'))) {
                        verticalOffset += 28; // высота полоски + небольшой отступ
                    }
                }
            }
            
            const baseTop = 'calc(50% - 12px)';
            const topValue = verticalOffset > 0 ? `calc(50% - 12px + ${verticalOffset}px)` : baseTop;
            
            return {
                backgroundColor: color,
                left: `${left}px`,
                width: `${width}px`,
                top: topValue,
                borderRadius: isStartVisible && isEndVisible ? '0.25rem' : 
                             isStartVisible ? '0.25rem 0 0 0.25rem' : 
                             isEndVisible ? '0 0.25rem 0.25rem 0' : '0'
            };
        },
        // Используем кэш для получения стилей
        getContinuousLeaveBarStyle(leave, userId) {
            const cacheKey = `${leave.id}-${userId}`;
            return this.leaveBarStylesCache.get(cacheKey) || { display: 'none' };
        },
        getLeaveBarStyle(leave, dayDate) {
            const leaveStart = dayjs(leave.dateFrom).startOf('day');
            const leaveEnd = dayjs(leave.dateTo).startOf('day');
            const currentDay = dayjs(dayDate).startOf('day');
            
            const isStart = currentDay.isSame(leaveStart, 'day');
            const isEnd = currentDay.isSame(leaveEnd, 'day');
            
            const color = leave.leaveType && leave.leaveType.color ? leave.leaveType.color : '#9CA3AF';
            
            return {
                backgroundColor: color,
                borderRadius: isStart && isEnd ? '0.25rem' : isStart ? '0.25rem 0 0 0.25rem' : isEnd ? '0 0.25rem 0.25rem 0' : '0',
                width: '100%'
            };
        },
        previousMonth() {
            this.currentDate = this.currentDate.subtract(1, 'month');
        },
        nextMonth() {
            this.currentDate = this.currentDate.add(1, 'month');
        },
        handleLeaveClick(leave) {
            this.$emit('leave-click', leave);
        },
        handleDayClick(day) {
            this.$emit('day-click', day);
        }
    },
    watch: {
    }
}
</script>

<style scoped>
.leave-calendar-container {
    position: relative;
    width: 100%;
    padding: 1rem;
}

.calendar-header {
    padding: 0.5rem 0;
}

.calendar-header h2 {
    text-transform: capitalize;
}

.calendar-timeline-wrapper {
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    overflow-x: auto;
    overflow-y: auto;
    background: white;
    max-height: 600px;
}

.calendar-timeline-container {
    min-width: 800px;
    display: flex;
    flex-direction: column;
}

.timeline-header {
    display: flex;
    background: #f9fafb;
    border-bottom: 2px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 10;
    min-width: fit-content;
}

.user-header-cell {
    width: 200px;
    min-width: 200px;
    padding: 0.75rem;
    border-right: 1px solid #e5e7eb;
    font-weight: 600;
    font-size: 0.875rem;
    color: #6b7280;
    position: sticky;
    left: 0;
    background: #f9fafb;
    z-index: 11;
}

.days-header {
    display: flex;
    flex: 1;
    min-width: fit-content;
}

.day-header {
    min-width: 60px;
    width: 60px;
    padding: 0.5rem;
    text-align: center;
    border-right: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.day-header.other-month {
    background-color: #f9fafb;
    color: #9ca3af;
}

.day-header.today {
    background-color: #eff6ff;
    border: 2px solid #3b82f6;
    border-radius: 0.25rem;
}

.day-header.weekend {
    background-color: #fef2f2;
}

.day-weekday {
    font-size: 0.75rem;
    color: #6b7280;
    text-transform: uppercase;
    font-weight: 600;
}

.day-number {
    font-weight: 600;
    font-size: 0.875rem;
}

.timeline-rows {
    display: flex;
    flex-direction: column;
}

.timeline-row {
    display: flex;
    border-bottom: 1px solid #e5e7eb;
    min-height: 60px;
}

.timeline-row:hover {
    background-color: #f9fafb;
}

.user-cell {
    width: 200px;
    min-width: 200px;
    padding: 0.75rem;
    border-right: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    background: white;
    position: sticky;
    left: 0;
    z-index: 5;
}

.user-name {
    font-weight: 500;
    font-size: 0.875rem;
    color: #1f2937;
}

.days-row {
    display: flex;
    flex: 1;
    min-width: fit-content;
    position: relative;
}

.day-cell {
    min-width: 60px;
    width: 60px;
    padding: 0.25rem;
    border-right: 1px solid #e5e7eb;
    position: relative;
    cursor: pointer;
    transition: background-color 0.2s;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    z-index: 1;
}

.day-cell:hover {
    background-color: #f3f4f6;
}

.day-cell.other-month {
    background-color: #f9fafb;
}

.day-cell.today {
    background-color: #eff6ff;
}

.day-cell.weekend {
    background-color: #fef2f2;
}

.leave-bar {
    height: 24px;
    padding: 0.125rem 0.25rem;
    color: white;
    font-size: 0.7rem;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.2s;
    display: flex;
    align-items: center;
    overflow: hidden;
    white-space: nowrap;
}

.leave-bar:hover {
    opacity: 0.9;
    transform: scale(1.02);
    z-index: 1;
}

.leave-bar-continuous {
    position: absolute;
    height: 24px;
    padding: 0.125rem 0.5rem;
    color: white;
    font-size: 0.7rem;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.2s;
    display: flex;
    align-items: center;
    overflow: hidden;
    white-space: nowrap;
    z-index: 2;
    box-sizing: border-box;
    transform-origin: left center;
}

.leave-bar-continuous:hover {
    opacity: 0.9;
    transform: scale(1.02);
    z-index: 3;
}

.leave-bar-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
}

.leave-legend {
    border: 1px solid #e5e7eb;
}

.leave-tooltip {
    position: absolute;
    background-color: #1f2937;
    color: white;
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    z-index: 1000;
    pointer-events: none;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    max-width: 300px;
    white-space: normal;
    word-wrap: break-word;
    line-height: 1.4;
}

.leave-tooltip::after {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-bottom-color: #1f2937;
}

.tooltip-fade-enter-active {
    transition: opacity 0.2s ease-out, transform 0.2s ease-out;
}

.tooltip-fade-leave-active {
    transition: opacity 0.15s ease-in, transform 0.15s ease-in;
}

.tooltip-fade-enter-from {
    opacity: 0;
    transform: translateX(-50%) translateY(5px);
}

.tooltip-fade-enter-to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}

.tooltip-fade-leave-from {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}

.tooltip-fade-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(5px);
}

/* Адаптивность */
@media (max-width: 768px) {
    .user-header-cell,
    .user-cell {
        width: 150px;
        min-width: 150px;
    }
    
    .day-header,
    .day-cell {
        min-width: 50px;
        width: 50px;
    }
    
    .leave-bar {
        height: 20px;
        font-size: 0.65rem;
    }
}
</style>



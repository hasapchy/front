<template>
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow transition-shadow duration-200">
        <div class="flex items-center mb-3 border-b border-gray-100 pb-3">
            <i class="fas fa-calendar-day text-gray-600 text-sm mr-2"></i>
            <h3 class="text-sm font-semibold text-gray-900">{{ $t('upcomingHolidays') || 'Ближайшие праздники' }}</h3>
        </div>
        
        <div v-if="loading" class="min-h-24">
            <TableSkeleton />
        </div>
        
        <div v-else-if="holidays.length > 0" class="space-y-3">
            <div 
                v-for="holiday in holidays" 
                :key="holiday.id"
                class="flex items-center gap-2 hover:bg-gray-50 -mx-2 px-2 py-2 rounded transition-colors"
            >
                <div 
                    class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    :style="{ backgroundColor: holiday.color || '#3B82F6' }"
                >
                    <i class="fas fa-gift text-white text-xs"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-gray-900 truncate">{{ holiday.name }}</div>
                    <div class="text-xs text-gray-500">{{ holiday.dateFormatted }}</div>
                </div>
            </div>
        </div>
        
        <div v-else class="text-sm text-gray-500 text-center py-2">
            {{ $t('noUpcomingHolidays') || 'Нет предстоящих праздников' }}
        </div>
    </div>
</template>

<script>
import CompanyHolidayController from '@/api/CompanyHolidayController';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import 'dayjs/locale/en';
import 'dayjs/locale/tk';

export default {
    name: 'HolidaysWidget',
    components: { TableSkeleton },
    data() {
        return {
            holidays: [],
            loading: false
        }
    },
    async mounted() {
        await this.fetchHolidays();
    },
    methods: {
        async fetchHolidays() {
            this.loading = true;
            try {
                const holidays = await CompanyHolidayController.getAll();
                const now = dayjs();
                const locale = this.$i18n.locale || 'ru';
                dayjs.locale(locale);
                
                const mapped = (holidays || [])
                    .map(holiday => {
                        const holidayDate = dayjs(holiday.date);
                        const thisYear = holidayDate.year(now.year());
                        const nextYear = holidayDate.year(now.year() + 1);
                        
                        // Проверяем праздник в текущем или следующем году
                        let nextHoliday = thisYear;
                        if (thisYear.isBefore(now, 'day')) {
                            // Для повторяющихся праздников показываем следующий год
                            if (holiday.is_recurring) {
                                nextHoliday = nextYear;
                            }
                        }
                        
                        return {
                            ...holiday,
                            nextHoliday,
                            dateFormatted: nextHoliday.format('D MMMM'),
                            daysUntil: nextHoliday.diff(now, 'day')
                        };
                    });
                
                const filtered = mapped.filter(holiday => {
                    // Для повторяющихся праздников показываем все будущие
                    if (holiday.is_recurring) {
                        return holiday.daysUntil >= 0;
                    }
                    // Для не повторяющихся - только если еще не прошли
                    return holiday.daysUntil >= 0;
                });
                
                this.holidays = filtered
                    .sort((a, b) => a.nextHoliday.diff(b.nextHoliday))
                    .slice(0, 3);
            } catch (error) {
                console.error('Ошибка загрузки праздников:', error);
                this.holidays = [];
            } finally {
                this.loading = false;
            }
        }
    }
}
</script>

<style scoped>
</style>






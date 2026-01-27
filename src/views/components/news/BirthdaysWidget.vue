<template>
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow transition-shadow duration-200">
        <div class="flex items-center mb-3 border-b border-gray-100 pb-3">
            <i class="fas fa-birthday-cake text-gray-600 text-sm mr-2"></i>
            <h3 class="text-sm font-semibold text-gray-900">{{ $t('birthdays') || 'Дни рождения' }}</h3>
        </div>
        
        <div v-if="loading" class="flex justify-center py-4">
            <i class="fas fa-spinner fa-spin text-gray-400"></i>
        </div>
        
        <div v-else-if="birthdays.length > 0" class="space-y-3">
            <div 
                v-for="person in birthdays" 
                :key="person.id"
                class="flex items-center gap-2 hover:bg-gray-50 -mx-2 px-2 py-2 rounded transition-colors"
            >
                <div class="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center shrink-0 border border-gray-200">
                    <img 
                        v-if="person.photoUrl" 
                        :src="person.photoUrl" 
                        class="w-full h-full object-cover"
                        :alt="person.name"
                        @error="handleImageError"
                    />
                    <i v-else class="fas fa-user text-gray-400 text-xs"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-gray-900 truncate">{{ person.name }}</div>
                    <div class="text-xs text-gray-500">{{ person.birthdayFormatted }}</div>
                </div>
            </div>
        </div>
        
        <div v-else class="text-sm text-gray-500 text-center py-2">
            {{ $t('noBirthdays') || 'Нет предстоящих дней рождения' }}
        </div>
    </div>
</template>

<script>
import UsersController from '@/api/UsersController';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import 'dayjs/locale/en';
import 'dayjs/locale/tk';

export default {
    name: 'BirthdaysWidget',
    data() {
        return {
            birthdays: [],
            loading: false
        }
    },
    async mounted() {
        await this.fetchBirthdays();
    },
    methods: {
        handleImageError(event) {
            event.target.style.display = 'none';
        },
        async fetchBirthdays() {
            this.loading = true;
            try {
                const users = await UsersController.getListItems();
                const now = dayjs();
                const locale = this.$i18n.locale || 'ru';
                dayjs.locale(locale);
                
                this.birthdays = (users || [])
                    .filter(user => user.birthday)
                    .map(user => {
                        const birthday = dayjs(user.birthday);
                        const thisYear = birthday.year(now.year());
                        const nextYear = birthday.year(now.year() + 1);
                        
                        // Проверяем день рождения в текущем или следующем году
                        let nextBirthday = thisYear;
                        if (thisYear.isBefore(now, 'day')) {
                            nextBirthday = nextYear;
                        }
                        
                        // Получаем URL фото и полное имя
                        const photoUrl = user.photoUrl ? user.photoUrl() : null;
                        const fullName = user.fullName ? user.fullName() : `${user.name || ''} ${user.surname || ''}`.trim();
                        
                        return {
                            ...user,
                            nextBirthday,
                            birthdayFormatted: nextBirthday.format('D MMMM'),
                            photoUrl,
                            name: fullName || user.name || 'Без имени'
                        };
                    })
                    .sort((a, b) => a.nextBirthday.diff(b.nextBirthday))
                    .slice(0, 5);
            } catch (error) {
                console.error('Ошибка загрузки дней рождения:', error);
                this.birthdays = [];
            } finally {
                this.loading = false;
            }
        }
    }
}
</script>

<style scoped>
</style>


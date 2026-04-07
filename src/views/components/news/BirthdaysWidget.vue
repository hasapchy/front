<template>
  <div class="bg-white dark:bg-[var(--surface-elevated)] rounded-lg shadow-sm border border-gray-200 dark:border-white/10 p-4 hover:shadow dark:hover:shadow-none transition-shadow duration-200">
    <div
      class="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-white/10 pb-3 cursor-pointer lg:cursor-default"
      role="button"
      tabindex="0"
      :aria-expanded="!collapsed"
      :aria-label="collapsed ? $t('expand') : $t('collapse')"
      @click="toggleCollapsed"
      @keydown.enter.space.prevent="toggleCollapsed"
    >
      <div class="flex items-center">
        <i class="fas fa-birthday-cake text-gray-600 dark:text-[var(--text-secondary)] text-sm mr-2" />
        <h3 class="text-sm font-semibold text-gray-900 dark:text-[var(--text-primary)]">
          {{ $t('birthdays') }}
        </h3>
      </div>
      <i
        class="fas fa-chevron-down text-gray-400 dark:text-[var(--text-secondary)] text-xs transition-transform lg:hidden"
        :class="{ 'rotate-180': !collapsed }"
      />
    </div>

    <div
      v-show="!collapsed"
      class="lg:!block"
    >
      <div
        v-if="loading"
        class="min-h-24"
      >
        <TableSkeleton />
      </div>
        
      <div
        v-else-if="birthdays.length > 0"
        class="space-y-3"
      >
        <div 
          v-for="person in birthdays" 
          :key="person.id"
          class="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5 -mx-2 px-2 py-2 rounded transition-colors"
        >
          <div class="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-[var(--surface-muted)] flex items-center justify-center shrink-0 border border-gray-200 dark:border-white/10">
            <img 
              v-if="person.photoUrl" 
              :src="person.photoUrl" 
              class="w-full h-full object-cover"
              :alt="person.name"
              @error="handleImageError"
            >
            <i
              v-else
              class="fas fa-user text-gray-400 dark:text-[var(--text-secondary)] text-xs"
            />
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-gray-900 dark:text-[var(--text-primary)] truncate">
              {{ person.name }}
            </div>
            <div
              v-if="person.position"
              class="text-xs text-gray-500 dark:text-[var(--text-secondary)]"
            >
              {{ person.position }}
            </div>
            <div class="text-xs text-gray-500 dark:text-[var(--text-secondary)]">
              {{ person.birthdayFormatted }}
            </div>
          </div>
        </div>
      </div>
        
      <div
        v-else
        class="text-sm text-gray-500 dark:text-[var(--text-secondary)] text-center py-3"
      >
        <p class="mb-2">
          {{ $t('noBirthdays') }}
        </p>
        <router-link
          v-if="$store.getters.hasPermission('users_view')"
          to="/users"
          class="text-[#337AB7] dark:text-[var(--label-accent)] hover:underline text-xs"
        >
          {{ $t('goToUsers') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import UsersController from '@/api/UsersController';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import { getUserDisplayName, getUserPosition } from '@/utils/displayUtils';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import 'dayjs/locale/en';
import 'dayjs/locale/tk';
import { applyAvatarImageFallback } from '@/constants/imageFallback';

export default {
    name: 'BirthdaysWidget',
    components: { TableSkeleton },
    data() {
        return {
            birthdays: [],
            loading: false,
            collapsed: false
        };
    },
    async mounted() {
        await this.fetchBirthdays();
    },
    methods: {
        toggleCollapsed() {
            if (window.innerWidth >= 1024) return;
            this.collapsed = !this.collapsed;
        },
        handleImageError(event) {
            applyAvatarImageFallback(event);
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
                        return {
                            ...user,
                            nextBirthday,
                            birthdayFormatted: nextBirthday.format('D MMMM'),
                            photoUrl,
                            name: getUserDisplayName(user) || (user.name || user.surname || 'Без имени'),
                            position: getUserPosition(user) 
                        };
                    })
                    .sort((a, b) => a.nextBirthday.diff(b.nextBirthday))
                    .slice(0, 3);
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


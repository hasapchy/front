<template>
  <div>
    <div
      class="bg-white dark:bg-[var(--surface-elevated)] rounded-lg shadow-sm border border-gray-200 dark:border-white/10 p-4 hover:shadow dark:hover:shadow-none transition-shadow duration-200">
      <div class="flex items-center mb-3 border-b border-gray-100 dark:border-white/10 pb-3">
        <i class="fas fa-birthday-cake text-gray-600 dark:text-[var(--text-secondary)] text-sm mr-2" />
        <h3 class="text-sm font-semibold text-gray-900 dark:text-[var(--text-primary)]">
          {{ $t('birthdays') }}
        </h3>
      </div>

      <div>
        <div v-if="loading" class="min-h-24">
          <TableSkeleton />
        </div>

        <div v-else-if="birthdays.length > 0" class="space-y-3">
          <div v-for="person in birthdays" :key="person.id"
            class="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-white/5 -mx-2 px-2 py-2 rounded transition-colors">
            <div
              role="button"
              class="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-[var(--surface-muted)] flex items-center justify-center shrink-0 border border-gray-200 dark:border-white/10 cursor-pointer"
              @click="openUserActions(person)"
            >
              <img v-if="person.photoUrl" :src="person.photoUrl" class="w-full h-full object-cover" :alt="person.name"
                @error="handleImageError">
              <i v-else class="fas fa-user text-gray-400 dark:text-[var(--text-secondary)] text-xs" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900 dark:text-[var(--text-primary)] truncate">
                {{ person.name }}
              </div>
              <div v-if="person.position" class="text-xs text-gray-500 dark:text-[var(--text-secondary)]">
                {{ person.position }}
              </div>
              <div class="text-xs text-gray-500 dark:text-[var(--text-secondary)]">
                {{ person.birthdayFormatted }}
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-sm text-gray-500 dark:text-[var(--text-secondary)] text-center py-3">
          <p class="mb-2">
            {{ $t('noBirthdays') }}
          </p>
          <router-link v-if="$store.getters.hasPermission('users_view')" to="/users"
            class="text-[var(--color-info)] dark:text-[var(--label-accent)] hover:underline text-xs">
            {{ $t('goToUsers') }}
          </router-link>
        </div>
      </div>
    </div>
    <UserActionsModal
      :show="userActionsDialog"
      :user="selectedUser"
      :onclose="closeUserActions"
    />
  </div>
</template>

<script>
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import UserActionsModal from '@/views/components/app/UserActionsModal.vue';
import { getUserDisplayName, getUserPosition } from '@/utils/displayUtils';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import 'dayjs/locale/en';
import 'dayjs/locale/tk';
import { applyAvatarImageFallback } from '@/constants/imageFallback';

export default {
  name: 'BirthdaysWidget',
  components: { TableSkeleton, UserActionsModal },
  data() {
    return {
      birthdays: [],
      loading: false,
      userActionsDialog: false,
      selectedUser: null
    };
  },
  async mounted() {
    await this.fetchBirthdays();
  },
  methods: {
    openUserActions(user) {
      this.selectedUser = user;
      this.userActionsDialog = true;
    },
    closeUserActions() {
      this.userActionsDialog = false;
      this.selectedUser = null;
    },
    handleImageError(event) {
      applyAvatarImageFallback(event);
    },
    async fetchBirthdays() {
      this.loading = true;
      try {
        if (!this.$store.getters.users?.length) {
          await this.$store.dispatch('loadUsers');
        }
        const users = this.$store.getters.users || [];
        const now = dayjs();
        const locale = this.$i18n.locale || 'ru';
        dayjs.locale(locale);

        this.birthdays = (users || [])
          .filter(user => user.birthday && [true, 1, '1'].includes(user.isActive))
          .map(user => {
            const birthday = dayjs(user.birthday);
            const thisYear = birthday.year(now.year());
            const nextYear = birthday.year(now.year() + 1);

            let nextBirthday = thisYear;
            if (thisYear.isBefore(now, 'day')) {
              nextBirthday = nextYear;
            }

            const photoUrl = typeof user.photoUrl === 'function' ? user.photoUrl() : (user.photoUrl || null);
            return {
              id: user.id,
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

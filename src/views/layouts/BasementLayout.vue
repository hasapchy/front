<template>
  <transition name="fade" mode="out-in">
    <div v-if="user !== null" key="routerview" class="min-h-screen bg-gray-100">
      <!-- Навигация -->
      <nav class="bg-white shadow">
        <div class="mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex">
              <div class="flex-shrink-0 flex items-center">
                <div class="flex items-center gap-3">
                  <img :src="getLogo()" alt="Hasapchy" class="h-8 w-8 object-contain" />
                  <h1 class="text-xl font-bold text-gray-900">{{ $t('accountingSystem') }}</h1>
                </div>
              </div>
              <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                <router-link
                  to="/basement/orders"
                  class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                  :class="{ 'border-indigo-500 text-indigo-600': $route.path === '/basement/orders' }"
                >
                  {{ $t('orders') }}
                </router-link>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0">
                <LanguageSwitcher />
              </div>
              <div class="flex items-center space-x-3">
                <span class="text-sm text-gray-500">
                  {{ user?.name || $t('worker') }}
                </span>
                <button
                  @click="logout"
                  class="text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md p-1"
                  :title="$t('logout')"
                >
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- Основной контент -->
      <main class="mx-auto py-6 sm:px-6 lg:px-8">
        <router-view />
      </main>
      
      <!-- Уведомления -->
      <NotificationToast 
        :title="$store.getters.notificationTitle" 
        :subtitle="$store.getters.notificationSubtitle" 
        :show="$store.getters.notification"
        :is-danger="$store.getters.notificationIsDanger" 
        @close="closeNotification" 
      />
      
      <!-- ✅ Полноэкранный спиннер при загрузке данных компании -->
      <!-- Временно отключен -->
      <!--
      <transition name="fade">
        <div 
          v-if="isLoadingCompanyData" 
          class="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm z-[9999] flex items-center justify-center"
          @click.self.prevent
          @contextmenu.prevent
          style="pointer-events: all;"
        >
          <div class="bg-white rounded-xl p-8 shadow-2xl border border-gray-200 flex flex-col items-center gap-4">
            <SpinnerIcon />
            <p class="text-gray-700 font-medium">Загрузка данных компании...</p>
          </div>
        </div>
      </transition>
      -->
    </div>
    <div v-else key="loader" class="h-screen flex items-center justify-center">
      <SpinnerIcon />
    </div>
  </transition>
</template>

<script>
import { BasementAuthController } from '@/api/BasementAuthController'
import LanguageSwitcher from '@/views/components/app/LanguageSwitcher.vue'
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue'
import SpinnerIcon from '@/views/components/app/SpinnerIcon.vue'
import companyChangeMixin from '@/mixins/companyChangeMixin'

export default {
  name: 'BasementLayout',
  mixins: [companyChangeMixin],
  components: {
    LanguageSwitcher,
    NotificationToast,
    SpinnerIcon
  },
  data() {
    return {
      loading: true
    }
  },
  computed: {
    user() {
      return this.$store.state.user
    },
    isLoadingCompanyData() {
      return this.$store.state.loadingFlags?.companyData || false
    }
  },
  async created() {
    // Устанавливаем состояние загрузки
    this.$store.dispatch('setLoading', true);
    
    // Проверяем токен
    const token = localStorage.getItem('token')
    if (!token) {
      this.$router.push('/basement/login')
      return
    }

    try {
      // Получаем информацию о пользователе
      const userData = await BasementAuthController.getBasementUser()
      if (!userData) {
        this.$router.push('/basement/login')
        return
      }
      
      this.$store.dispatch('setUser', userData.user)
      this.$store.dispatch('setPermissions', userData.user.permissions || [])
      
      // Загружаем текущую компанию, если её нет в store
      if (!this.$store.getters.currentCompanyId) {
        await this.$store.dispatch('loadCurrentCompany')
      }
    } catch (error) {
      console.error('Ошибка получения пользователя:', error)
      this.$store.dispatch('setUser', null)
      this.$store.dispatch('setPermissions', [])
      this.$router.push('/basement/login')
    } finally {
      // Завершаем загрузку
      this.$store.dispatch('setLoading', false)
      this.loading = false
    }
  },
  methods: {
    getLogo() {
      const ver = this.$store?.state?.logoVersion || 0
      const ts = Date.now()
      return `/logo.jpg?v=${ts}&cv=${ver}`
    },
    logout() {
      BasementAuthController.logout()
      this.$store.dispatch('setUser', null)
      this.$store.dispatch('setPermissions', [])
      this.$router.push('/basement/login')
    },
    closeNotification() {
      this.$store.dispatch('closeNotification')
    }
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

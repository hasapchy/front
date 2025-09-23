<template>
  <div class="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <form @submit.prevent="login" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              {{ $t('email') }}
            </label>
            <div class="mt-1">
              <input
                id="email"
                v-model="form.email"
                type="email"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                :placeholder="$t('enterEmail')"
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              {{ $t('password') }}
            </label>
            <div class="mt-1">
              <input
                id="password"
                v-model="form.password"
                type="password"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                :placeholder="$t('enterPassword')"
              />
            </div>
          </div>

          <div class="flex items-center">
            <input
              id="remember"
              v-model="form.remember"
              type="checkbox"
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label for="remember" class="ml-2 block text-sm text-gray-900">
              {{ $t('rememberMe') }}
            </label>
          </div>

          <div>
            <PrimaryButton
              :is-loading="loading"
              :is-full="true"
              :is-info="true"
              icon="fas fa-sign-in-alt"
              :onclick="login"
            >
              {{ $t('login') }}
            </PrimaryButton>
          </div>

          <div v-if="error" class="text-red-600 text-sm text-center">
            {{ error }}
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { BasementAuthController } from '@/api/BasementAuthController'
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue'

export default {
  name: 'BasementLoginPage',
  components: {
    PrimaryButton
  },
  data() {
    return {
      form: {
        email: '',
        password: '',
        remember: false
      },
      loading: false,
      error: null
    }
  },
  methods: {
    async login() {
      this.loading = true
      this.error = null

      try {
        const response = await BasementAuthController.basementLogin(this.form)
        
        // Перенаправляем на главную страницу подвала
        this.$router.push('/basement/orders')
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Ошибка входа'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

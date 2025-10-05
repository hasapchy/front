<template>
  <div>
    <!-- Заголовок -->
    <div class="md:flex md:items-center md:justify-between">
      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          {{ $t('orders') }}
        </h2>
      </div>
      <div class="mt-4 flex md:mt-0 md:ml-4">
        <router-link to="/basement/orders/create">
          <PrimaryButton
            icon="fas fa-plus"
            :is-info="true"
          >
            {{ $t('createOrder') }}
          </PrimaryButton>
        </router-link>
      </div>
    </div>

    <!-- Список заказов -->
    <div class="mt-8">
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p class="mt-2 text-gray-500">{{ $t('loading') }}</p>
      </div>

      <div v-else-if="orders.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">{{ $t('noData') }}</h3>
        <p class="mt-1 text-sm text-gray-500">{{ $t('startWithCreatingOrder') }}</p>
      </div>

      <div v-else class="space-y-4">
        <div v-for="order in orders" :key="order.id" 
             class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 overflow-hidden cursor-pointer"
             @dblclick="editOrder(order)">
          <div class="px-6 py-4">
            <!-- Заголовок заказа -->
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-3">
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ $t('order') }} #{{ order.id }}
                </h3>
                <span v-if="order.status?.name" 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="getStatusClass(order.status)">
                  {{ order.status.name }}
                </span>
              </div>
              <div class="text-sm text-gray-500">
                {{ formatOrderDate(order.created_at) }}
              </div>
            </div>

            <!-- Основная информация -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <!-- Клиент -->
              <div>
                <p class="text-sm font-medium text-gray-500 mb-1">{{ $t('client') }}</p>
                <p class="text-sm text-gray-900 truncate">{{ getClientName(order) }}</p>
              </div>

              <!-- Проект -->
              <div>
                <p class="text-sm font-medium text-gray-500 mb-1">{{ $t('project') }}</p>
                <p class="text-sm text-gray-900 truncate">{{ getProjectName(order) }}</p>
              </div>

              <!-- Товары -->
              <div>
                <p class="text-sm font-medium text-gray-500 mb-1">{{ $t('products') }}</p>
                <div v-if="order.products && order.products.length > 0" class="space-y-1">
                  <div v-for="product in order.products" :key="product.id" class="text-sm text-gray-900">
                    <span class="font-medium">{{ product.product_name }}</span>
                    <span class="text-gray-500 ml-1">
                      ({{ product.quantity }} {{ product.unit_short_name }})
                    </span>
                  </div>
                </div>
                <div v-else class="text-sm text-gray-500">
                  {{ $t('noProducts') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { BasementAuthController } from '@/api/BasementAuthController'
import api from '@/api/axiosInstance'
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue'
// import timeLimitMixin from '@/mixins/timeLimitMixin' // Удалено ограничение по времени

export default {
  name: 'BasementOrdersPage',
  components: {
    PrimaryButton
  },
  // mixins: [timeLimitMixin], // Удалено ограничение по времени
  data() {
    return {
      orders: [],
      loading: true
    }
  },
  async mounted() {
    await this.loadOrders()
  },
  methods: {
    async loadOrders() {
      try {
        const token = BasementAuthController.getToken()
        const { data } = await api.get('/orders', {
          headers: { Authorization: `Bearer ${token}` }
        })
        this.orders = data.items || []
      } catch (error) {
        console.error('Ошибка загрузки заказов:', error)
        this.orders = []
      } finally {
        this.loading = false
      }
    },
    getStatusClass(status) {
      if (!status) return 'bg-gray-100 text-gray-800'
      
      const statusClasses = {
        'Новый': 'bg-green-100 text-green-800',
        'В работе': 'bg-yellow-100 text-yellow-800',
        'Завершен': 'bg-blue-100 text-blue-800',
        'Отменен': 'bg-red-100 text-red-800'
      }
      
      return statusClasses[status.name] || 'bg-gray-100 text-gray-800'
    },
    getClientName(order) {
      if (!order.client) return this.$t('notSpecified')
      
      if (order.client.first_name && order.client.last_name) {
        return `${order.client.first_name} ${order.client.last_name}`
      }
      if (order.client.first_name) {
        return order.client.first_name
      }
      if (order.client.name) {
        return order.client.name
      }
      
      return this.$t('notSpecified')
    },
    getProjectName(order) {
      if (!order.project) return this.$t('notSpecified')
      
      return order.project.name || this.$t('notSpecified')
    },
    editOrder(order) {
      // Ограничение по времени удалено - можно редактировать в любое время
      // Переходим на страницу редактирования
      this.$router.push(`/basement/orders/${order.id}/edit`)
    },
    // Методы проверки времени удалены - ограничения по времени отключены
    
    formatOrderDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

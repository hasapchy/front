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

    <!-- Таблица заказов -->
    <div class="mt-8">
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p class="mt-2 text-gray-500">{{ $t('loading') }}</p>
      </div>

      <DraggableTable 
        v-else
        table-key="basementOrders"
        :columns-config="columns"
        :table-data="orders"
        :item-mapper="itemMapper"
        :on-item-click="editOrder"
      />
    </div>

  </div>
</template>

<script>
import { BasementAuthController } from '@/api/BasementAuthController'
import api from '@/api/axiosInstance'
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue'
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue'

export default {
  name: 'BasementOrdersPage',
  components: {
    PrimaryButton,
    DraggableTable
  },
  data() {
    return {
      orders: [],
      loading: true
    }
  },
  computed: {
    columns() {
      return [
        { 
          name: 'id', 
          label: `${this.$t('order')} #`, 
          size: 100 
        },
        { 
          name: 'status', 
          label: this.$t('status'), 
          size: 150,
          html: true
        },
        { 
          name: 'client', 
          label: this.$t('client'), 
          size: 200 
        },
        { 
          name: 'project', 
          label: this.$t('project'), 
          size: 200 
        },
        { 
          name: 'products', 
          label: this.$t('products'), 
          size: 300,
          html: true
        },
        { 
          name: 'created_at', 
          label: this.$t('date'), 
          size: 150 
        }
      ]
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
    itemMapper(order, columnName) {
      switch (columnName) {
        case 'id':
          return order.id
        case 'status':
          return this.formatStatus(order.status)
        case 'client':
          return this.getClientName(order)
        case 'project':
          return this.getProjectName(order)
        case 'products':
          return this.formatProducts(order.products)
        case 'created_at':
          return this.formatOrderDate(order.created_at)
        default:
          return order[columnName] || '-'
      }
    },
    formatStatus(status) {
      if (!status) return '<span class="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">-</span>'
      
      const statusClasses = {
        'Новый': 'bg-green-100 text-green-800',
        'В работе': 'bg-yellow-100 text-yellow-800',
        'Завершен': 'bg-blue-100 text-blue-800',
        'Отменен': 'bg-red-100 text-red-800'
      }
      
      const className = statusClasses[status.name] || 'bg-gray-100 text-gray-800'
      return `<span class="px-2 py-1 rounded-full text-xs ${className}">${status.name}</span>`
    },
    formatProducts(products) {
      if (!products || products.length === 0) {
        return `<span class="text-gray-500">${this.$t('noProducts')}</span>`
      }
      
      return products.map(product => {
        return `<div class="text-sm"><span class="font-medium">${product.product_name}</span> <span class="text-gray-500">(${product.quantity} ${product.unit_short_name})</span></div>`
      }).join('')
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
      this.$router.push(`/basement/orders/${order.id}/edit`)
    },
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

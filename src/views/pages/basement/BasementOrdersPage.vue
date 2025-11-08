<template>
  <div>
    <!-- Заголовок -->
    <div class="md:flex md:items-center md:justify-between">
      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          {{ $t('orders') }}
        </h2>
      </div>
      <div class="mt-4 flex md:mt-0 md:ml-4 space-x-2">
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
import basementApi from '@/api/basementAxiosInstance'
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue'
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue'
import { formatOrderDate } from '@/utils/dateUtils'

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
          size: 120 
        },
        { 
          name: 'client', 
          label: this.$t('client'), 
          size: 250 
        },
        { 
          name: 'project', 
          label: this.$t('project'), 
          size: 250 
        },
        { 
          name: 'products', 
          label: this.$t('products'), 
          size: 350,
          html: true
        },
        { 
          name: 'created_at', 
          label: this.$t('date'), 
          size: 180 
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
        const { data } = await basementApi.get('/orders')
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
    formatProducts(products) {
      if (!products || products.length === 0) {
        return `<span class="text-gray-500">${this.$t('noProducts')}</span>`
      }
      
      return products.map(product => {
        return `<div class="text-sm"><span class="font-medium">${product.product_name}</span> <span class="text-gray-500">(${product.quantity} ${product.unit_short_name})</span></div>`
      }).join('')
    },
    getClientName(order) {
      if (!order.client) return ''
      
      if (order.client.first_name && order.client.last_name) {
        return `${order.client.first_name} ${order.client.last_name}`
      }
      if (order.client.first_name) {
        return order.client.first_name
      }
      if (order.client.name) {
        return order.client.name
      }
      
      return ''
    },
    getProjectName(order) {
      if (!order.project) return this.$t('notSpecified')
      
      return order.project.name || this.$t('notSpecified')
    },
    editOrder(order) {
      this.$router.push(`/basement/orders/${order.id}/edit`)
    },
    formatOrderDate
  }
}
</script>

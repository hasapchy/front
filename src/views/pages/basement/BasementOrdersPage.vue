<template>
  <div>
    <transition name="fade" mode="out-in">
      <div v-if="!loading" :key="`table-${$i18n.locale}`">
        <DraggableTable 
          table-key="basementOrders"
          :columns-config="columns"
          :table-data="orders"
          :item-mapper="itemMapper"
          :on-item-click="editOrder">
          <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
            <TableControlsBar 
              :show-filters="true"
              :has-active-filters="hasActiveFilters"
              :active-filters-count="getActiveFiltersCount()"
              :on-filters-reset="resetFilters"
              :show-pagination="true"
              :pagination-data="paginationData ? { currentPage: paginationData.currentPage, lastPage: paginationData.lastPage, perPage: perPage, perPageOptions: perPageOptions } : null"
              :on-page-change="fetchOrders" 
              :on-per-page-change="handlePerPageChange"
              :resetColumns="resetColumns"
              :columns="columns"
              :toggleVisible="toggleVisible"
              :log="log">
              <template #left>
                <router-link to="/basement/orders/create">
                  <PrimaryButton
                    icon="fas fa-plus"
                  >
                    {{ $t('createOrder') }}
                  </PrimaryButton>
                </router-link>

                <FiltersContainer 
                  :has-active-filters="hasActiveFilters"
                  :active-filters-count="getActiveFiltersCount()" 
                  @reset="resetFilters" 
                  @apply="applyFilters">
                  <div>
                    <label class="block mb-2 text-xs font-semibold">{{ $t('dateFilter') || 'Период' }}</label>
                    <select v-model="dateFilter" class="w-full">
                      <option value="all_time">{{ $t('allTime') }}</option>
                      <option value="today">{{ $t('today') }}</option>
                      <option value="yesterday">{{ $t('yesterday') }}</option>
                      <option value="this_week">{{ $t('thisWeek') }}</option>
                      <option value="this_month">{{ $t('thisMonth') }}</option>
                      <option value="last_week">{{ $t('lastWeek') }}</option>
                      <option value="last_month">{{ $t('lastMonth') }}</option>
                      <option value="custom">{{ $t('selectDates') }}</option>
                    </select>
                  </div>

                  <div v-if="dateFilter === 'custom'" class="space-y-2">
                    <div>
                      <label class="block mb-2 text-xs font-semibold">{{ $t('startDate') || 'Начальная дата' }}</label>
                      <input type="date" v-model="startDate" class="w-full" />
                    </div>
                    <div>
                      <label class="block mb-2 text-xs font-semibold">{{ $t('endDate') || 'Конечная дата' }}</label>
                      <input type="date" v-model="endDate" class="w-full" />
                    </div>
                  </div>

                  <div>
                    <label class="block mb-2 text-xs font-semibold">{{ $t('project') || 'Проект' }}</label>
                    <select v-model="projectFilter" class="w-full">
                      <option value="">{{ $t('allProjects') }}</option>
                      <option v-for="project in projects" :key="project.id" :value="project.id">
                        {{ project.name }}
                      </option>
                    </select>
                  </div>

                  <!-- Фильтр по клиенту в basement не используется -->
                </FiltersContainer>
              </template>

              <template #right>
                <Pagination 
                  v-if="paginationData" 
                  :currentPage="paginationData.currentPage" 
                  :lastPage="paginationData.lastPage"
                  :per-page="perPage" 
                  :per-page-options="perPageOptions" 
                  :show-per-page-selector="true"
                  @changePage="fetchOrders" 
                  @perPageChange="handlePerPageChange" 
                />
                <TableFilterButton v-if="columns && columns.length" :onReset="resetColumns">
                  <ul>
                    <draggable v-if="columns && columns.length" class="dragArea list-group w-full" :list="columns" @change="log">
                      <li v-for="(element, index) in columns" :key="element.name"
                          @click="toggleVisible(index)"
                          class="flex items-center hover:bg-gray-100 p-2 rounded">
                          <div class="space-x-2 flex flex-row justify-between w-full select-none">
                              <div>
                                  <i class="text-sm mr-2 text-[#337AB7]"
                                      :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"></i>
                                  {{ $te(element.label) ? $t(element.label) : element.label }}
                              </div>
                              <div><i
                                      class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab"></i>
                              </div>
                          </div>
                      </li>
                    </draggable>
                  </ul>
                </TableFilterButton>
              </template>
            </TableControlsBar>
          </template>
        </DraggableTable>
      </div>

      <div v-else key="loader" class="flex justify-center items-center h-64">
        <div class="text-center flex flex-col items-center gap-2">
          <SpinnerIcon />
          <p class="mt-2 text-gray-500">{{ $t('loading') }}</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import BasementOrderController from '@/api/basement/BasementOrderController'
import BasementProjectController from '@/api/basement/BasementProjectController'
import BasementClientController from '@/api/basement/BasementClientController'
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue'
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue'
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue'
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue'
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue'
import Pagination from '@/views/components/app/buttons/Pagination.vue'
import SpinnerIcon from '@/views/components/app/SpinnerIcon.vue'
import filtersMixin from '@/mixins/filtersMixin'
import { VueDraggableNext } from 'vue-draggable-next'
import { formatOrderDate } from '@/utils/dateUtils'

export default {
  name: 'BasementOrdersPage',
  mixins: [filtersMixin],
  components: {
    PrimaryButton,
    DraggableTable,
    TableControlsBar,
    TableFilterButton,
    FiltersContainer,
    Pagination,
    draggable: VueDraggableNext,
    SpinnerIcon
  },
  data() {
    return {
      orders: [],
      loading: true,
      paginationData: null,
      perPage: 20,
      perPageOptions: [10, 20, 50, 100],
      projects: [],
      dateFilter: 'all_time',
      startDate: null,
      endDate: null,
      projectFilter: ''
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
          name: 'category', 
          label: this.$t('category'), 
          size: 200 
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
    await this.fetchProjects()
    await this.fetchOrders(1)
  },
  methods: {
    async fetchProjects() {
      try {
        const projects = await BasementProjectController.getItems(1, { active_only: true })
        this.projects = Array.isArray(projects) ? projects : (projects.items || [])
      } catch (error) {
        this.projects = []
      }
    },
    async fetchOrders(page = 1) {
      this.loading = true
      try {
        const response = await BasementOrderController.getItems(
          page,
          this.perPage,
          null,
          this.dateFilter,
          this.startDate,
          this.endDate,
          null,
          this.projectFilter,
          null
        )
        this.orders = response.items || []
        this.paginationData = {
          currentPage: response.currentPage || page,
          lastPage: response.lastPage || 1,
          total: response.total || 0
        }
      } catch (error) {
        this.orders = []
        this.paginationData = null
      } finally {
        this.loading = false
      }
    },
    applyFilters() {
      this.fetchOrders(1)
    },
    resetFilters() {
      this.dateFilter = 'all_time'
      this.startDate = null
      this.endDate = null
      this.projectFilter = ''
      this.fetchOrders(1)
    },
    getActiveFiltersCount() {
      let count = 0
      if (this.dateFilter !== 'all_time') count++
      if (this.projectFilter !== '') count++
      if (this.startDate !== null && this.startDate !== '') count++
      if (this.endDate !== null && this.endDate !== '') count++
      return count
    },
    handlePerPageChange(newPerPage) {
      this.perPage = newPerPage
      this.fetchOrders(1)
    },
    itemMapper(order, columnName) {
      switch (columnName) {
        case 'id':
          return order.id
        case 'client':
          return this.getClientName(order)
        case 'project':
          return this.getProjectName(order)
        case 'category':
          return this.getCategoryName(order)
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
    getCategoryName(order) {
      if (!order.category && !order.category_name) return this.$t('notSpecified')
      
      return order.category?.name || order.category_name || this.$t('notSpecified')
    },
    editOrder(order) {
      this.$router.push(`/basement/orders/${order.id}/edit`)
    },
    formatOrderDate
  }
}
</script>

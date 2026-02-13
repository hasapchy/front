<template>
  <div>
    <transition name="fade" mode="out-in">
      <div v-if="!loading" :key="`table-${$i18n.locale}`">
        <DraggableTable 
          table-key="simpleOrders"
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
                <PrimaryButton
                  :onclick="() => showModal(null)"
                  icon="fas fa-plus"
                >
                  {{ $t('createOrder') }}
                </PrimaryButton>

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

                  <!-- Фильтр по клиенту в simple не используется -->
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
                      <li v-for="(element, index) in columns" :key="element.name" v-show="element.name !== 'select'"
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

      <div v-else key="loader" class="min-h-64">
        <TableSkeleton />
      </div>
    </transition>

    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose" :widthRatio="0.85">
      <SimpleOrderCreatePage 
        v-if="modalDialog" 
        :key="editingItem ? editingItem.id : 'new-order'" 
        ref="simpleOrderCreatePageForm"
        @saved="handleSaved" 
        @saved-silent="handleSavedSilent" 
        @saved-error="handleSavedError"
        @deleted="handleDeleted" 
        @deleted-error="handleDeletedError" 
        @close-request="closeModal"
        :editingItem="editingItem" 
      />
    </SideModalDialog>
  </div>
</template>

<script>
import OrderController from '@/api/OrderController'
import ProjectController from '@/api/ProjectController'
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue'
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue'
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue'
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue'
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue'
import Pagination from '@/views/components/app/buttons/Pagination.vue'
import TableSkeleton from '@/views/components/app/TableSkeleton.vue'
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue'
import SimpleOrderCreatePage from '@/views/pages/simple/SimpleOrderCreatePage.vue'
import filtersMixin from '@/mixins/filtersMixin'
import modalMixin from '@/mixins/modalMixin'
import notificationMixin from '@/mixins/notificationMixin'
import { VueDraggableNext } from 'vue-draggable-next'
import { formatOrderDate } from '@/utils/dateUtils'

export default {
  name: 'SimpleOrdersPage',
  mixins: [filtersMixin, modalMixin, notificationMixin],
  components: {
    PrimaryButton,
    DraggableTable,
    TableControlsBar,
    TableFilterButton,
    FiltersContainer,
    Pagination,
    draggable: VueDraggableNext,
    TableSkeleton,
    SideModalDialog,
    SimpleOrderCreatePage
  },
  data() {
    return {
      orders: [],
      loading: true,
      paginationData: null,
      perPage: (() => {
        const stored = localStorage.getItem('perPage');
        const parsed = stored ? parseInt(stored, 10) : NaN;
        return Number.isFinite(parsed) && [10, 20, 50, 100].includes(parsed) ? parsed : 20;
      })(),
      perPageOptions: [10, 20, 50, 100],
      projects: [],
      dateFilter: 'all_time',
      startDate: null,
      endDate: null,
      projectFilter: '',
      controller: OrderController,
      savedSuccessText: this.$t('orderSaved'),
      savedErrorText: this.$t('errorSavingOrder'),
      deletedSuccessText: this.$t('orderDeleted'),
      deletedErrorText: this.$t('errorDeletingOrder')
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
          name: 'dateUser', 
          label: this.$t('dateUser'), 
          size: 180 
        }
      ]
    }
  },
  watch: {
    '$route.params.id': {
      immediate: true,
      handler(value) {
        if (value) {
          this.handleRouteItem(value);
        } else {
          if (this.modalDialog) {
            this.closeModal();
          }
          this.editingItem = null;
        }
      }
    }
  },
  async mounted() {
    await this.fetchProjects()
    await this.fetchOrders(1)
    
    if (this.$route.params.id) {
      this.$nextTick(() => {
        this.handleRouteItem(this.$route.params.id);
      });
    }
  },
  methods: {
    async fetchProjects() {
      try {
        const allProjects = await ProjectController.getListItems()
        this.projects = Array.isArray(allProjects) ? allProjects : []
      } catch (error) {
        console.error('Ошибка загрузки проектов:', error)
        this.projects = []
      }
    },
    async fetchOrders(page = 1) {
      this.loading = true
      try {
        const response = await OrderController.getItems(
          page,
          null, // search
          this.dateFilter,
          this.startDate,
          this.endDate,
          '', // statusFilter
          this.projectFilter || '', // projectFilter
          '', // clientFilter
          this.perPage,
          false // unpaidOnly
        )
        this.orders = response.items || []
        this.paginationData = {
          currentPage: response.currentPage || page,
          lastPage: response.lastPage || 1,
          total: response.total || 0
        }
      } catch (error) {
        console.error('Ошибка загрузки заказов:', error)
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
      this.resetFiltersFromConfig({
        dateFilter: 'all_time',
        startDate: null,
        endDate: null,
        projectFilter: ''
      }, () => {
        this.fetchOrders(1);
      });
    },
    getActiveFiltersCount() {
      return this.getActiveFiltersCountFromConfig([
        { value: this.dateFilter, defaultValue: 'all_time' },
        { value: this.projectFilter, defaultValue: '' },
        { value: this.startDate, defaultValue: null },
        { value: this.endDate, defaultValue: null }
      ]);
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
        case 'dateUser':
          const dateStr = this.formatOrderDate(order.createdAt)
          const userName = order.userName || '-'
          return `${dateStr} / ${userName}`
        default:
          return order[columnName] || '-'
      }
    },
    formatProducts(products) {
      if (!products?.length) {
        return `<span class="text-gray-500">${this.$t('noProducts')}</span>`
      }
      
      return products.map(product => {
        return `<div class="text-sm"><span class="font-medium">${product.productName}</span> <span class="text-gray-500">(${product.quantity} ${product.unitShortName})</span></div>`
      }).join('')
    },
    getClientName(order) {
      if (!order.client) return ''
      
      if (order.client.firstName && order.client.lastName) {
        return `${order.client.firstName} ${order.client.lastName}`
      }
      if (order.client.firstName) {
        return order.client.firstName
      }
      if (order.client.name) {
        return order.client.name
      }
      
      return ''
    },
    getProjectName(order) {
      return order.projectName || this.$t('notSpecified')
    },
    getCategoryName(order) {
      return order.categoryName || this.$t('notSpecified')
    },
    editOrder(order) {
      if (!order?.id) {
        return;
      }
      this.showModal(order);
    },
    async handleRouteItem(id) {
      if (!id) {
        if (this.modalDialog) {
          this.closeModal();
        }
        this.editingItem = null;
        return;
      }
      const itemId = Number(id);
      if (!itemId) {
        this.$router.replace({ name: 'SimpleOrders' });
        return;
      }
      if (this.editingItem?.id === itemId && this.modalDialog) {
        return;
      }
      try {
        const item = await OrderController.getItem(itemId);
        if (!item) {
          this.showNotification(this.$t('errorGettingOrder'), this.$t('notFound'), true);
          this.$router.replace({ name: 'SimpleOrders' });
          return;
        }
        this.showModal(item);
      } catch (error) {
        this.showNotification(this.$t('errorGettingOrder'), error.message, true);
        this.$router.replace({ name: 'SimpleOrders' });
      }
    },
    handleSaved() {
      this.showNotification(this.savedSuccessText, "", false);
      this.closeModal();
      this.fetchOrders(this.paginationData?.currentPage || 1);
    },
    handleSavedSilent() {
      this.showNotification(this.savedSuccessText, "", false);
      this.fetchOrders(this.paginationData?.currentPage || 1);
    },
    handleSavedError(error) {
      this.showNotification(this.savedErrorText, error, true);
    },
    handleDeleted() {
      this.showNotification(this.deletedSuccessText, "", false);
      this.closeModal();
      this.fetchOrders(this.paginationData?.currentPage || 1);
    },
    handleDeletedError(error) {
      this.showNotification(this.deletedErrorText, error, true);
    },
    closeModal(skipScrollRestore = false) {
      modalMixin.methods.closeModal.call(this, skipScrollRestore);
      if (this.$route.params.id) {
        this.$router.replace({ name: 'SimpleOrders' });
      }
      this.editingItem = null;
    },
    formatOrderDate
  }
}
</script>

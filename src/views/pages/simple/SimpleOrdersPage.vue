<template>
  <div>
    <transition
      name="fade"
      mode="out-in"
    >
      <CardListViewShell
        v-if="!loading && (displayViewMode === 'table' || displayViewMode === 'cards')"
        :key="cardListShellKey"
        :display-view-mode="displayViewMode"
        :cards-toolbar="simpleOrdersCardsToolbar"
      >
        <template #table>
          <DraggableTable
            table-key="simpleOrders"
            :columns-config="columns"
            :table-data="data?.items ?? []"
            :item-mapper="itemMapper"
            :on-item-click="editOrder"
          >
            <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
              <TableControlsBar
                :show-pagination="true"
                :pagination-data="paginationData"
                :on-page-change="fetchItems"
                :on-per-page-change="handlePerPageChange"
                :reset-columns="resetColumns"
                :columns="columns"
                :toggle-visible="toggleVisible"
                :log="log"
              >
                <template #left>
                  <PrimaryButton
                    :onclick="() => showModal(null)"
                    icon="fas fa-plus"
                  >
                    {{ $t('createOrder') }}
                  </PrimaryButton>
                  <ViewModeToggle
                    :view-mode="displayViewMode"
                    :show-kanban="false"
                    :show-cards="true"
                    @change="changeViewMode"
                  />
                </template>
                <template #filters-desktop>
                  <FiltersContainer
                    :has-active-filters="hasActiveFilters"
                    :active-filters-count="getActiveFiltersCount()"
                    @reset="resetFilters"
                    @apply="applyFilters"
                  >
                    <div>
                      <label class="filters-modal-label">{{ $t('dateFilter') }}</label>
                      <select
                        v-model="dateFilter"
                        class="w-full"
                      >
                        <option value="all_time">
                          {{ $t('allTime') }}
                        </option>
                        <option value="today">
                          {{ $t('today') }}
                        </option>
                        <option value="yesterday">
                          {{ $t('yesterday') }}
                        </option>
                        <option value="this_week">
                          {{ $t('thisWeek') }}
                        </option>
                        <option value="this_month">
                          {{ $t('thisMonth') }}
                        </option>
                        <option value="last_week">
                          {{ $t('lastWeek') }}
                        </option>
                        <option value="last_month">
                          {{ $t('lastMonth') }}
                        </option>
                        <option value="custom">
                          {{ $t('selectDates') }}
                        </option>
                      </select>
                    </div>

                    <div
                      v-if="dateFilter === 'custom'"
                      class="space-y-2"
                    >
                      <div>
                        <label class="filters-modal-label">{{ $t('startDate') }}</label>
                        <input
                          v-model="startDate"
                          type="date"
                          class="w-full"
                        >
                      </div>
                      <div>
                        <label class="filters-modal-label">{{ $t('endDate') }}</label>
                        <input
                          v-model="endDate"
                          type="date"
                          class="w-full"
                        >
                      </div>
                    </div>

                    <div>
                      <label class="filters-modal-label">{{ $t('project') }}</label>
                      <select
                        v-model="projectFilter"
                        class="w-full"
                      >
                        <option value="">
                          {{ $t('allProjects') }}
                        </option>
                        <option
                          v-for="project in projects"
                          :key="project.id"
                          :value="project.id"
                        >
                          {{ project.name }}
                        </option>
                      </select>
                    </div>
                  </FiltersContainer>
                </template>

                <template #gear="{ resetColumns, columns, toggleVisible, log }">
                  <TableFilterButton
                    v-if="columns && columns.length"
                    :on-reset="resetColumns"
                  >
                    <TableColumnDateModeSection
                      :items="dateColumnsForSettings(columns)"
                      :resolve-mode="resolveColumnDateMode"
                      @set-mode="(item, mode) => setColumnDateDisplayMode(columns, item.index, mode)"
                    />
                    <ul>
                      <draggable
                        v-if="columns.length"
                        class="dragArea list-group w-full"
                        :list="columns"
                        @change="log"
                      >
                        <li
                          v-for="(element, index) in columns"
                          v-show="element.name !== 'select'"
                          :key="element.name"
                          class="flex items-center hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)] p-2 rounded"
                          @click="toggleVisible(index)"
                        >
                          <div class="space-x-2 flex flex-row justify-between w-full select-none">
                            <div>
                              <i
                                class="text-sm mr-2 text-[var(--color-info)]"
                                :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"
                              />
                              {{ $te(element.label) ? $t(element.label) : element.label }}
                            </div>
                            <div>
                              <i
                                class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab"
                              />
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
        </template>
        <template #card-bar-left>
          <PrimaryButton
            :onclick="() => showModal(null)"
            icon="fas fa-plus"
          >
            {{ $t('createOrder') }}
          </PrimaryButton>
          <ViewModeToggle
            :view-mode="displayViewMode"
            :show-kanban="false"
            :show-cards="true"
            @change="changeViewMode"
          />
        </template>
        <template #card-bar-filters-desktop>
          <FiltersContainer
            :has-active-filters="hasActiveFilters"
            :active-filters-count="getActiveFiltersCount()"
            @reset="resetFilters"
            @apply="applyFilters"
          >
            <div>
              <label class="filters-modal-label">{{ $t('dateFilter') }}</label>
              <select
                v-model="dateFilter"
                class="w-full"
              >
                <option value="all_time">
                  {{ $t('allTime') }}
                </option>
                <option value="today">
                  {{ $t('today') }}
                </option>
                <option value="yesterday">
                  {{ $t('yesterday') }}
                </option>
                <option value="this_week">
                  {{ $t('thisWeek') }}
                </option>
                <option value="this_month">
                  {{ $t('thisMonth') }}
                </option>
                <option value="last_week">
                  {{ $t('lastWeek') }}
                </option>
                <option value="last_month">
                  {{ $t('lastMonth') }}
                </option>
                <option value="custom">
                  {{ $t('selectDates') }}
                </option>
              </select>
            </div>
            <div
              v-if="dateFilter === 'custom'"
              class="space-y-2"
            >
              <div>
                <label class="filters-modal-label">{{ $t('startDate') }}</label>
                <input
                  v-model="startDate"
                  type="date"
                  class="w-full"
                >
              </div>
              <div>
                <label class="filters-modal-label">{{ $t('endDate') }}</label>
                <input
                  v-model="endDate"
                  type="date"
                  class="w-full"
                >
              </div>
            </div>
            <div>
              <label class="filters-modal-label">{{ $t('project') }}</label>
              <select
                v-model="projectFilter"
                class="w-full"
              >
                <option value="">
                  {{ $t('allProjects') }}
                </option>
                <option
                  v-for="project in projects"
                  :key="project.id"
                  :value="project.id"
                >
                  {{ project.name }}
                </option>
              </select>
            </div>
          </FiltersContainer>
        </template>
        <template #card-bar-gear>
          <CardFieldsGearMenu
            :card-fields="cardFields"
            :on-reset="resetCardFields"
            @toggle="toggleCardFieldVisible"
          />
        </template>
        <template #cards>
          <MapperCardGrid
            class="mt-4"
            :items="data?.items ?? []"
            :card-config="cardConfigMerged"
            :card-mapper="simpleOrderCardMapper"
            title-field="title"
            title-subtitle-field="dateUser"
            :title-prefix="simpleOrderCardTitlePrefix"
            :show-checkbox="false"
            @dblclick="editOrder"
          />
        </template>
      </CardListViewShell>

      <div
        v-else
        key="loader"
        class="min-h-64"
      >
        <TableSkeleton v-if="displayViewMode === 'table'" />
        <CardsSkeleton v-else />
      </div>
    </transition>

    <SideModalDialog
      :show-form="modalDialog"
      :title="sideModalCrudTitle('sideModalGenOrder', 'sideModalNomOrder')"
      :onclose="handleModalClose"
    >
      <SimpleOrderCreatePage
        v-if="modalDialog"
        :key="editingItem ? editingItem.id : 'new-order'"
        ref="simpleOrderCreatePageForm"
        :editing-item="editingItem"
        @saved="handleSaved"
        @saved-error="handleSavedError"
        @deleted="handleDeleted"
        @deleted-error="handleDeletedError"
        @close-request="closeModal"
      />
    </SideModalDialog>
  </div>
</template>

<script>
import OrderController from '@/api/OrderController'
import ProjectController from '@/api/ProjectController'
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue'
import ProductsListCell from '@/views/components/app/buttons/ProductsListCell.vue'
import DateUserCell from '@/views/components/app/buttons/DateUserCell.vue'
import { buildDateUserCellProps } from '@/utils/userCellUtils'
import { markRaw } from 'vue'
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue'
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue'
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue'
import TableColumnDateModeSection from '@/views/components/app/forms/TableColumnDateModeSection.vue'
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue'
import TableSkeleton from '@/views/components/app/TableSkeleton.vue'
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue'
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue'
import SimpleOrderCreatePage from '@/views/pages/simple/SimpleOrderCreatePage.vue'
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue'
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue'
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue'
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue'
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin'
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin'
import modalMixin from '@/mixins/modalMixin'
import notificationMixin from '@/mixins/notificationMixin'
import crudEventMixin from '@/mixins/crudEventMixin'
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin'
import { VueDraggableNext } from 'vue-draggable-next'
import { formatOrderDate } from '@/utils/dateUtils'
import { formatQuantity, formatCurrencyForDisplay } from '@/utils/numberUtils'

import listQueryMixin from '@/mixins/listQueryMixin'
import tableColumnDateModeMixin from '@/mixins/tableColumnDateModeMixin'
const simpleOrdersViewModeMixin = createStoreViewModeMixin({
  listPageKey: 'simpleOrders',
  modes: ['table', 'cards'],
})

export default {
  name: 'SimpleOrdersPage',
  components: {
    PrimaryButton,
    DraggableTable,
    TableControlsBar,
    TableFilterButton,
    TableColumnDateModeSection,
    FiltersContainer,
    draggable: VueDraggableNext,
    TableSkeleton,
    CardsSkeleton,
    SideModalDialog,
    SimpleOrderCreatePage,
    ViewModeToggle,
    MapperCardGrid,
    CardListViewShell,
    CardFieldsGearMenu,
  },
  mixins: [listQueryMixin, modalMixin, notificationMixin, crudEventMixin, getApiErrorMessageMixin, cardFieldsVisibilityMixin, simpleOrdersViewModeMixin, tableColumnDateModeMixin],
  data() {
    return {
      tableColumnsPersistKey: 'simpleOrders',
      cardFieldsKey: 'simpleOrders.cards',
      loading: true,
      projects: [],
      dateFilter: 'all_time',
      startDate: null,
      endDate: null,
      projectFilter: '',
      controller: OrderController,
      cacheInvalidationType: 'orders',
      savedSuccessText: this.$t('orderSaved'),
      savedErrorText: this.$t('errorSavingOrder'),
      deletedSuccessText: this.$t('orderDeleted'),
      deletedErrorText: this.$t('errorDeletingOrder')
    }
  },
  computed: {
    paginationData() {
      if (!this.data) return null
      return {
        currentPage: this.data.currentPage,
        lastPage: this.data.lastPage,
        perPage: this.perPage,
        perPageOptions: this.perPageOptions,
      }
    },
    simpleOrdersCardsToolbar() {
      return {
        showFilters: true,
        hasActiveFilters: this.hasActiveFilters,
        activeFiltersCount: this.getActiveFiltersCount(),
        onFiltersReset: this.resetFilters,
        showPagination: true,
        paginationData: this.paginationData,
        onPageChange: this.fetchItems,
        onPerPageChange: this.handlePerPageChange,
      }
    },
    cardConfigBase() {
      return [
        { name: 'title', label: null },
        { name: 'client', label: this.$t('client'), icon: 'fas fa-user text-[#3571A4]' },
        { name: 'project', label: this.$t('project'), icon: 'fas fa-briefcase text-[#3571A4]' },
        { name: 'category', label: this.$t('category'), icon: 'fas fa-folder text-[#3571A4]' },
        { name: 'totalPrice', label: this.$t('totalPrice'), icon: 'fas fa-money-bill text-[#3571A4]' },
        { name: 'products', label: this.$t('products'), icon: 'fas fa-boxes text-[#3571A4]', html: true },
      ]
    },
    cardConfigMerged() {
      const title = { name: 'title', label: null }
      const rest = (this.cardFields || []).map((f) => ({ ...f, visible: f.visible }))
      return [title, ...rest]
    },
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
          name: 'totalPrice',
          label: this.$t('totalPrice'),
          size: 140
        },
        {
          name: 'products',
          label: this.$t('products'),
          size: 350,
          component: markRaw(ProductsListCell),
          props: (order) => ({
            products: order.products || [],
          }),
        },
        {
          name: 'dateUser',
          label: this.$t('dateUser'),
          size: 180,
          component: markRaw(DateUserCell),
          props: (order) => buildDateUserCellProps(order, ''),
        }
      ]
    },
  },
  watch: {
    '$route.params.id': {
      immediate: true,
      handler(value) {
        if (value) {
          this.handleRouteItem(value)
        } else {
          if (this.modalDialog) {
            this.closeModal()
          }
          this.editingItem = null
        }
      }
    }
  },
  async mounted() {
    await this.fetchProjects()
    await this.fetchItems(1)
  },
  methods: {
    simpleOrderCardTitlePrefix() {
      return '<i class="fas fa-shopping-cart text-[#3571A4] mr-1.5 flex-shrink-0"></i>'
    },
    simpleOrderCardMapper(order, fieldName) {
      if (!order) return ''
      if (fieldName === 'title') {
        return `${this.$t('order')} #${order.id}`
      }
      if (fieldName === 'products') {
        return this.formatProducts(order.products)
      }
      return this.itemMapper(order, fieldName) ?? ''
    },
    async fetchProjects() {
      try {
        const allProjects = await ProjectController.getListItems()
        this.projects = Array.isArray(allProjects) ? allProjects : []
      } catch (error) {
        console.error('Ошибка загрузки проектов:', error)
        this.projects = []
      }
    },
    async fetchItems(page = 1, silent = false) {
      if (!silent) {
        this.loading = true
      }
      try {
        const response = await OrderController.getItems(
          page,
          null,
          this.dateFilter,
          this.startDate,
          this.endDate,
          '',
          this.projectFilter,
          '',
          '',
          this.perPage
        )
        this.data = response
      } catch (error) {
        console.error('Ошибка загрузки заказов:', error)
        this.data = null
      } finally {
        if (!silent) {
          this.loading = false
        }
      }
    },
    resetFilters() {
      this.resetFiltersFromConfig({
        dateFilter: 'all_time',
        startDate: null,
        endDate: null,
        projectFilter: ''
      }, () => {
        this.fetchItems(1)
      })
    },
    getActiveFiltersCount() {
      return this.getActiveFiltersCountFromConfig([
        { value: this.dateFilter, defaultValue: 'all_time' },
        { value: this.projectFilter, defaultValue: '' },
        { value: this.dateFilter === 'custom' ? this.startDate : null, defaultValue: null },
        { value: this.dateFilter === 'custom' ? this.endDate : null, defaultValue: null }
      ])
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
        case 'totalPrice':
          return order.priceInfo()
        case 'products':
          return (order.products || []).length
        case 'dateUser': {
          const dateStr = this.formatOrderDate(order.createdAt)
          const userName = order.creator?.name
          return `${dateStr} / ${userName}`
        }
        default:
          return order[columnName]
      }
    },
    formatProducts(products) {
      if (!products?.length) {
        return `<span class="text-gray-500">${this.$t('noProducts')}</span>`
      }

      return products.map(product => {
        return `<div class="text-sm"><span class="font-medium">${product.productName}</span> <span class="text-gray-500">(${formatQuantity(product.quantity)} ${product.unitShortName})</span></div>`
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
      return order.client.clientName || ''
    },
    getProjectName(order) {
      return order.project?.name || order.projectName || ''
    },
    getCategoryName(order) {
      return order.category?.name || order.categoryName || ''
    },
    formatOrderDate,
    async editOrder(order) {
      if (!order?.id) return
      await this.showModal(order)
    },
  },
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
      <!-- Форма создания заказа -->
      <div>
        <form
          class="space-y-6"
          @submit.prevent="createOrder"
        >
          <div class="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-5 shadow-sm sm:p-6">
            <div class="grid grid-cols-1 gap-6">
              <!-- Клиент и Проект в одной строке -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Клиент -->
                <div class="flex flex-col gap-2">
                  <ClientSearch
                    :selected-client="selectedClient"
                    @update:selected-client="onClientSelected"
                  />
                </div>

                <!-- Проект -->
                <div>
                  <label class="block text-sm font-medium text-[var(--text-primary)]">{{ $t('project') }}</label>
                  <select 
                    v-model="form.projectId" 
                    :disabled="isProjectLocked"
                    class="mt-1 block w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--nav-accent)]/35 sm:text-sm"
                    :class="{ 'cursor-not-allowed bg-[var(--surface-muted)] opacity-90': isProjectLocked }"
                  >
                    <option value="">
                      {{ $t('no') }}
                    </option>
                    <option
                      v-for="project in allProjects"
                      :key="project.id"
                      :value="project.id"
                    >
                      {{ project.name }}
                    </option>
                  </select>
                  <p
                    v-if="isProjectLocked"
                    class="mt-1 text-xs text-[var(--text-secondary)]"
                  >
                    Проект нельзя указать, если он не был указан при создании заказа
                  </p>
                </div>
              </div>

              <!-- Услуги на всю ширину -->
              <div>
                <SimpleServicesRow
                  v-model="form.products"
                  :project-id="form.projectId"
                  :document-currency-id="form.currencyId"
                />
              </div>

              <!-- Товары на складе -->
              <div>
                <SimpleProductSearch
                  v-model="form.products"
                  :show-quantity="true"
                  :only-products="true"
                  :required="true"
                  :project-id="form.projectId"
                  :document-currency-id="form.currencyId"
                />
              </div>

              <!-- Остатки (товары с бесконечным остатком) -->
              <div>
                <SimpleStockSearch
                  v-model="form.stockItems"
                  :show-quantity="true"
                  :project-id="form.projectId"
                />
              </div>

              <!-- Таблица товаров -->
              <div>
                <label class="mb-4 block text-sm font-medium text-[var(--text-primary)]">
                  {{ $t('orderItems') }}
                </label>
                <DraggableTable
                  v-if="allOrderItems.length > 0"
                  table-key="simpleOrderItems"
                  :columns-config="productTableColumns"
                  :table-data="allOrderItems"
                  :item-mapper="productItemMapper"
                  :show-actions="false"
                />
                <CardViewEmptyState v-else />
              </div>

              <!-- Примечание -->
              <div>
                <label class="block text-sm font-medium text-[var(--text-primary)]">
                  {{ $t('note') }}
                </label>
                <div class="mt-1">
                  <textarea
                    v-model="form.note"
                    rows="3"
                    class="block w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--nav-accent)]/35 sm:text-sm"
                    :placeholder="$t('orderNotePlaceholder')"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Итоговая сумма -->
          <div class="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-4 py-5 shadow-sm sm:p-6">
            <div class="flex items-center justify-between">
              <span class="text-lg font-semibold text-[var(--text-primary)]">{{ $t('total') }}:</span>
              <span class="text-2xl font-bold text-[var(--label-accent)]">{{ formatTotalAmount() }} m</span>
            </div>
          </div>
        </form>
      </div>
    </div>

    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center justify-between gap-4 md:flex-nowrap">
        <div class="flex items-center space-x-2">
          <PrimaryButton
            icon="fas fa-save"
            :onclick="isEditing ? updateOrder : createOrder"
            :is-loading="loading"
            :disabled="!canSave"
            :aria-label="$t('save')"
          />
          <PrimaryButton
            v-if="isEditing && (orderId || editingItem?.id)"
            :onclick="showDeleteDialog"
            :is-danger="true"
            :is-loading="deleteLoading"
            icon="fas fa-trash"
          />
        </div>

        <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-[var(--text-primary)] md:flex-nowrap">
          <div>{{ $t('total') }}: <span class="font-bold">{{ formatTotalAmount() }}</span></div>
        </div>
      </div>
    </teleport>

    <!-- Диалог подтверждения удаления -->
    <AlertDialog 
      :dialog="deleteDialog" 
      :descr="$t('confirmDelete')" 
      :confirm-text="$t('delete')" 
      :leave-text="$t('cancel')"
      @confirm="deleteOrder" 
      @leave="closeDeleteDialog" 
    />
  </div>
</template>

<script>
import OrderController from '@/api/OrderController'
import OrderProductDto from '@/dto/order/OrderProductDto'
import ProjectController from '@/api/ProjectController'
import CashRegisterController from '@/api/CashRegisterController'
import WarehouseController from '@/api/WarehouseController'
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue'
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue'
import ClientSearch from '@/views/components/app/search/ClientSearch.vue'
import SimpleProductSearch from '@/views/components/simple/SimpleProductSearch.vue'
import SimpleStockSearch from '@/views/components/simple/SimpleStockSearch.vue'
import SimpleServicesRow from '@/views/components/simple/SimpleServicesRow.vue'
import CardViewEmptyState from '@/views/components/app/cards/CardViewEmptyState.vue'
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue'
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin'
import crudEventMixin from '@/mixins/crudEventMixin'
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue'
import { formatNumber, formatQuantity } from '@/utils/numberUtils'

export default {
  name: 'SimpleOrderCreatePage',
  components: {
    PrimaryButton,
    DraggableTable,
    ClientSearch,
    SimpleProductSearch,
    SimpleStockSearch,
    SimpleServicesRow,
    CardViewEmptyState,
    AlertDialog
  },
  mixins: [getApiErrorMessage, crudEventMixin, sideModalFooterPortal],
  props: {
    editingItem: {
      type: Object,
      default: null
    }
  },
  emits: ['saved', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
  data() {
    return {
      form: {
        clientId: '',
        projectId: '',
        products: [],
        stockItems: [], // Товары с бесконечным остатком (temp_products)
        note: '',
        cashId: 1,
        currencyId: null,
        warehouseId: 1,
        categoryId: null // Категория заказа (определяется по пользователю)
      },
      selectedClient: null,
      allProjects: [],
      loading: false,
      deleteLoading: false,
      deleteDialog: false,
      originalProjectId: null,
      cashRegisters: [],
      // Тексты для уведомлений
      savedSuccessText: 'Заказ успешно создан',
      savedErrorText: 'Ошибка создания заказа',
      deletedSuccessText: 'Заказ успешно удален',
      deletedErrorText: 'Ошибка удаления заказа'
    }
  },
  computed: {
    orderId() {
      return this.$route.params.id && this.$route.params.id !== 'undefined' ? this.$route.params.id : null
    },
    isEditing() {
      return !!this.editingItem || !!this.orderId
    },
    isProjectLocked() {
      return this.isEditing && (this.originalProjectId === null || this.originalProjectId === '')
    },
    hasValidProducts() {
      // Проверяем, что есть товары с количеством больше 0
      const hasProductsWithQuantity = this.form.products && this.form.products.some(p => 
        p.quantity && p.quantity > 0
      )
      const hasStockItemsWithQuantity = this.form.stockItems && this.form.stockItems.some(item => 
        item.quantity && item.quantity > 0
      )
      
      return hasProductsWithQuantity || hasStockItemsWithQuantity
    },
    canSave() {
      return this.form.clientId && 
             this.form.warehouseId && 
             this.hasValidProducts && 
             !this.loading
    },
    totalAmount() {
      // Подсчитываем итоговую сумму по всем товарам и услугам
      let total = 0;
      
      // Суммируем товары
      if (this.form.products && this.form.products.length > 0) {
        total += this.form.products.reduce((sum, product) => {
          const quantity = Number(product.quantity) || 0;
          const price = Number(product.price) || 0;
          return sum + (quantity * price);
        }, 0);
      }
      
      // Суммируем остатки (stockItems)
      if (this.form.stockItems && this.form.stockItems.length > 0) {
        total += this.form.stockItems.reduce((sum, item) => {
          const quantity = Number(item.quantity) || 0;
          const price = Number(item.price) || 0;
          return sum + (quantity * price);
        }, 0);
      }
      
      return total;
    },
    // Объединенные товары для таблицы
    allOrderItems() {
      const items = []
      
      // Добавляем обычные товары
      if (this.form.products && this.form.products.length > 0) {
        this.form.products.forEach((product, index) => {
          if (product.quantity && product.quantity > 0) {
            items.push({
              id: `product_${product.productId}_${index}`,
              type: 'product',
              name: product.name || product.productName,
              quantity: product.quantity,
              price: product.price || 0,
              unit: product.unit || product.unitName ,
              total: (product.quantity || 0) * (product.price || 0),
              originalIndex: index,
              originalProduct: product
            })
          }
        })
      }
      
      // Добавляем товары с бесконечным остатком (stockItems)
      if (this.form.stockItems && this.form.stockItems.length > 0) {
        this.form.stockItems.forEach((item, index) => {
          if (item.quantity && item.quantity > 0) {
            items.push({
              id: `stock_${index}`,
              type: 'stock',
              name: item.name,
              quantity: item.quantity,
              price: item.price || 0,
              unit: item.unitShortName ,
              total: (item.quantity || 0) * (item.price || 0),
              originalIndex: index,
              originalItem: item
            })
          }
        })
      }
      
      return items
    },
    // Конфигурация колонок для таблицы товаров
    productTableColumns() {
      return [
        { 
          name: 'name', 
          label: this.$t('product'), 
          size: 300 
        },
        { 
          name: 'quantity', 
          label: this.$t('quantity'), 
          size: 120 
        },
        { 
          name: 'unit', 
          label: this.$t('unit'), 
          size: 80 
        },
        { 
          name: 'price', 
          label: this.$t('price'), 
          size: 120 
        },
        { 
          name: 'total', 
          label: this.$t('total'), 
          size: 120 
        }
      ]
    }
  },
  watch: {
    editingItem: {
      handler() {
        this.initializeForm()
      },
      immediate: true
    },
    orderId: {
      handler(newVal) {
        if (newVal) {
          this.initializeForm()
        }
      },
      immediate: true
    },
  },
  async mounted() {
    await Promise.all([
      this.loadCashRegisters(),
      this.loadWarehouses(),
      this.loadProjects()
    ]);
    await this.initializeForm();
  },
  methods: {
    async loadCashRegisters() {
      try {
        const data = await CashRegisterController.getListItems();
        this.cashRegisters = data;
        const first = data[0];
        if (first) {
          this.form.cashId = first.id;
          this.form.currencyId = first.currencyId ?? null;
        }
      } catch {
        this.cashRegisters = [];
        this.form.cashId = 1;
        this.form.currencyId = null;
      }
    },
    async loadWarehouses() {
      try {
        const response = await WarehouseController.getAll();
        const data = Array.isArray(response) ? response : (response.items || []);
        
        if (data && data.length > 0) {
          // Автоматически выбираем первый склад
          this.form.warehouseId = data[0].id;
        }
      } catch {
        // Устанавливаем значение по умолчанию если API недоступен
        this.form.warehouseId = 1;
      }
    },
    async loadProjects() {
      try {
        const allProjects = await ProjectController.getListItems();
        this.allProjects = Array.isArray(allProjects) ? allProjects : [];
      } catch {
        this.allProjects = [];
      }
    },
    onClientSelected(client) {
      this.selectedClient = client
      this.form.clientId = client ? client.id : null
    },
    async createOrder() {
      this.loading = true

      // Проверяем обязательные поля
      const validationErrors = []
      
      // Требуем клиента всегда
      if (!this.form.clientId) {
        validationErrors.push('• Укажите клиента')
      }
      
      if (!this.form.warehouseId) {
        validationErrors.push('• Выберите склад')
      }
      
      // Проверяем, что есть товары с количеством больше 0
      const hasValidProducts = this.hasValidProducts
      
      if (!hasValidProducts) {
        validationErrors.push('• Добавьте товары с количеством больше 0')
      }
      
      if (validationErrors.length > 0) {
        this.$store.dispatch('showNotification', { 
          title: 'Заполните обязательные поля', 
          subtitle: validationErrors.join('\n'), 
          isDanger: true 
        })
        this.loading = false
        return
      }

      try {
        // Все товары и услуги сохраняются в order_products (фильтруем товары с количеством 0)
        const validProducts = this.form.products
          .filter(p => p.quantity && p.quantity > 0) // Убираем товары с нулевым количеством
          .map(p => ({
            productId: p.productId,
            quantity: p.quantity,
            price: p.price || 0,
            width: p.width || null,
            height: p.height || null
          }))
        
        // Остатки (товары с бесконечным остатком) сохраняются как temp_products (фильтруем товары с количеством 0)
        const tempProducts = this.form.stockItems
          .filter(item => item.quantity && item.quantity > 0) // Убираем товары с нулевым количеством
          .map(item => ({
            name: item.name,
            description: item.description ,
            quantity: item.quantity,
            price: item.price || 0,
            unitId: item.unitId ?? null,
            unitShortName: item.unitShortName ?? null,
            width: item.width || null,
            height: item.height || null,
          }))
        
        const orderData = {
          clientId: this.form.clientId || null,
          projectId: this.form.projectId || null,
          cashId: this.form.cashId,
          warehouseId: this.form.warehouseId,
          currencyId: this.form.currencyId,
          categoryId: this.form.categoryId, // Категория заказа
          note: this.form.note ,
          products: validProducts,
          tempProducts: tempProducts
        }

        const data = await OrderController.storeItem(orderData)
        
        // Эмитим событие для родительского компонента (модалка)
        this.$emit('saved', data)
      } catch (error) {
        // Эмитим событие об ошибке
        const errorMessage = this.getApiErrorMessage(error)
        this.$emit('saved-error', errorMessage)
      } finally {
        this.loading = false
      }
    },
    async updateOrder() {
      this.loading = true

      const validationErrors = []
      
      // Требуем клиента всегда
      if (!this.form.clientId) {
        validationErrors.push('• Укажите клиента')
      }
      
      if (!this.form.warehouseId) {
        validationErrors.push('• Выберите склад')
      }
      
      const hasValidProducts = this.hasValidProducts
      
      if (!hasValidProducts) {
        validationErrors.push('• Добавьте товары с количеством больше 0')
      }
      
      if (validationErrors.length > 0) {
        this.$store.dispatch('showNotification', { 
          title: 'Заполните обязательные поля', 
          subtitle: validationErrors.join('\n'), 
          isDanger: true 
        })
        this.loading = false
        return
      }

      try {
        // Все товары и услуги сохраняются в order_products
        const validProducts = this.form.products.map(p => ({
          id: p.id || null,
          productId: p.productId,
          quantity: Math.max(p.quantity || 0, 0),
          price: p.price || 0,
          width: p.width || null,
          height: p.height || null
        }))
        
        // Остатки (товары с бесконечным остатком) сохраняются как temp_products (фильтруем товары с количеством 0)
        const tempProducts = this.form.stockItems
          .filter(item => item.quantity && item.quantity > 0)
          .map(item => ({
            id: item.id || null,
            name: item.name,
            description: item.description ,
            quantity: item.quantity,
            price: item.price || 0,
            unitId: item.unitId ?? null,
            unitShortName: item.unitShortName ?? null,
            width: item.width || null,
            height: item.height || null,
          }))
        
        const projectId = this.isProjectLocked ? null : (this.form.projectId || null)
        
        const orderData = {
          clientId: this.form.clientId || null,
          projectId: projectId,
          cashId: this.form.cashId,
          warehouseId: this.form.warehouseId,
          currencyId: this.form.currencyId,
          categoryId: this.form.categoryId,
          note: this.form.note ,
          products: validProducts,
          tempProducts: tempProducts
        }
        
        const orderId = this.editingItem?.id || (this.orderId ? parseInt(this.orderId) : null)
        
        if (!orderId) {
          throw new Error('ID заказа не найден')
        }
        
        const data = await OrderController.updateItem(orderId, orderData)
        
        // Эмитим событие для родительского компонента (модалка)
        this.$emit('saved', data)
      } catch (error) {
        // Эмитим событие об ошибке
        const errorMessage = this.getApiErrorMessage(error)
        this.$emit('saved-error', errorMessage)
      } finally {
        this.loading = false
      }
    },
    closeModal() {
      // Всегда эмитим событие для закрытия модалки
      this.$emit('close-request')
    },
    handleCloseRequest() {
      // Метод для совместимости с modalMixin
      this.closeModal()
    },
    showDeleteDialog() {
      this.deleteDialog = true
    },
    closeDeleteDialog() {
      this.deleteDialog = false
    },
    async deleteOrder() {
      this.closeDeleteDialog()
      
      const orderId = this.editingItem?.id || (this.orderId ? parseInt(this.orderId) : null)
      
      if (!orderId) {
        return
      }

      this.deleteLoading = true
      try {
        await OrderController.deleteItem(orderId)
        
        // Эмитим событие для родительского компонента (модалка)
        this.$emit('deleted')
      } catch (error) {
        const errorMessage = this.getApiErrorMessage(error)
        this.$emit('deleted-error', errorMessage)
      } finally {
        this.deleteLoading = false
      }
    },
    async initializeForm() {
      if (this.editingItem) {
        // Заполняем форму данными для редактирования из prop
        this.fillFormWithOrderData(this.editingItem)
      } else if (this.orderId) {
        // Загружаем данные заказа по ID из роута
        try {
          const orderData = await OrderController.getItem(parseInt(this.orderId))
          this.fillFormWithOrderData(orderData)
        } catch {
          // Если загрузка через роут не удалась, просто закрываем
          if (this.orderId) {
            this.$router.push('/simple-orders')
          } else {
            this.$emit('close-request')
          }
        }
      } else {
        // Создание нового заказа - сбрасываем форму
        const firstCash = this.cashRegisters[0];
        this.form = {
          clientId: '',
          projectId: '',
          products: [],
          stockItems: [],
          note: '',
          cashId: firstCash?.id ?? 1,
          currencyId: firstCash?.currencyId ?? null,
          warehouseId: 1,
          categoryId: null
        }
        this.selectedClient = null
        this.originalProjectId = null
      }
    },
    fillFormWithOrderData(orderData) {
      // Заполняем форму данными заказа
      this.form.clientId = orderData.clientId 
      this.form.projectId = orderData.projectId 
      this.originalProjectId = orderData.projectId || null
      this.form.cashId = orderData.cashId || 1
      this.form.currencyId = orderData.currencyId ?? orderData.currency_id ?? null
      this.form.warehouseId = orderData.warehouseId || 1
      this.form.categoryId = orderData.categoryId
      this.form.note = orderData.note 
      
      // Устанавливаем выбранного клиента
      if (orderData.client) {
        this.selectedClient = orderData.client
      }
      
      // Преобразуем товары для формы
      if (orderData.products && orderData.products.length > 0) {
        const regularProducts = orderData.products.filter(p => !(p.isTempProduct || (p.productId == null)))
        const tempProducts = orderData.products.filter(p => p.isTempProduct || (p.productId == null))
        this.form.products = regularProducts.map(product => ({
          id: product.id || null,
          productId: product.productId,
          productName: product.productName || product.name,
          name: product.productName || product.name,
          quantity: product.quantity,
          price: OrderProductDto.documentUnitPriceFromSavedLine(product),
          unit: product.unitShortName ,
          unitShortName: product.unitShortName ,
          unitName: product.unitShortName ,
          unitId: product.unitId,
          width: product.width ?? null,
          height: product.height ?? null,
          type: product.type || 1,
          stockQuantity: product.stockQuantity || 0
        }))
        
        this.form.stockItems = tempProducts.map(product => ({
          id: product.id || null,
          name: product.productName || product.name,
          description: product.description ,
          quantity: product.quantity,
          price: OrderProductDto.documentUnitPriceFromSavedLine(product),
          unitId: product.unitId,
          unitShortName: product.unitShortName ,
          width: product.width ?? 0,
          height: product.height ?? 0,
          isTempProduct: true,
          type: product.type || 1
        }))
      } else {
        this.form.products = []
        this.form.stockItems = []
      }
    },
    productItemMapper(item, columnName) {
      switch (columnName) {
        case 'name':
          return item.name
        case 'quantity':
          return formatQuantity(item.quantity)
        case 'unit':
          return item.unit
        case 'price':
          return formatNumber(item.price, null, true)
        case 'total':
          return formatNumber(item.total, null, true)
        default:
          return item[columnName] 
      }
    },
    formatTotalAmount() {
      return formatNumber(this.totalAmount, null, true)
    }
  }
}
</script>

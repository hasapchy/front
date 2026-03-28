<template>
  <div class="flex flex-col h-full relative">
    <div class="flex-1 overflow-auto p-4 pb-32">
      <h2 class="text-lg font-bold mb-4">
        {{ isEditing ? $t('editOrder') : $t('createOrder') }}
        <span
          v-if="isEditing && (orderId || editingItem?.id)"
          class="text-base font-normal text-gray-600 ml-2"
        >
          #{{ orderId || editingItem?.id }}
        </span>
      </h2>
      
      <!-- Форма создания заказа -->
      <div>
        <form
          class="space-y-6"
          @submit.prevent="createOrder"
        >
          <div class="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div class="grid grid-cols-1 gap-6">
              <!-- Клиент и Проект в одной строке -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Клиент -->
                <div>
                  <ClientSearch
                    :selected-client="selectedClient"
                    @update:selected-client="onClientSelected"
                  />
                </div>

                <!-- Проект -->
                <div>
                  <label class="block text-sm font-medium text-gray-700">{{ $t('project') }}</label>
                  <select 
                    v-model="form.projectId" 
                    :disabled="isProjectLocked"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    :class="{ 'bg-gray-100 cursor-not-allowed': isProjectLocked }"
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
                    class="mt-1 text-xs text-gray-500"
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
              <div v-if="allOrderItems.length > 0">
                <label class="block text-sm font-medium text-gray-700 mb-4">
                  {{ $t('orderItems') }}
                </label>
                <DraggableTable 
                  table-key="simpleOrderItems"
                  :columns-config="productTableColumns"
                  :table-data="allOrderItems"
                  :item-mapper="productItemMapper"
                  :show-actions="false"
                />
              </div>

              <!-- Примечание -->
              <div>
                <label class="block text-sm font-medium text-gray-700">
                  {{ $t('note') }}
                </label>
                <div class="mt-1">
                  <textarea
                    v-model="form.note"
                    rows="3"
                    class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    :placeholder="$t('orderNotePlaceholder')"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Итоговая сумма -->
          <div class="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div class="flex justify-between items-center">
              <span class="text-lg font-semibold text-gray-900">{{ $t('total') }}:</span>
              <span class="text-2xl font-bold text-indigo-600">{{ formatTotalAmount() }} m</span>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Футер с кнопками (зафиксирован внизу) -->
    <div class="fixed bottom-0 left-0 right-0 p-4 flex items-center justify-between bg-[#edf4fb] gap-4 flex-wrap md:flex-nowrap border-t border-gray-200 z-10">
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

      <div class="text-sm text-gray-700 flex flex-wrap md:flex-nowrap gap-x-4 gap-y-1 font-medium">
        <div>{{ $t('total') }}: <span class="font-bold">{{ formatTotalAmount() }}</span></div>
      </div>
    </div>

    <!-- Диалог подтверждения удаления -->
    <AlertDialog 
      :dialog="deleteDialog" 
      :descr="$t('confirmDelete')" 
      :confirm-text="$t('delete')" 
      :leave-text="$t('cancel')"
      @confirm="deleteOrder" 
      @leave="closeDeleteDialog" 
    />

    <!-- Модальное окно для добавления клиента -->
    <div
      v-if="showClientForm"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    >
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            {{ $t('addClient') }}
          </h3>
          <form @submit.prevent="createClient">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">{{ $t('name') }} *</label>
              <input
                v-model="clientForm.name"
                type="text"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">{{ $t('phone') }}</label>
              <input
                v-model="clientForm.phone"
                type="text"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
            </div>
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                @click="showClientForm = false"
              >
                {{ $t('cancel') }}
              </button>
              <button
                type="submit"
                :disabled="clientLoading"
                class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {{ clientLoading ? $t('creating') : $t('create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import OrderController from '@/api/OrderController'
import ProjectController from '@/api/ProjectController'
import ClientController from '@/api/ClientController'
import CashRegisterController from '@/api/CashRegisterController'
import WarehouseController from '@/api/WarehouseController'
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue'
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue'
import ClientSearch from '@/views/components/app/search/ClientSearch.vue'
import SimpleProductSearch from '@/views/components/simple/SimpleProductSearch.vue'
import SimpleStockSearch from '@/views/components/simple/SimpleStockSearch.vue'
import SimpleServicesRow from '@/views/components/simple/SimpleServicesRow.vue'
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue'
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin'
import crudEventMixin from '@/mixins/crudEventMixin'
import { formatNumber } from '@/utils/numberUtils'

export default {
  name: 'SimpleOrderCreatePage',
  components: {
    PrimaryButton,
    DraggableTable,
    ClientSearch,
    SimpleProductSearch,
    SimpleStockSearch,
    SimpleServicesRow,
    AlertDialog
  },
  mixins: [getApiErrorMessage, crudEventMixin],
  props: {
    editingItem: {
      type: Object,
      default: null
    }
  },
  emits: ['saved', 'saved-silent', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
  data() {
    return {
      form: {
        clientId: '',
        projectId: '',
        products: [],
        stockItems: [], // Товары с бесконечным остатком (temp_products)
        note: '',
        cashId: 1, // Значение по умолчанию
        warehouseId: 1, // Значение по умолчанию
        categoryId: null // Категория заказа (определяется по пользователю)
      },
      selectedClient: null,
      allProjects: [],
      loading: false,
      deleteLoading: false,
      deleteDialog: false,
      showClientForm: false,
      clientForm: {
        name: '',
        phone: ''
      },
      clientLoading: false,
      originalProjectId: null,
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
    // Загружаем кассы, склады и проекты в фоне, не блокируя загрузку страницы
    this.loadCashRegisters();
    this.loadWarehouses();
    this.loadProjects();
    // Инициализируем форму после загрузки базовых данных
    await this.initializeForm();
  },
  methods: {
    async loadCashRegisters() {
      try {
        const response = await CashRegisterController.getAll();
        const data = Array.isArray(response) ? response : (response.items || []);
        
        if (data && data.length > 0) {
          // Автоматически выбираем первую кассу
          this.form.cashId = data[0].id;
        }
      } catch {
        // Устанавливаем значение по умолчанию если API недоступен
        this.form.cashId = 1;
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
    async createClient() {
      this.clientLoading = true
      try {
        const data = await ClientController.store(this.clientForm)
        
        this.selectedClient = data
        this.form.clientId = data.id || null
        this.showClientForm = false
        this.clientForm = { name: '', phone: '' }
      } catch {
      } finally {
        this.clientLoading = false
      }
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
          currencyId: 1, // Используем валюту по умолчанию
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
          currencyId: 1,
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
        this.form = {
          clientId: '',
          projectId: '',
          products: [],
          stockItems: [],
          note: '',
          cashId: 1,
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
          price: product.price,
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
          price: product.price,
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
    // Форматирование количества - всегда 2 знака после запятой
    formatQuantity(quantity) {
      if (quantity === null || quantity === undefined || quantity === '') {
        return '0.00';
      }
      const num = Number(quantity);
      if (isNaN(num)) {
        return '0.00';
      }
      // Округляем до 2 знаков после запятой и форматируем
      return num.toFixed(2);
    },
    // Обработчик для DraggableTable
    productItemMapper(item, columnName) {
      switch (columnName) {
        case 'name':
          return item.name
        case 'quantity':
          return this.formatQuantity(item.quantity)
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

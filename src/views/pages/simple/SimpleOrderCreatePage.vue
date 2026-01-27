<template>
  <div class="flex flex-col overflow-auto h-full p-4">
    <h2 class="text-lg font-bold mb-4">
      {{ isEditing ? $t('editOrder') : $t('createOrder') }}
      <span v-if="isEditing && (orderId || editingItem?.id)" class="text-base font-normal text-gray-600 ml-2">
        #{{ orderId || editingItem?.id }}
      </span>
    </h2>
    
    <!-- Форма создания заказа -->
    <div>
      <form @submit.prevent="createOrder" class="space-y-6">
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
                  v-model="form.project_id" 
                  :disabled="isProjectLocked"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  :class="{ 'bg-gray-100 cursor-not-allowed': isProjectLocked }"
                >
                  <option value="">{{ $t('no') }}</option>
                  <option v-for="project in allProjects" :key="project.id" :value="project.id">
                    {{ project.name }}
                  </option>
                </select>
                <p v-if="isProjectLocked" class="mt-1 text-xs text-gray-500">
                  Проект нельзя указать, если он не был указан при создании заказа
                </p>
              </div>
            </div>

            <!-- Услуги на всю ширину -->
            <div>
              <SimpleServicesRow v-model="form.products" :project-id="form.project_id" />
            </div>

            <!-- Товары на складе -->
            <div>
              <SimpleProductSearch
                v-model="form.products"
                :show-quantity="true"
                :only-products="true"
                :required="true"
                :project-id="form.project_id"
              />
            </div>

            <!-- Остатки (товары с бесконечным остатком) -->
            <div>
              <SimpleStockSearch
                v-model="form.stockItems"
                :show-quantity="true"
                :project-id="form.project_id"
              />
            </div>

            <!-- Таблица товаров -->
            <div v-if="allOrderItems.length > 0">
              <label class="block text-sm font-medium text-gray-700 mb-4">
                {{ $t('orderItems') || 'Товары в заказе' }}
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
            <span class="text-lg font-semibold text-gray-900">{{ $t('total') || 'Итого' }}:</span>
            <span class="text-2xl font-bold text-indigo-600">{{ formatTotalAmount() }} m</span>
          </div>
        </div>

      </form>
    </div>

    <!-- Футер с кнопками -->
    <div class="mt-4 p-4 flex items-center justify-between bg-[#edf4fb] gap-4 flex-wrap md:flex-nowrap">
      <div class="flex items-center space-x-2">
        <PrimaryButton v-if="isEditing && (orderId || editingItem?.id)" icon="fas fa-check" :onclick="updateOrder"
          :is-loading="loading">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="isEditing ? updateOrder : createOrder" :is-loading="loading"
          :disabled="!canSave">
        </PrimaryButton>
        <PrimaryButton v-if="isEditing && (orderId || editingItem?.id)" :onclick="showDeleteDialog" :is-danger="true"
          :is-loading="deleteLoading" icon="fas fa-trash">
        </PrimaryButton>
      </div>

      <div class="text-sm text-gray-700 flex flex-wrap md:flex-nowrap gap-x-4 gap-y-1 font-medium">
        <div>{{ $t('total') }}: <span class="font-bold">{{ formatTotalAmount() }}</span></div>
      </div>
    </div>

    <!-- Диалог подтверждения удаления -->
    <AlertDialog 
      :dialog="deleteDialog" 
      @confirm="deleteOrder" 
      @leave="closeDeleteDialog" 
      :descr="$t('confirmDelete')"
      :confirm-text="$t('delete')" 
      :leave-text="$t('cancel')" 
    />

    <!-- Модальное окно для добавления клиента -->
    <div v-if="showClientForm" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">{{ $t('addClient') }}</h3>
          <form @submit.prevent="createClient">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">{{ $t('name') }} *</label>
              <input
                v-model="clientForm.name"
                type="text"
                required
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700">{{ $t('phone') }}</label>
              <input
                v-model="clientForm.phone"
                type="text"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                @click="showClientForm = false"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
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
import api from '@/api/axiosInstance'
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
  mixins: [getApiErrorMessage, crudEventMixin],
  emits: ['saved', 'saved-silent', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
  components: {
    PrimaryButton,
    DraggableTable,
    ClientSearch,
    SimpleProductSearch,
    SimpleStockSearch,
    SimpleServicesRow,
    AlertDialog
  },
  props: {
    editingItem: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      form: {
        client_id: '',
        project_id: '',
        products: [],
        stockItems: [], // Товары с бесконечным остатком (temp_products)
        note: '',
        cash_id: 1, // Значение по умолчанию
        warehouse_id: 1, // Значение по умолчанию
        category_id: null // Категория заказа (определяется по пользователю)
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
      return this.form.client_id && 
             this.form.warehouse_id && 
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
              unit: product.unit || product.unitName || '',
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
              unit: item.unit_short_name || item.unit_name || '',
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
          label: this.$t('product') || 'Товар', 
          size: 300 
        },
        { 
          name: 'quantity', 
          label: this.$t('quantity') || 'Количество', 
          size: 120 
        },
        { 
          name: 'unit', 
          label: this.$t('unit') || 'Ед.', 
          size: 80 
        },
        { 
          name: 'price', 
          label: this.$t('price') || 'Цена', 
          size: 120 
        },
        { 
          name: 'total', 
          label: this.$t('total') || 'Сумма', 
          size: 120 
        }
      ]
    }
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
          this.form.cash_id = data[0].id;
        }
      } catch (error) {
        // Устанавливаем значение по умолчанию если API недоступен
        this.form.cash_id = 1;
      }
    },
    async loadWarehouses() {
      try {
        const response = await WarehouseController.getAll();
        const data = Array.isArray(response) ? response : (response.items || []);
        
        if (data && data.length > 0) {
          // Автоматически выбираем первый склад
          this.form.warehouse_id = data[0].id;
        }
      } catch (error) {
        // Устанавливаем значение по умолчанию если API недоступен
        this.form.warehouse_id = 1;
      }
    },
    async loadProjects() {
      try {
        const allProjects = await ProjectController.getListItems();
        this.allProjects = Array.isArray(allProjects) ? allProjects : [];
      } catch (error) {
        this.allProjects = [];
      }
    },
    onClientSelected(client) {
      this.selectedClient = client
      this.form.client_id = client ? client.id : null
    },
    async createClient() {
      this.clientLoading = true
      try {
        const data = await ClientController.store(this.clientForm)
        
        this.selectedClient = data
        this.form.client_id = data.id || null
        this.showClientForm = false
        this.clientForm = { name: '', phone: '' }
      } catch (error) {
      } finally {
        this.clientLoading = false
      }
    },
    async createOrder() {
      this.loading = true

      // Проверяем обязательные поля
      const validationErrors = []
      
      // Требуем клиента всегда
      if (!this.form.client_id) {
        validationErrors.push('• Укажите клиента')
      }
      
      if (!this.form.warehouse_id) {
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
            product_id: p.productId,
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
            description: item.description || '',
            quantity: item.quantity,
            price: item.price || 0,
            unit_id: item.unit_id || null,
            width: item.width || null,
            height: item.height || null,
          }))
        
        const orderData = {
          client_id: this.form.client_id || null,
          project_id: this.form.project_id || null,
          cash_id: this.form.cash_id,
          warehouse_id: this.form.warehouse_id,
          currency_id: 1, // Используем валюту по умолчанию
          category_id: this.form.category_id, // Категория заказа
          note: this.form.note || '',
          products: validProducts,
          temp_products: tempProducts
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
      if (!this.form.client_id) {
        validationErrors.push('• Укажите клиента')
      }
      
      if (!this.form.warehouse_id) {
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
          product_id: p.productId,
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
            description: item.description || '',
            quantity: item.quantity,
            price: item.price || 0,
            unit_id: item.unit_id || null,
            width: item.width || null,
            height: item.height || null,
          }))
        
        const projectId = this.isProjectLocked ? null : (this.form.project_id || null)
        
        const orderData = {
          client_id: this.form.client_id || null,
          project_id: projectId,
          cash_id: this.form.cash_id,
          warehouse_id: this.form.warehouse_id,
          currency_id: 1,
          category_id: this.form.category_id,
          note: this.form.note || '',
          products: validProducts,
          temp_products: tempProducts
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
        } catch (error) {
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
          client_id: '',
          project_id: '',
          products: [],
          stockItems: [],
          note: '',
          cash_id: 1,
          warehouse_id: 1,
          category_id: null
        }
        this.selectedClient = null
        this.originalProjectId = null
      }
    },
    fillFormWithOrderData(orderData) {
      // Заполняем форму данными заказа
      this.form.client_id = orderData.clientId || ''
      this.form.project_id = orderData.projectId || ''
      this.originalProjectId = orderData.projectId || null
      this.form.cash_id = orderData.cashId || 1
      this.form.warehouse_id = orderData.warehouseId || 1
      this.form.category_id = orderData.categoryId || this.form.category_id
      this.form.note = orderData.note || ''
      
      // Устанавливаем выбранного клиента
      if (orderData.client) {
        this.selectedClient = orderData.client
      }
      
      // Преобразуем товары для формы
      if (orderData.products && orderData.products.length > 0) {

        const regularProducts = orderData.products.filter(p => p.product_type !== 'temp')
        const tempProducts = orderData.products.filter(p => p.product_type === 'temp')
        
        this.form.products = regularProducts.map(product => ({
          id: product.id || null,
          productId: product.product_id,
          productName: product.product_name,
          name: product.product_name,
          quantity: product.quantity,
          price: product.price,
          unit: product.unit_short_name || product.unit_name,
          unitShortName: product.unit_short_name || product.unit_name,
          unitName: product.unit_name,
          unitId: product.unit_id,
          width: product.width || null,
          height: product.height || null
        }))
        
        this.form.stockItems = tempProducts.map(product => ({
          id: product.id || null,
          name: product.product_name,
          description: product.description || '',
          quantity: product.quantity,
          price: product.price,
          unit_id: product.unitId,
          unit_short_name: product.unitShortName || '',
          unit_name: product.unitShortName || '',
          width: product.width || 0,
          height: product.height || 0,
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
          return item[columnName] || '-'
      }
    },
    formatTotalAmount() {
      return formatNumber(this.totalAmount, null, true)
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
  }
}
</script>

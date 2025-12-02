<template>
  <div>
    <!-- Заголовок -->
    <div class="md:flex md:items-center md:justify-between">
      <div class="flex-1 min-w-0">
        <h2 class="text-2xl font-bold leading-7 text-gray-900">
          {{ isEditing ? $t('editOrder') : $t('createOrder') }}
          <span v-if="isEditing && orderId" class="text-lg font-normal text-gray-600 ml-2">
            #{{ orderId }}
          </span>
        </h2>
      </div>
      <div class="mt-4 flex md:mt-0 md:ml-4">
        <PrimaryButton
          v-if="isEditing"
          :is-light="true"
          icon="fas fa-arrow-left"
          :onclick="closeModal"
        >
          {{ $t('backToOrders') }}
        </PrimaryButton>
        <router-link v-else to="/basement/orders">
          <PrimaryButton
            :is-light="true"
            icon="fas fa-arrow-left"
          >
            {{ $t('backToOrders') }}
          </PrimaryButton>
        </router-link>
      </div>
    </div>

    <!-- Форма создания заказа -->
    <div class="mt-8">
      <form @submit.prevent="createOrder" class="space-y-6">
        <div class="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div class="grid grid-cols-1 gap-6">
            <!-- Клиент и Проект в одной строке -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Клиент -->
              <div>
                <BasementClientSearch
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
              <BasementServicesRow v-model="form.products" :project-id="form.project_id" />
            </div>

            <!-- Товары на складе и Остатки: 50/50 -->
            <div class="grid grid-cols-2 gap-6">
              <!-- Товары на складе -->
              <div>
                <BasementProductSearch
                  v-model="form.products"
                  :show-quantity="true"
                  :only-products="true"
                  :required="true"
                  :project-id="form.project_id"
                />
              </div>

              <!-- Остатки (товары с бесконечным остатком) -->
              <div>
                <BasementStockSearch
                  v-model="form.stockItems"
                  :show-quantity="true"
                  :project-id="form.project_id"
                />
              </div>
            </div>

            <!-- Таблица товаров -->
            <div v-if="allOrderItems.length > 0">
              <label class="block text-sm font-medium text-gray-700 mb-4">
                {{ $t('orderItems') || 'Товары в заказе' }}
              </label>
              <DraggableTable 
                table-key="basementOrderItems"
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

        <!-- Кнопки -->
        <div class="flex flex-col items-end space-y-2">
          <!-- Подсказка, почему кнопка неактивна -->
          <div v-if="!canSave && !loading" class="text-sm text-gray-500 text-right">
            <div v-if="!form.client_id">• Укажите клиента</div>
            <div v-if="!form.warehouse_id">• Выберите склад</div>
            <div v-if="!hasValidProducts">• Добавьте товары с количеством больше 0</div>
          </div>
          
          <div class="flex space-x-3">
            <PrimaryButton
              v-if="isEditing"
              :is-light="true"
              icon="fas fa-times"
              :onclick="closeModal"
            >
              {{ $t('cancel') }}
            </PrimaryButton>
            <router-link v-else to="/basement/orders">
              <PrimaryButton
                :is-light="true"
                icon="fas fa-times"
              >
                {{ $t('cancel') }}
              </PrimaryButton>
            </router-link>
            <PrimaryButton
              :is-loading="loading"
              :disabled="!canSave"
              icon="fas fa-save"
              :onclick="isEditing ? updateOrder : createOrder"
            >
              {{ isEditing ? $t('updateOrder') : $t('createOrder') }}
            </PrimaryButton>
          </div>
        </div>

      </form>
    </div>

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
import basementApi from '@/api/basement/basementAxiosInstance'
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue'
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue'
import BasementClientSearch from '@/views/components/basement/BasementClientSearch.vue'
import BasementProductSearch from '@/views/components/basement/BasementProductSearch.vue'
import BasementStockSearch from '@/views/components/basement/BasementStockSearch.vue'
import BasementServicesRow from '@/views/components/basement/BasementServicesRow.vue'
import BasementProjectController from '@/api/basement/BasementProjectController'
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin'
import crudEventMixin from '@/mixins/crudEventMixin'
import { formatNumber } from '@/utils/numberUtils'

export default {
  name: 'BasementOrderCreatePage',
  mixins: [getApiErrorMessage, crudEventMixin],
  components: {
    PrimaryButton,
    DraggableTable,
    BasementClientSearch,
    BasementProductSearch,
    BasementStockSearch,
    BasementServicesRow
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
    // Определяем категорию по текущему пользователю
    this.setCategoryByUser();
    // Загружаем кассы, склады и проекты в фоне, не блокируя загрузку страницы
    this.loadCashRegisters();
    this.loadWarehouses();
    this.loadProjects();
  },
  methods: {
    setCategoryByUser() {
      // Хардкод соответствия: юзер 6 = категория 2, 7 = 3, 8 = 14
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const userId = user.id;
          
          const basementCategoryMap = {
            6: 2,
            7: 3,
            8: 14
          };
          
          this.form.category_id = basementCategoryMap[userId] || null;
        }
      } catch (error) {
      }
    },
    async loadCashRegisters() {
      try {
        const { data } = await basementApi.get('/cash_registers/all');
        
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
        const { data } = await basementApi.get('/warehouses');
        
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
        // Загружаем только активные проекты (исключаем "Завершен" и "Отменен")
        const projects = await BasementProjectController.getItems(1, { active_only: true });
        // Для активных проектов возвращается массив, а не пагинированный ответ
        this.allProjects = Array.isArray(projects) ? projects : (projects.items || []);
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
        const { data } = await basementApi.post('/clients', this.clientForm)
        
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

        const { data } = await basementApi.post('/orders', orderData)
        
        // Уведомление об успехе
        this.$store.dispatch('showNotification', { 
          title: this.savedSuccessText, 
          subtitle: '', 
          isDanger: false 
        })
        this.$router.push('/basement/orders')
      } catch (error) {
        // Уведомление об ошибке
        const errorMessage = this.getApiErrorMessage(error)
        this.$store.dispatch('showNotification', { 
          title: this.savedErrorText, 
          subtitle: errorMessage, 
          isDanger: true 
        })
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
          product_id: p.productId,
          quantity: Math.max(p.quantity || 0, 0),
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
        
        const projectId = this.isProjectLocked ? null : (this.form.project_id || null)
        
        const orderData = {
          client_id: this.form.client_id || null,
          project_id: projectId,
          cash_id: this.form.cash_id,
          warehouse_id: this.form.warehouse_id,
          currency_id: 1,
          category_id: this.form.category_id, // Категория заказа
          note: this.form.note || '',
          products: validProducts,
          temp_products: tempProducts
        }
        
        const orderId = this.editingItem?.id || (this.orderId ? parseInt(this.orderId) : null)
        
        if (!orderId) {
          throw new Error('ID заказа не найден')
        }
        
        const { data } = await basementApi.put(`/orders/${orderId}`, orderData)
        
        // Уведомление об успехе
        this.$store.dispatch('showNotification', { 
          title: 'Заказ успешно обновлен', 
          subtitle: '', 
          isDanger: false 
        })
        
        // Если редактируем через роут, переходим обратно к заказам
        if (this.orderId) {
          this.$router.push('/basement/orders')
        } else {
          // Эмитим событие для родительского компонента (модалка)
          this.$emit('saved', data)
        }
      } catch (error) {
        // Уведомление об ошибке
        const errorMessage = this.getApiErrorMessage(error)
        this.$store.dispatch('showNotification', { 
          title: 'Ошибка обновления заказа', 
          subtitle: errorMessage, 
          isDanger: true 
        })
        
        // Эмитим событие об ошибке
        this.$emit('saved-error', error)
      } finally {
        this.loading = false
      }
    },
    closeModal() {
      if (this.editingItem) {
        // Если редактируем через prop (модалка), эмитим событие
        this.$emit('close-request')
      } else if (this.orderId) {
        // Если редактируем через роут, переходим обратно к заказам
        this.$router.push('/basement/orders')
      }
    },
    async initializeForm() {
      if (this.editingItem) {
        // Заполняем форму данными для редактирования из prop
        this.fillFormWithOrderData(this.editingItem)
      } else if (this.orderId) {
        // Загружаем данные заказа по ID из роута
        try {
          const { data } = await basementApi.get(`/orders/${parseInt(this.orderId)}`)
          
          const orderData = data.item || data
          this.fillFormWithOrderData(orderData)
        } catch (error) {
          this.$store.dispatch('showNotification', {
            title: 'Ошибка',
            subtitle: 'Не удалось загрузить заказ для редактирования',
            isDanger: true
          })
          this.$router.push('/basement/orders')
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
      this.form.client_id = orderData.client_id || ''
      this.form.project_id = orderData.project_id || ''
      this.originalProjectId = orderData.project_id || null
      this.form.cash_id = orderData.cash_id || 1
      this.form.warehouse_id = orderData.warehouse_id || 1
      this.form.category_id = orderData.category_id || this.form.category_id
      this.form.note = orderData.note || ''
      
      // Устанавливаем выбранного клиента
      if (orderData.client) {
        this.selectedClient = orderData.client
      }
      
      // Проект уже установлен через v-model="form.project_id"
      
      // Преобразуем товары для формы
      if (orderData.products && orderData.products.length > 0) {
        // Разделяем обычные товары и temp_products
        const regularProducts = orderData.products.filter(p => p.product_type !== 'temp')
        const tempProducts = orderData.products.filter(p => p.product_type === 'temp')
        
        this.form.products = regularProducts.map(product => ({
          productId: product.product_id,
          productName: product.product_name,
          name: product.product_name,
          quantity: product.quantity,
          price: product.price,
          unit: product.unit_short_name || product.unit_name,
          unitId: product.unit_id,
          width: product.width || null,
          height: product.height || null
        }))
        
        // Загружаем temp_products в stockItems
        this.form.stockItems = tempProducts.map(product => ({
          name: product.product_name,
          description: product.description || '',
          quantity: product.quantity,
          price: product.price,
          unit_id: product.unit_id,
          unit_short_name: product.unit_short_name || product.unit_name || '',
          unit_name: product.unit_name || '',
          width: product.width || 0,
          height: product.height || 0,
          isTempProduct: true,
          type: product.type || 1
        }))
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

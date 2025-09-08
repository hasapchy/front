<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editInvoice') : $t('createInvoice') }}</h2>

        <!-- Основная информация -->
        <div class="mb-4">
            <h3 class="text-md font-semibold mb-3">{{ $t('basicInformation') }}</h3>
            <div class="space-y-4">
                <div>
                    <ClientSearch v-model:selectedClient="selectedClient" :required="true" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('invoiceDate') }}</label>
                    <input type="datetime-local" v-model="formData.invoice_date" class="w-full p-2 border rounded h-10" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('status') }}</label>
                    <select v-model="formData.status" class="w-full p-2 border rounded h-10">
                        <option value="new">{{ $t('new') }}</option>
                        <option value="in_progress">{{ $t('inProgress') }}</option>
                        <option value="paid">{{ $t('paid') }}</option>
                        <option value="cancelled">{{ $t('cancelled') }}</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('note') }}</label>
                    <textarea v-model="formData.note" rows="3" class="w-full p-2 border rounded"></textarea>
                </div>
            </div>
        </div>

        <!-- Выбор заказов -->
        <div class="mb-4">
            <OrderSearch 
                ref="orderSearch"
                v-model="selectedOrders" 
                @change="loadOrdersData"
                :currency-symbol="defaultCurrencySymbol"
                @update:subtotal="formData.subtotal = $event"
                :readonly="!!editingItem"
            />
        </div>



    </div>
    <div class="mt-4 p-4 flex items-center justify-between bg-[#edf4fb] gap-4 flex-wrap md:flex-nowrap">
        <!-- Кнопки -->
        <div class="flex items-center space-x-2">
            <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="loading">
            </PrimaryButton>
            <div v-if="editingItem" class="flex items-center space-x-2">
                <label class="flex items-center text-sm">
                    <input type="checkbox" v-model="pdfVariant" value="short" class="mr-1" />
                    Краткий
                </label>
                <label class="flex items-center text-sm">
                    <input type="checkbox" v-model="pdfVariant" value="detailed" class="mr-1" />
                    Подробный
                </label>
                <PrimaryButton :onclick="generatePdf" icon="fas fa-file-pdf" :isLight="true">
                    {{ $t('generatePdf') }}
                </PrimaryButton>
            </div>
        </div>

    </div>
    
    <!-- Диалог подтверждения закрытия -->
    <AlertDialog 
        :dialog="closeConfirmDialog" 
        @confirm="confirmClose" 
        @leave="cancelClose"
        :descr="$t('unsavedChanges')" 
        :confirm-text="$t('closeWithoutSaving')" 
        :leave-text="$t('stay')" 
    />
</template>

<script>
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import ClientSearch from "@/views/components/app/search/ClientSearch.vue";
import OrderSearch from "@/views/components/app/search/OrderSearch.vue";
import AlertDialog from "@/views/components/app/dialog/AlertDialog.vue";
import InvoiceController from "@/api/InvoiceController";
import OrderController from "@/api/OrderController";
import ClientDto from "@/dto/client/ClientDto";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import notificationMixin from "@/mixins/notificationMixin";
import formChangesMixin from "@/mixins/formChangesMixin";
import { eventBus } from "@/eventBus";
import { generateInvoicePdf } from "@/utils/pdfUtils";

export default {
    mixins: [getApiErrorMessage, notificationMixin, formChangesMixin],
    emits: ["saved", "saved-error", "deleted", "deleted-error", "close-request"],
    components: { 
        PrimaryButton, 
        ClientSearch, 
        OrderSearch,
        AlertDialog
    },
    props: {
        editingItem: {
            type: Object,
            default: null
        },
        preselectedOrderIds: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            loading: false,
            selectedOrders: [],
            selectedClient: null,
            currencySymbol: 'TMT', // Символ валюты по умолчанию
            editingItemId: this.editingItem?.id || null,
            formData: {
                client_id: null,
                invoice_date: new Date().toISOString().slice(0, 16), // Дата и время
                status: 'new', // Статус "новый"
                note: '',
                order_ids: [],
                subtotal: 0
            },
            pdfVariant: ['short'] // По умолчанию выбран краткий вариант
        };
    },
    computed: {
        defaultCurrencySymbol() {
            // Получаем дефолтную валюту из store или используем TMT
            const currencies = this.$store.state.currencies || [];
            const defaultCurrency = currencies.find(c => c.is_default);
            return defaultCurrency ? defaultCurrency.symbol : 'TMT';
        },
    },
    created() {
        // Устанавливаем правильную валюту
        this.currencySymbol = this.defaultCurrencySymbol;
    },
    mounted() {
        // Сохраняем начальное состояние после загрузки всех данных
        this.$nextTick(async () => {
            if (this.preselectedOrderIds.length > 0) {
                // Загружаем заказы по ID для предварительного выбора
                await this.loadPreselectedOrders();
            }
            
            // Теперь сохраняем начальное состояние
            this.saveInitialState();
        });
    },
    methods: {
        // Переопределяем метод getFormState из formChangesMixin
        getFormState() {
            return {
                selectedClient: this.selectedClient?.id || null,
                invoice_date: this.formData.invoice_date,
                status: this.formData.status,
                note: this.formData.note,
                order_ids: this.formData.order_ids,
                selectedOrders: this.selectedOrders.map(order => order.id),
                subtotal: this.formData.subtotal
            };
        },

        loadEditingData() {
            this.editingItemId = this.editingItem.id;
            this.selectedClient = this.editingItem.client || null;
            
            this.formData = {
                invoice_date: this.editingItem.invoiceDate ? this.formatDateTimeForInput(this.editingItem.invoiceDate) : new Date().toISOString().slice(0, 16),
                status: this.editingItem.status || 'new',
                note: this.editingItem.note,
                order_ids: this.editingItem.orders ? this.editingItem.orders.map(o => o.id) : []
            };
            
            // Загружаем заказы для редактирования
            if (this.editingItem.orders) {
                this.selectedOrders = [...this.editingItem.orders];
            }
            
            // Загружаем товары из invoice_products и передаем их в OrderSearch
            this.$nextTick(() => {
                if (this.$refs.orderSearch && this.editingItem.products) {
                    // Преобразуем товары из invoice_products в формат для OrderSearch
                    const productsFromInvoice = this.editingItem.products.map(product => {
                        // Пытаемся найти соответствующий заказ по названию товара
                        let orderId = 'N/A';
                        if (this.editingItem.orders) {
                            const matchingOrder = this.editingItem.orders.find(order => 
                                order.products && order.products.some(op => 
                                    op.productName === product.productName
                                )
                            );
                            if (matchingOrder) {
                                orderId = matchingOrder.id;
                            }
                        }
                        
                        return {
                            id: product.id,
                            productId: product.productId,
                            productName: product.productName,
                            name: product.productName,
                            productDescription: product.productDescription || '',
                            quantity: product.quantity,
                            price: product.price,
                            totalPrice: product.totalPrice,
                            unitId: product.unitId,
                            unitName: product.unitName || product.unitShortName || '',
                            productImage: null, // В invoice_products нет изображений
                            orderId: orderId,
                            type: 1, // Предполагаем, что это товар
                            imgUrl() {
                                return null;
                            },
                            icons() {
                                return '<i class="fas fa-box text-[#3571A4]" title="Товар"></i>';
                            }
                        };
                    });
                    
                    // Устанавливаем товары в OrderSearch
                    this.$refs.orderSearch.allProductsFromOrders = productsFromInvoice;
                    this.$refs.orderSearch.updateTotals();
                }
            });
        },

        async loadPreselectedOrders() {
            try {
                if (!this.preselectedOrderIds || this.preselectedOrderIds.length === 0) {
                    return;
                }

                const orderPromises = this.preselectedOrderIds.map(id => 
                    OrderController.getItem(id)
                );
                const orders = await Promise.all(orderPromises);
                
                this.selectedOrders = orders.filter(order => order !== null);
                
                this.loadOrdersData();
            } catch (error) {
                console.error('Ошибка загрузки предварительно выбранных заказов:', error);
                this.showNotification(this.$t('error'), 'Ошибка загрузки заказов: ' + error.message, true);
            }
        },

        async loadOrdersData() {
            if (this.selectedOrders.length === 0) {
                this.formData.order_ids = [];
                return;
            }

            try {
                const orderIds = this.selectedOrders.map(order => order.id);
                this.formData.order_ids = orderIds;
                
                // Загружаем данные клиента из первого заказа
                if (this.selectedOrders[0]?.client) {
                    this.selectedClient = this.selectedOrders[0].client;
                }
            } catch (error) {
                this.showNotification(this.$t('errorLoadingOrdersData'), error.message, true);
            }
        },



        async save() {
            // Проверяем обязательные поля
            const validationErrors = [];
            
            if (!this.selectedClient) {
                validationErrors.push('Поле "Клиент" обязательно для заполнения');
            }

            // Проверяем, есть ли товары в выбранных заказах
            const orderSearch = this.$refs.orderSearch;
            if (!orderSearch || !orderSearch.allProductsFromOrders || orderSearch.allProductsFromOrders.length === 0) {
                validationErrors.push('Необходимо выбрать заказы с товарами');
            }
            
            if (validationErrors.length > 0) {
                this.$emit('saved-error', validationErrors.join('\n'));
                return;
            }
            
            this.loading = true;
            try {
                // Получаем товары и общую сумму из OrderSearch
                const products = orderSearch ? orderSearch.allProductsFromOrders : [];
                const totalAmount = orderSearch ? orderSearch.subtotal : 0;
                
                // Преобразуем товары в формат для invoice_products
                const invoiceProducts = products.map(product => ({
                    product_id: product.productId || null,
                    product_name: product.productName || product.name,
                    product_description: product.productDescription || '',
                    quantity: product.quantity,
                    price: product.price,
                    total_price: product.totalPrice || (product.quantity * product.price),
                    unit_id: product.unitId || null,
                    unit_name: product.unitName || product.unitShortName || ''
                }));
                
                
                const data = {
                    ...this.formData,
                    client_id: this.selectedClient.id,
                    order_ids: this.editingItem ? this.formData.order_ids : this.selectedOrders.map(o => o.id),
                    products: invoiceProducts,
                    total_amount: totalAmount,
                    status: this.formData.status || 'new'
                };

                if (this.editingItem) {
                    await InvoiceController.updateItem(this.editingItem.id, data);
                } else {
                    await InvoiceController.storeItem(data);
                }

                this.$emit('saved');
                this.clearForm();
                this.resetFormChanges(); // Сбрасываем состояние изменений
            } catch (error) {
                const errors = this.getApiErrorMessage(error);
                this.$emit('saved-error', errors.join('\n'));
            }
            this.loading = false;
        },


        clearForm() {
            this.editingItemId = null;
            this.selectedClient = null;
            this.formData = {
                invoice_date: new Date().toISOString().slice(0, 16), // Дата и время
                status: 'new',
                note: '',
                order_ids: [],
                subtotal: 0
            };
            this.selectedOrders = [];
            this.resetFormChanges(); // Сбрасываем состояние изменений
        },




        generatePdf() {
            if (!this.editingItem) {
                this.showNotification(this.$t('error'), this.$t('saveInvoiceFirst'), true);
                return;
            }

            if (this.pdfVariant.length === 0) {
                this.showNotification(this.$t('error'), 'Выберите вариант PDF', true);
                return;
            }

            try {
                // Генерируем PDF для каждого выбранного варианта
                this.pdfVariant.forEach(variant => {
                    generateInvoicePdf(this.editingItem, null, variant);
                });
                this.showNotification(this.$t('pdfGenerated'), '', false);
            } catch (error) {
                console.error('Ошибка генерации PDF:', error);
                this.showNotification(this.$t('error'), this.$t('errorGeneratingPdf'), true);
            }
        },

        formatDateTimeForInput(dateString) {
            // Конвертируем дату в формат для datetime-local input
            if (!dateString) return new Date().toISOString().slice(0, 16);
            const date = new Date(dateString);
            return date.toISOString().slice(0, 16);
        }
    },
    watch: {
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.loadEditingData();
                } else {
                    this.clearForm();
                }
                // Сохраняем новое начальное состояние
                this.$nextTick(() => {
                    this.saveInitialState();
                });
            },
            immediate: true,
            deep: true
        },
        preselectedOrderIds: {
            handler(newIds) {
                if (newIds && newIds.length > 0) {
                    this.loadPreselectedOrders();
                }
            },
            immediate: true
        }
    }
};
</script>

<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editInvoice') : $t('createInvoice') }}</h2>

        <div class="mb-4">
            <h3 class="text-md font-semibold mb-3">{{ $t('basicInformation') }}</h3>
            <div class="space-y-4">
                <div>
                    <ClientSearch v-model:selectedClient="selectedClient" :required="true" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('invoiceDate') }}</label>
                    <input type="datetime-local" v-model="formData.invoice_date" 
                        class="w-full p-2 border rounded h-10"
                        :disabled="editingItemId && !$store.getters.hasPermission('settings_edit_any_date')"
                        :min="!$store.getters.hasPermission('settings_edit_any_date') ? new Date().toISOString().substring(0, 16) : null" />
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
        <div class="flex items-center space-x-2">
            <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="loading">
            </PrimaryButton>
            <div v-if="editingItem" class="flex items-center space-x-2">
                <div class="relative">
                    <PrimaryButton 
                        :onclick="togglePdfDropdown" 
                        :icon="'fas fa-file-pdf'"
                        class="px-3 py-2"
                    >
                        <i :class="showPdfDropdown ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" class="ml-2"></i>
                    </PrimaryButton>
                    
                    <div v-if="showPdfDropdown" class="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                        <div class="py-1">
                            <label class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    v-model="pdfVariant" 
                                    value="short" 
                                    class="mr-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                {{ $t('shortPdf') }}
                            </label>
                            <label class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    v-model="pdfVariant" 
                                    value="detailed" 
                                    class="mr-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                {{ $t('detailedPdf') }}
                            </label>
                            <div class="border-t border-gray-100">
                                <button 
                                    @click="generatePdf" 
                                    class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                >
                                    <i class="fas fa-download mr-2"></i>
                                    {{ $t('downloadSelected') }}
                                </button>
                                <button 
                                    @click="printPdf" 
                                    class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                >
                                    <i class="fas fa-print mr-2"></i>
                                    {{ $t('print') }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
    
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
import { generateInvoicePdf, InvoicePdfGenerator } from "@/utils/pdfUtils";
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

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
            currencySymbol: 'Нет валюты',
            editingItemId: this.editingItem?.id || null,
            formData: {
                client_id: null,
                invoice_date: new Date().toISOString().slice(0, 16),
                status: 'new',
                note: '',
                order_ids: [],
                subtotal: 0
            },
            pdfVariant: ['short'],
            showPdfDropdown: false
        };
    },
    computed: {
        defaultCurrencySymbol() {
            const currencies = this.$store.state.currencies || [];
            const defaultCurrency = currencies.find(c => c.isDefault);
            return defaultCurrency ? defaultCurrency.symbol : 'Нет валюты';
        },
    },
    mounted() {
        this.$nextTick(async () => {
            if (this.preselectedOrderIds.length > 0) {
                await this.loadPreselectedOrders();
            }
            
            this.saveInitialState();
        });

        document.addEventListener('click', this.handleClickOutside);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside);
    },
    methods: {
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
            
            if (this.editingItem.orders) {
                this.selectedOrders = [...this.editingItem.orders];
            }
            
            this.$nextTick(() => {
                if (this.$refs.orderSearch && this.editingItem.products) {
                    const productsFromInvoice = this.editingItem.products.map(product => {
                        let orderId = null;
                        // Пытаемся найти заказ по order_id из продукта
                        if (product.orderId || product.order_id) {
                            orderId = product.orderId || product.order_id;
                        } else if (this.editingItem.orders && this.editingItem.orders.length > 0) {
                            // Если order_id нет, ищем по названию товара
                            const matchingOrder = this.editingItem.orders.find(order => 
                                order.products && order.products.some(op => 
                                    op.productName === product.productName ||
                                    op.product_id === product.productId ||
                                    op.id === product.productId
                                )
                            );
                            if (matchingOrder) {
                                orderId = matchingOrder.id;
                            } else if (this.editingItem.orders.length === 1) {
                                // Если заказ только один, используем его ID
                                orderId = this.editingItem.orders[0].id;
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
                            productImage: null,
                            orderId: orderId,
                            type: 1,
                            imgUrl() {
                                return null;
                            },
                            icons() {
                                return '<i class="fas fa-box text-[#3571A4]" title="Товар"></i>';
                            }
                        };
                    });
                    
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
                
                if (this.selectedOrders[0]?.client) {
                    this.selectedClient = this.selectedOrders[0].client;
                }
            } catch (error) {
                this.showNotification(this.$t('errorLoadingOrdersData'), error.message, true);
            }
        },



        async save() {
            const validationErrors = [];
            
            if (!this.selectedClient) {
                validationErrors.push('Поле "Клиент" обязательно для заполнения');
            }

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
                const products = orderSearch ? orderSearch.allProductsFromOrders : [];
                const totalAmount = orderSearch ? orderSearch.subtotal : 0;
                
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
                    client_id: this.selectedClient?.id,
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
            this.resetFormChanges();
        },

        closeModal() {
            this.closeForm();
        },
        togglePdfDropdown() {
            this.showPdfDropdown = !this.showPdfDropdown;
        },
        handleClickOutside(event) {
            if (this.showPdfDropdown && !event.target.closest('.relative')) {
                this.showPdfDropdown = false;
            }
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
                this.pdfVariant.forEach(variant => {
                    generateInvoicePdf(this.editingItem, null, variant);
                });
                this.showNotification(this.$t('pdfGenerated'), '', false);
                this.showPdfDropdown = false;
            } catch (error) {
                this.showNotification(this.$t('error'), this.$t('errorGeneratingPdf'), true);
            }
        },

        printPdf() {
            if (!this.editingItem) {
                this.showNotification(this.$t('error'), this.$t('saveInvoiceFirst'), true);
                return;
            }

            if (this.pdfVariant.length === 0) {
                this.showNotification(this.$t('error'), 'Выберите вариант PDF', true);
                return;
            }

            try {
                this.pdfVariant.forEach(variant => {
                    this.generateInvoicePdfForPrint(this.editingItem, null, variant);
                });
                // Не показываем уведомление сразу, оно будет показано после печати
                this.showPdfDropdown = false;
            } catch (error) {
                this.showNotification(this.$t('error'), this.$t('errorGeneratingPdf'), true);
            }
        },

        generateInvoicePdfForPrint(invoice, companyData = null, variant = 'short') {
            const defaultCompanyData = {
                name: 'LEBIZLI TURKMEN',
                address: 'Aşgabat şäheri, Berkararlyk etraby, 2127 (G. Gulyýew) köçesi, 26A H/H',
                tax_id: '23202934173861407785000',
                warehouse_id: '23202000173861807785000',
                email: 'lebizliturkmen@mail.ru',
                phone: '+993 12 45-26-17'
            };

            // Устанавливаем шрифты
            if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
                pdfMake.vfs = pdfFonts.pdfMake.vfs;
            } else if (pdfFonts && pdfFonts.vfs) {
                pdfMake.vfs = pdfFonts.vfs;
            } else {
                pdfMake.vfs = {};
            }

            // Создаем генератор PDF
            const generator = new InvoicePdfGenerator(invoice, companyData || defaultCompanyData, variant);
            const documentDefinition = generator.generateDocument();
            
            // Создаем PDF и открываем для печати
            const pdfDoc = pdfMake.createPdf(documentDefinition);
            pdfDoc.getBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const iframe = document.createElement('iframe');
                iframe.style.position = 'fixed';
                iframe.style.right = '0';
                iframe.style.bottom = '0';
                iframe.style.width = '0';
                iframe.style.height = '0';
                iframe.style.border = 'none';
                iframe.src = url;
                document.body.appendChild(iframe);
                
                // Используем замыкание для хранения состояния
                const printState = {
                    printStarted: false,
                    cleanupTimeout: null,
                    iframeElement: iframe,
                    blobUrl: url
                };
                
                const cleanup = () => {
                    if (document.body.contains(printState.iframeElement)) {
                        document.body.removeChild(printState.iframeElement);
                    }
                    URL.revokeObjectURL(printState.blobUrl);
                    if (printState.cleanupTimeout) {
                        clearTimeout(printState.cleanupTimeout);
                        printState.cleanupTimeout = null;
                    }
                };
                
                // Ждем загрузки и печатаем
                iframe.onload = () => {
                    // Небольшая задержка для полной загрузки PDF (нужна для корректной печати)
                    setTimeout(() => {
                        const printWindow = iframe.contentWindow;
                        
                        // Обработчик для завершения печати
                        const handleAfterPrint = () => {
                            // Небольшая задержка, чтобы диалог успел закрыться
                            setTimeout(() => {
                                cleanup();
                                this.showNotification(this.$t('pdfGenerated'), '', false);
                            }, 500);
                            
                            // Удаляем обработчики
                            printWindow.removeEventListener('afterprint', handleAfterPrint);
                            window.removeEventListener('afterprint', handleAfterPrint);
                        };
                        
                        // Добавляем обработчики на оба окна
                        printWindow.addEventListener('afterprint', handleAfterPrint);
                        window.addEventListener('afterprint', handleAfterPrint);
                        
                        // Запускаем печать
                        printWindow.print();
                    }, 300);
                };
                
                // Обработка ошибки загрузки
                iframe.onerror = () => {
                    cleanup();
                    this.showNotification(this.$t('error'), this.$t('errorGeneratingPdf'), true);
                };
            });
        },

        formatDateTimeForInput(dateString) {
            if (!dateString) return new Date().toISOString().slice(0, 16);
            const date = new Date(dateString);
            return date.toISOString().slice(0, 16);
        }
    },
    watch: {
        editingItem: {
            handler(newEditingItem, oldEditingItem) {
                if (newEditingItem) {
                    this.loadEditingData();
                } else {
                    if (oldEditingItem !== undefined) {
                        this.clearForm();
                    }
                }
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

<template>
    <div class="flex flex-col h-full">
        <div class="flex flex-col overflow-auto h-full p-4 pb-24">
            <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editInvoice') : $t('createInvoice') }}</h2>

            <div class="mb-4">
                <h3 class="text-md font-semibold mb-3">{{ $t('basicInformation') }}</h3>
                <div class="space-y-4">
                    <div>
                        <ClientSearch :selectedClient="selectedClient" @update:selectedClient="selectedClient = $event" :required="true" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('invoiceDate') }}</label>
                        <input type="datetime-local" v-model="formData.invoice_date" class="w-full p-2 border rounded h-10"
                            :disabled="editingItemId && !canEditDate()"
                            :min="this.getMinDate()" />
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
                <OrderSearch ref="orderSearch" v-model="selectedOrders" @change="loadOrdersData"
                    :currency-symbol="defaultCurrencySymbol" @update:subtotal="formData.subtotal = $event"
                    :readonly="!!editingItemId" @order-click="handleOrderClick" />
            </div>
        </div>

        <div class="fixed bottom-0 left-0 right-0 p-4 flex items-center justify-between bg-[#edf4fb] gap-4 flex-wrap md:flex-nowrap border-t border-gray-200 z-10">
            <div class="flex items-center space-x-2">
                <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :aria-label="$t('save')">
                </PrimaryButton>
                <div v-if="editingItemId" class="flex items-center space-x-2">
                    <div class="relative">
                        <PrimaryButton :onclick="togglePdfDropdown" :icon="'fas fa-file-pdf'" class="px-3 py-2" :aria-label="$t('pdfMenu')">
                            <i :class="showPdfDropdown ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" class="ml-2"></i>
                        </PrimaryButton>

                        <div v-if="showPdfDropdown"
                            class="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                            <div class="py-1">
                                <label
                                    class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                                    <input type="checkbox" v-model="pdfVariant" value="short"
                                        class="mr-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                    {{ $t('shortPdf') }}
                                </label>
                                <label
                                    class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                                    <input type="checkbox" v-model="pdfVariant" value="detailed"
                                        class="mr-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                    {{ $t('detailedPdf') }}
                                </label>
                                <div class="border-t border-gray-100">
                                    <button @click="generatePdf"
                                        class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                                        <i class="fas fa-download mr-2"></i>
                                        {{ $t('downloadSelected') }}
                                    </button>
                                    <button @click="printPdf"
                                        class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
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

        <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose" :descr="$t('unsavedChanges')"
            :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />

        <SideModalDialog v-if="orderModalOpen" :showForm="orderModalOpen" :onclose="closeOrderModal">
            <template v-if="orderLoading">
                <div class="min-h-64">
                    <TableSkeleton />
                </div>
            </template>
            <OrderCreatePage 
                v-else-if="selectedOrder"
                :key="selectedOrder.id"
                :editingItem="selectedOrder"
                @saved="handleOrderSaved"
                @saved-error="handleOrderSavedError"
                @deleted="handleOrderDeleted"
                @deleted-error="handleOrderDeletedError"
                @close-request="closeOrderModal" />
        </SideModalDialog>
    </div>
</template>

<script>
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import ClientSearch from "@/views/components/app/search/ClientSearch.vue";
import OrderSearch from "@/views/components/app/search/OrderSearch.vue";
import AlertDialog from "@/views/components/app/dialog/AlertDialog.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import TableSkeleton from "@/views/components/app/TableSkeleton.vue";
import InvoiceController from "@/api/InvoiceController";
import OrderController from "@/api/OrderController";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import notificationMixin from "@/mixins/notificationMixin";
import formChangesMixin from "@/mixins/formChangesMixin";
import crudFormMixin from "@/mixins/crudFormMixin";
import dateFormMixin from "@/mixins/dateFormMixin";
import { generateInvoicePdf, InvoicePdfGenerator } from "@/utils/pdfUtils";
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { defineAsyncComponent } from "vue";

export default {
    mixins: [getApiErrorMessage, notificationMixin, formChangesMixin, crudFormMixin, dateFormMixin],
    emits: ["saved", "saved-error", "deleted", "deleted-error", "close-request"],
    components: {
        PrimaryButton,
        ClientSearch,
        OrderSearch,
        AlertDialog,
        SideModalDialog,
        TableSkeleton,
        OrderCreatePage: defineAsyncComponent(() => 
            import("@/views/pages/orders/OrderCreatePage.vue")
        )
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
            selectedOrders: [],
            selectedClient: null,
            currencySymbol: '',
            formData: {
                client_id: null,
                invoice_date: (() => {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const day = String(now.getDate()).padStart(2, '0');
                    const hours = String(now.getHours()).padStart(2, '0');
                    const minutes = String(now.getMinutes()).padStart(2, '0');
                    return `${year}-${month}-${day}T${hours}:${minutes}`;
                })(),
                status: 'new',
                note: '',
                order_ids: [],
                subtotal: 0
            },
            pdfVariant: ['short'],
            showPdfDropdown: false,
            orderModalOpen: false,
            selectedOrder: null,
            orderLoading: false
        };
    },
    computed: {
        defaultCurrencySymbol() {
            const currencies = this.$store.state.currencies || [];
            const defaultCurrency = currencies.find(c => c.isDefault);
            return defaultCurrency ? defaultCurrency.symbol : this.$t('noCurrency');
        },
    },
    mounted() {
        this.$nextTick(async () => {
            if (this.preselectedOrderIds?.length) {
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


        async loadPreselectedOrders() {
            try {
                if (!this.preselectedOrderIds?.length) {
                    return;
                }

                const orderPromises = this.preselectedOrderIds.map(id =>
                    OrderController.getItem(id)
                );
                const orders = await Promise.all(orderPromises);

                this.selectedOrders = orders.filter(order => order !== null);

                this.loadOrdersData();
            } catch (error) {
                this.showNotification(this.$t('errorLoadingOrders'), error.message, true);
            }
        },

        async loadOrdersData() {
            if (!this.selectedOrders?.length) {
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



        prepareSave() {
            const validationErrors = [];

            if (!this.selectedClient) {
                validationErrors.push(this.$t('validationClientRequired'));
            }

            const orderSearch = this.$refs.orderSearch;
            if (!orderSearch?.allProductsFromOrders?.length) {
                validationErrors.push(this.$t('validationOrdersWithProductsRequired'));
            }

            if (validationErrors?.length) {
                this.$emit('saved-error', validationErrors.join('\n'));
                throw new Error(validationErrors.join('\n'));
            }

            const products = orderSearch ? orderSearch.allProductsFromOrders : [];
            const totalAmount = orderSearch ? orderSearch.subtotal : 0;

            const invoiceProducts = products.map(product => {
                const quantity = parseFloat(product.quantity || 0);
                const price = parseFloat(product.price || 0);
                const totalPrice = product.totalPrice || product.total_price || (quantity * price);

                return {
                    product_id: product.productId || null,
                    product_name: product.productName || product.name,
                    product_description: product.productDescription,
                    quantity: quantity,
                    price: price,
                    total_price: totalPrice,
                    unit_id: product.unitId || null,
                    unit_name: product.unitName || product.unitShortName
                };
            });

            return {
                ...this.formData,
                client_id: this.selectedClient?.id,
                order_ids: this.editingItemId ? this.formData.order_ids : this.selectedOrders.map(o => o.id),
                products: invoiceProducts,
                total_amount: totalAmount,
                status: this.formData.status || (this.editingItemId && this.editingItem ? this.editingItem.status : 'new')
            };
        },
        async performSave(data) {
            if (this.editingItemId) {
                return await InvoiceController.updateItem(this.editingItemId, data);
            } else {
                return await InvoiceController.storeItem(data);
            }
        },
        onSaveSuccess(response) {
            this.clearForm();
        },


        clearForm() {
            this.selectedClient = null;
            this.formData = {
                invoice_date: this.getCurrentLocalDateTime(),
                status: 'new',
                note: '',
                order_ids: [],
                subtotal: 0
            };
            this.selectedOrders = [];
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            if (newEditingItem) {
                this.selectedClient = newEditingItem.client || null;
                
                this.formData = {
                    invoice_date: newEditingItem.invoiceDate ? this.getFormattedDate(newEditingItem.invoiceDate) : this.getCurrentLocalDateTime(),
                    status: newEditingItem.status || 'new',
                    note: newEditingItem.note,
                    order_ids: newEditingItem.orders ? newEditingItem.orders.map(o => o.id) : []
                };
                
                if (newEditingItem.orders) {
                    this.selectedOrders = [...newEditingItem.orders];
                }
                
                this.$nextTick(() => {
                    if (this.$refs.orderSearch && newEditingItem.products) {
                        const productsFromInvoice = newEditingItem.products.map(product => {
                            let orderId = null;
                            if (product.orderId || product.order_id) {
                                orderId = product.orderId || product.order_id;
                            } else if (newEditingItem.orders?.length) {
                                const matchingOrder = newEditingItem.orders.find(order => 
                                    order.products?.some(op => 
                                        op.productName === product.productName ||
                                        op.product_id === product.productId ||
                                        op.id === product.productId
                                    )
                                );
                                if (matchingOrder) {
                                    orderId = matchingOrder.id;
                                } else if (newEditingItem.orders.length === 1) {
                                    orderId = newEditingItem.orders[0].id;
                                }
                            }
                            
                            const quantity = parseFloat(product.quantity || 0);
                            const price = parseFloat(product.price || 0);
                            const totalPrice = product.totalPrice || product.total_price || (quantity * price);
                            
                            return {
                                id: product.id,
                                productId: product.productId,
                                productName: product.productName,
                                name: product.productName,
                                productDescription: product.productDescription,
                                quantity: quantity,
                                price: price,
                                totalPrice: totalPrice,
                                total_price: totalPrice,
                                unitId: product.unitId,
                                unitName: product.unitName,
                                unitShortName: product.unitShortName,
                                orderId: orderId
                            };
                        });
                        
                        if (this.$refs.orderSearch) {
                            this.$refs.orderSearch.setProductsFromInvoice(productsFromInvoice);
                        }
                    }
                });
            }
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
            if (!this.editingItemId || !this.editingItem) {
                this.showNotification(this.$t('error'), this.$t('saveInvoiceFirst'), true);
                return;
            }

            if (!this.pdfVariant?.length) {
                this.showNotification(this.$t('error'), this.$t('selectPdfVariant'), true);
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
            if (!this.editingItemId || !this.editingItem) {
                this.showNotification(this.$t('error'), this.$t('saveInvoiceFirst'), true);
                return;
            }

            if (!this.pdfVariant?.length) {
                this.showNotification(this.$t('error'), this.$t('selectPdfVariant'), true);
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

        async handleOrderClick(order) {
            try {
                this.orderLoading = true;
                const fullOrder = await OrderController.getItem(order.id);
                this.selectedOrder = fullOrder;
                this.orderModalOpen = true;
            } catch (error) {
                this.showNotification(this.$t('error'), this.getApiErrorMessage(error), true);
            } finally {
                this.orderLoading = false;
            }
        },

        closeOrderModal() {
            this.orderModalOpen = false;
            this.selectedOrder = null;
        },

        async handleOrderSaved() {
            this.closeOrderModal();
            if (this.$refs.orderSearch) {
                await this.loadOrdersData();
            }
        },

        handleOrderSavedError(error) {
            const errorMessage = this.getApiErrorMessage(error);
            this.showNotification(this.$t('error'), errorMessage, true);
        },

        async handleOrderDeleted() {
            this.closeOrderModal();
            if (this.$refs.orderSearch) {
                const orderId = this.selectedOrder?.id;
                if (orderId) {
                    this.selectedOrders = this.selectedOrders.filter(o => o.id !== orderId);
                    await this.loadOrdersData();
                }
            }
        },

        handleOrderDeletedError(error) {
            const errorMessage = this.getApiErrorMessage(error);
            this.showNotification(this.$t('error'), errorMessage, true);
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

            if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
                pdfMake.vfs = pdfFonts.pdfMake.vfs;
            } else if (pdfFonts && pdfFonts.vfs) {
                pdfMake.vfs = pdfFonts.vfs;
            } else {
                pdfMake.vfs = {};
            }

            const generator = new InvoicePdfGenerator(invoice, companyData || defaultCompanyData, variant);
            const documentDefinition = generator.generateDocument();

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

                iframe.onload = () => {
                    setTimeout(() => {
                        const printWindow = iframe.contentWindow;

                        const handleAfterPrint = () => {
                            setTimeout(() => {
                                cleanup();
                                this.showNotification(this.$t('pdfGenerated'), '', false);
                            }, 500);

                            printWindow.removeEventListener('afterprint', handleAfterPrint);
                            window.removeEventListener('afterprint', handleAfterPrint);
                        };

                        printWindow.addEventListener('afterprint', handleAfterPrint);
                        window.addEventListener('afterprint', handleAfterPrint);

                        printWindow.print();
                    }, 300);
                };

                iframe.onerror = () => {
                    cleanup();
                    this.showNotification(this.$t('error'), this.$t('errorGeneratingPdf'), true);
                };
            });
        },

    },
    watch: {
        preselectedOrderIds: {
            handler(newIds) {
                if (newIds?.length) {
                    this.loadPreselectedOrders();
                }
            },
            immediate: true
        }
    }
};
</script>

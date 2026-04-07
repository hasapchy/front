<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="flex min-h-0 flex-1 flex-col overflow-auto p-4">
      <div class="mb-4">
        <h3 class="text-md font-semibold mb-3">
          {{ $t('basicInformation') }}
        </h3>
        <div class="space-y-4">
          <div>
            <ClientSearch
              :selected-client="selectedClient"
              :required="true"
              @update:selected-client="selectedClient = $event"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('invoiceDate') }}</label>
            <input
              v-model="formData.invoiceDate"
              type="datetime-local"
              class="w-full p-2 border rounded h-10"
              :disabled="editingItemId && !canEditDate()"
              :min="getMinDate()"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('status') }}</label>
            <select
              v-model="formData.status"
              class="w-full p-2 border rounded h-10"
            >
              <option value="new">
                {{ $t('new') }}
              </option>
              <option value="in_progress">
                {{ $t('inProgress') }}
              </option>
              <option value="paid">
                {{ $t('paid') }}
              </option>
              <option value="cancelled">
                {{ $t('cancelled') }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('note') }}</label>
            <textarea
              v-model="formData.note"
              rows="3"
              class="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>

      <div class="mb-4">
        <OrderSearch
          ref="orderSearch"
          v-model="selectedOrders"
          :currency-symbol="defaultCurrencySymbol"
          :fallback-client="selectedClient"
          :readonly="!!editingItemId"
          @change="loadOrdersData"
          @update:subtotal="formData.subtotal = $event"
          @order-click="handleOrderClick"
        />
      </div>
    </div>

    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center justify-between gap-4 md:flex-nowrap">
        <div class="flex items-center space-x-2">
          <PrimaryButton
            icon="fas fa-save"
            :onclick="save"
            :is-loading="saveLoading"
            :aria-label="$t('save')"
          />
          <div
            v-if="editingItemId"
            class="flex items-center space-x-2"
          >
            <div class="relative">
              <PrimaryButton
                :onclick="togglePdfDropdown"
                :icon="'fas fa-file-pdf'"
                class="px-3 py-2"
                :aria-label="$t('pdfMenu')"
              >
                <i
                  :class="showPdfDropdown ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
                  class="ml-2"
                />
              </PrimaryButton>

              <div
                v-if="showPdfDropdown"
                class="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200"
              >
                <div class="py-1">
                  <label
                    class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      v-model="pdfVariant"
                      type="checkbox"
                      value="short"
                      class="mr-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    >
                    {{ $t('shortPdf') }}
                  </label>
                  <label
                    class="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      v-model="pdfVariant"
                      type="checkbox"
                      value="detailed"
                      class="mr-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    >
                    {{ $t('detailedPdf') }}
                  </label>
                  <div class="border-t border-gray-100">
                    <button
                      class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      @click="generatePdf"
                    >
                      <i class="fas fa-download mr-2" />
                      {{ $t('downloadSelected') }}
                    </button>
                    <button
                      class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      @click="printPdf"
                    >
                      <i class="fas fa-print mr-2" />
                      {{ $t('print') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <AlertDialog
      :dialog="closeConfirmDialog"
      :descr="$t('unsavedChanges')"
      :confirm-text="$t('closeWithoutSaving')"
      :leave-text="$t('stay')"
      @confirm="confirmClose"
      @leave="cancelClose"
    />

    <SideModalDialog
      v-if="orderModalOpen"
      :show-form="orderModalOpen"
      :title="invoiceOrderSubModalTitle"
      :level="2"
      :onclose="closeOrderModal"
    >
      <template v-if="orderLoading">
        <div class="min-h-64">
          <TableSkeleton />
        </div>
      </template>
      <OrderCreatePage 
        v-else-if="selectedOrder"
        :key="selectedOrder.id"
        :editing-item="selectedOrder"
        @saved="handleOrderSaved"
        @saved-error="handleOrderSavedError"
        @deleted="handleOrderDeleted"
        @deleted-error="handleOrderDeletedError"
        @close-request="closeOrderModal"
      />
    </SideModalDialog>
  </div>
</template>

<script>
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import ClientSearch from "@/views/components/app/search/ClientSearch.vue";
import OrderSearch from "@/views/components/app/search/OrderSearch.vue";
import AlertDialog from "@/views/components/app/dialog/AlertDialog.vue";
import SideModalDialog, { sideModalCrudTitle, sideModalFooterPortal } from "@/views/components/app/dialog/SideModalDialog.vue";
import TableSkeleton from "@/views/components/app/TableSkeleton.vue";
import InvoiceController from "@/api/InvoiceController";
import OrderController from "@/api/OrderController";
import OrderCreatePage from "@/views/pages/orders/OrderCreatePage.vue";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import notificationMixin from "@/mixins/notificationMixin";
import crudFormMixin from "@/mixins/crudFormMixin";
import { dateFormMixin } from '@/utils/dateUtils';
import { getCurrentLocalDateTime } from "@/utils/dateUtils";
import { generateInvoicePdf, InvoicePdfGenerator } from "@/utils/pdfUtils";

export default {
    mixins: [getApiErrorMessage, notificationMixin, crudFormMixin, dateFormMixin, sideModalFooterPortal],
    emits: ["saved", "saved-error", "deleted", "deleted-error", "close-request"],
    components: {
        PrimaryButton,
        ClientSearch,
        OrderSearch,
        AlertDialog,
        SideModalDialog,
        TableSkeleton,
        OrderCreatePage
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
                clientId: null,
                invoiceDate: getCurrentLocalDateTime(),
                status: 'new',
                note: '',
                orderIds: [],
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
        invoiceOrderSubModalTitle() {
            if (!this.orderModalOpen) {
                return '';
            }
            if (this.orderLoading) {
                return this.$t('loading');
            }
            return sideModalCrudTitle(this.$t.bind(this), {
                item: this.selectedOrder,
                entityGenitiveKey: 'sideModalGenOrder',
                entityNominativeKey: 'sideModalNomOrder',
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
                invoiceDate: this.formData.invoiceDate,
                status: this.formData.status,
                note: this.formData.note,
                orderIds: this.formData.orderIds,
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
                this.formData.orderIds = [];
                return;
            }

            try {
                const orderIds = this.selectedOrders.map(order => order.id);
                this.formData.orderIds = orderIds;

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
                this.emitSavedError(validationErrors.join('\n'));
                throw new Error(validationErrors.join('\n'));
            }

            const products = orderSearch ? orderSearch.allProductsFromOrders : [];
            const totalAmount = orderSearch ? orderSearch.subtotal : 0;

            const invoiceProducts = products.map(product => {
                const quantity = parseFloat(product.quantity || 0);
                const price = parseFloat(product.price || 0);
                const totalPrice = product.totalPrice || (quantity * price);

                return {
                    productId: product.productId || null,
                    orderId: product.orderId != null && product.orderId !== '' ? product.orderId : null,
                    productName: product.productName || product.name,
                    productDescription: product.productDescription,
                    quantity: quantity,
                    price: price,
                    totalPrice: totalPrice,
                    unitId: product.unitId || null,
                    unitShortName: product.unitShortName
                };
            });

            return {
                ...this.formData,
                clientId: this.selectedClient?.id,
                orderIds: this.editingItemId ? this.formData.orderIds : this.selectedOrders.map(o => o.id),
                products: invoiceProducts,
                totalAmount: totalAmount,
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
        onSaveSuccess() {
            this.clearForm();
        },


        clearForm() {
            this.selectedClient = null;
            this.formData = {
                clientId: null,
                invoiceDate: this.getCurrentLocalDateTime(),
                status: 'new',
                note: '',
                orderIds: [],
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
                    clientId: null,
                    invoiceDate: newEditingItem.invoiceDate ? this.getFormattedDate(newEditingItem.invoiceDate) : this.getCurrentLocalDateTime(),
                    status: newEditingItem.status || 'new',
                    note: newEditingItem.note,
                    orderIds: newEditingItem.orders ? newEditingItem.orders.map(o => o.id) : []
                };
                
                if (newEditingItem.orders) {
                    this.selectedOrders = [...newEditingItem.orders];
                }
                
                this.$nextTick(() => {
                    if (this.$refs.orderSearch && newEditingItem.products) {
                        const productsFromInvoice = newEditingItem.products.map(product => {
                            const orderId = product.orderId ?? null;
                            const quantity = parseFloat(product.quantity || 0);
                            const price = parseFloat(product.price || 0);
                            const totalPrice = product.totalPrice || (quantity * price);
                            
                            return {
                                id: product.id,
                                productId: product.productId,
                                productName: product.productName,
                                name: product.productName,
                                productDescription: product.productDescription,
                                quantity: quantity,
                                price: price,
                                totalPrice: totalPrice,
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
        async generatePdf() {
            if (!this.editingItemId || !this.editingItem) {
                this.showNotification(this.$t('error'), this.$t('saveInvoiceFirst'), true);
                return;
            }

            if (!this.pdfVariant?.length) {
                this.showNotification(this.$t('error'), this.$t('selectPdfVariant'), true);
                return;
            }

            try {
                await Promise.all(this.pdfVariant.map((variant) => generateInvoicePdf(this.editingItem, null, variant)));
                this.showNotification(this.$t('pdfGenerated'), '', false);
                this.showPdfDropdown = false;
            } catch {
                this.showNotification(this.$t('error'), this.$t('errorGeneratingPdf'), true);
            }
        },

        async printPdf() {
            if (!this.editingItemId || !this.editingItem) {
                this.showNotification(this.$t('error'), this.$t('saveInvoiceFirst'), true);
                return;
            }

            if (!this.pdfVariant?.length) {
                this.showNotification(this.$t('error'), this.$t('selectPdfVariant'), true);
                return;
            }

            try {
                await Promise.all(this.pdfVariant.map((variant) => this.generateInvoicePdfForPrint(this.editingItem, null, variant)));
                // Не показываем уведомление сразу, оно будет показано после печати
                this.showPdfDropdown = false;
            } catch {
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

        async generateInvoicePdfForPrint(invoice, companyData = null, variant = 'short') {
            const defaultCompanyData = {
                name: 'LEBIZLI TURKMEN',
                address: 'Aşgabat şäheri, Berkararlyk etraby, 2127 (G. Gulyýew) köçesi, 26A H/H',
                tax_id: '23202934173861407785000',
                warehouse_id: '23202000173861807785000',
                email: 'lebizliturkmen@mail.ru',
                phone: '+993 12 45-26-17'
            };

            const [{ default: pdfMake }, { default: pdfFonts }] = await Promise.all([
                import('pdfmake/build/pdfmake'),
                import('pdfmake/build/vfs_fonts')
            ]);
            pdfMake.vfs = pdfFonts?.pdfMake?.vfs ?? pdfFonts?.vfs ?? {};

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

    }
};
</script>

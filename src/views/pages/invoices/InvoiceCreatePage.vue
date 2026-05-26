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
              :disabled="!canChangeInvoiceStatus"
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
          @orders-sync-error="handleOrdersSyncError"
        />
      </div>
    </div>

    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center justify-between gap-4 md:flex-nowrap">
        <div class="flex flex-wrap items-center gap-2">
          <PrimaryButton
            icon="fas fa-save"
            :onclick="save"
            :is-loading="saveLoading"
            :aria-label="$t('save')"
          />
          <div
            v-if="editingItemId"
            class="flex items-center gap-2"
          >
            <PrimaryButton
              :is-info="true"
              :onclick="openPdfModal"
              icon="fas fa-file-pdf"
              class="px-3 py-2"
              :aria-label="$t('pdfMenu')"
            />
          </div>
        </div>

        <div
          v-if="formData.subtotal > 0 || selectedOrders.length"
          class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-gray-800 dark:text-[var(--text-primary)]"
        >
          <div>
            {{ $t('subtotal') }}:
            <span class="font-bold tabular-nums">{{ invoiceSubtotalFormatted }}</span>
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

    <teleport to="body">
      <div
        v-if="showPdfModal"
        data-app-overlay-dialog
        class="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 dark:bg-black/55"
        role="presentation"
        @click.self="closePdfModal"
      >
        <div
          role="dialog"
          aria-modal="true"
          :aria-label="$t('pdfMenu')"
          class="w-full max-w-md overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-xl"
          @click.stop
        >
          <div class="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
            <h2 class="text-base font-semibold text-[var(--text-primary)]">
              {{ $t('pdfMenu') }}
            </h2>
            <button
              type="button"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
              :aria-label="$t('close')"
              @click="closePdfModal"
            >
              <i class="fas fa-times text-base leading-none" />
            </button>
          </div>
          <div class="p-4">
            <div class="space-y-1">
              <label
                class="flex cursor-pointer items-center rounded-md px-3 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
              >
                <input
                  v-model="pdfVariant"
                  type="checkbox"
                  value="short"
                  class="mr-3 shrink-0 rounded border-[var(--input-border)] text-[var(--nav-accent)] focus:ring-[var(--nav-accent)] dark:bg-[var(--surface-muted)]"
                >
                {{ $t('shortPdf') }}
              </label>
              <label
                class="flex cursor-pointer items-center rounded-md px-3 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
              >
                <input
                  v-model="pdfVariant"
                  type="checkbox"
                  value="detailed"
                  class="mr-3 shrink-0 rounded border-[var(--input-border)] text-[var(--nav-accent)] focus:ring-[var(--nav-accent)] dark:bg-[var(--surface-muted)]"
                >
                {{ $t('detailedPdf') }}
              </label>
            </div>
            <div class="mt-4 flex flex-col gap-2 border-t border-[var(--border-subtle)] pt-4 sm:flex-row sm:flex-wrap sm:justify-end">
              <PrimaryButton
                :is-light="true"
                :onclick="closePdfModal"
              >
                {{ $t('cancel') }}
              </PrimaryButton>
              <PrimaryButton
                icon="fas fa-download"
                :onclick="generatePdf"
              >
                {{ $t('downloadSelected') }}
              </PrimaryButton>
              <PrimaryButton
                :is-info="true"
                icon="fas fa-print"
                :onclick="printPdf"
              >
                {{ $t('print') }}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </teleport>

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
import { formatCurrencyWithRounding } from '@/utils/numberUtils';
import { generateInvoicePdf, printInvoicePdf } from "@/utils/pdfUtils";

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
            showPdfModal: false,
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
        invoiceSubtotalFormatted() {
            return formatCurrencyWithRounding(
                this.formData.subtotal,
                this.defaultCurrencySymbol,
                true,
                'order',
            );
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
        canUpdateInvoice() {
            return this.$store.getters.hasPermission('invoices_update')
                || this.$store.getters.hasPermission('invoices_update_all');
        },
        canChangeInvoiceStatus() {
            return !this.editingItemId || this.canUpdateInvoice;
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
                status: this.canChangeInvoiceStatus
                    ? (this.formData.status || (this.editingItem?.status ?? 'new'))
                    : (this.editingItem?.status ?? 'new'),
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
        openPdfModal() {
            this.showPdfModal = true;
        },
        closePdfModal() {
            this.showPdfModal = false;
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
                await Promise.all(this.pdfVariant.map((variant) => generateInvoicePdf(
                    this.editingItem,
                    this.$store.state.currentCompany,
                    variant,
                )));
                this.showNotification(this.$t('pdfGenerated'), '', false);
                this.closePdfModal();
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
                await Promise.all(this.pdfVariant.map((variant) => printInvoicePdf(this.editingItem, {
                    variant,
                    company: this.$store.state.currentCompany,
                })));
                this.showNotification(this.$t('pdfGenerated'), '', false);
                this.closePdfModal();
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

        handleOrdersSyncError(error) {
            const message = typeof error === 'string'
                ? error
                : this.getApiErrorMessage(error);
            this.showNotification(this.$t('error'), message, true);
        },

    }
};
</script>

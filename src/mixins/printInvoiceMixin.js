import { printInvoicePdf } from "@/utils/pdfUtils";
import { getCurrentServerDateObject } from "@/utils/dateUtils";
import InvoiceController from "@/api/InvoiceController";
import { createPdfLineFromApiRow, sumInvoiceLineTotals } from "@/utils/invoiceOrderLinesUtils";

export default {
    methods: {
        async printInvoiceFromOrders(selectedOrders, variants) {
            if (!variants?.length || !selectedOrders?.length) {
                this.showNotification(this.$t('error'), this.$t('selectPdfVariant'), true);
                return;
            }

            try {
                const client = selectedOrders[0]?.client;
                
                if (!client) {
                    this.showNotification(this.$t('error'), this.$t('clientNotFoundInOrder'), true);
                    return;
                }

                const orderIds = selectedOrders.map((o) => o.id).filter(Boolean);
                const invoicePayload = await InvoiceController.getOrdersForInvoice(orderIds);
                const rows = invoicePayload.products || [];
                const getUnitShortName = (unitId) =>
                    this.$store?.getters?.getUnitShortName?.(unitId);
                const allProducts = rows.map((row) => createPdfLineFromApiRow(row, getUnitShortName));
                const totalAmount =
                    parseFloat(invoicePayload.total_amount) || sumInvoiceLineTotals(allProducts);

                const invoiceData = {
                    id: null,
                    invoiceDate: getCurrentServerDateObject().toISOString(),
                    client: client,
                    orders: selectedOrders,
                    products: allProducts,
                    totalAmount: totalAmount,
                    note: '',
                    status: 'new'
                };

                await Promise.all(variants.map((variant) => printInvoicePdf(invoiceData, {
                    variant,
                    company: this.$store.state.currentCompany,
                })));

                this.showNotification(this.$t('pdfGenerated'), '', false);
            } catch (error) {
                console.error('Ошибка в printInvoiceFromOrders:', error);
                this.showNotification(this.$t('error'), this.$t('errorGeneratingPdf'), true);
            }
        }
    }
};


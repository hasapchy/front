import { InvoicePdfGenerator } from "@/utils/pdfUtils";
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

export default {
    methods: {
        async printInvoiceFromOrders(selectedOrders, variants) {
            if (!variants?.length || !selectedOrders?.length) {
                this.showNotification(this.$t('error'), this.$t('selectPdfVariant'), true);
                return;
            }

            try {
                const allProducts = [];
                let totalAmount = 0;
                const client = selectedOrders[0]?.client;
                
                if (!client) {
                    this.showNotification(this.$t('error'), this.$t('clientNotFoundInOrder'), true);
                    return;
                }

                selectedOrders.forEach(order => {
                    order.products?.forEach(product => {
                        const quantity = parseFloat(product.quantity || 0);
                        const price = parseFloat(product.price || 0);
                        const totalPrice = quantity * price;
                        totalAmount += totalPrice;

                        allProducts.push({
                            productId: product.productId || product.id,
                            productName: product.productName || product.name,
                            productDescription: product.productDescription || '',
                            quantity,
                            price,
                            totalPrice,
                            unitId: product.unitId,
                            unitName: product.unitName || product.unitShortName || '',
                            getUnitName() {
                                return this.unitName || '';
                            }
                        });
                    });
                });

                const invoiceData = {
                    id: null,
                    invoiceDate: new Date().toISOString(),
                    client: client,
                    orders: selectedOrders,
                    products: allProducts,
                    totalAmount: totalAmount,
                    note: '',
                    status: 'new'
                };

                pdfMake.vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.vfs || {};

                const defaultCompanyData = {
                    name: 'LEBIZLI TURKMEN',
                    address: 'Aşgabat şäheri, Berkararlyk etraby, 2127 (G. Gulyýew) köçesi, 26A H/H',
                    tax_id: '23202934173861407785000',
                    warehouse_id: '23202000173861807785000',
                    email: 'lebizliturkmen@mail.ru',
                    phone: '+993 12 45-26-17'
                };

                variants.forEach(variant => {
                    const generator = new InvoicePdfGenerator(invoiceData, defaultCompanyData, variant);
                    const documentDefinition = generator.generateDocument();
                    const pdfDoc = pdfMake.createPdf(documentDefinition);
                    
                    pdfDoc.getBlob((blob) => {
                        const url = URL.createObjectURL(blob);
                        const iframe = document.createElement('iframe');
                        iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none';
                        iframe.src = url;
                        document.body.appendChild(iframe);
                        
                        const cleanup = () => {
                            if (iframe.parentNode) {
                                iframe.parentNode.removeChild(iframe);
                            }
                            URL.revokeObjectURL(url);
                        };
                        
                        iframe.onload = () => {
                            setTimeout(() => {
                                const printWindow = iframe.contentWindow;
                                const handleAfterPrint = () => {
                                    setTimeout(cleanup, 500);
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
                });

                this.showNotification(this.$t('pdfGenerated'), '', false);
            } catch (error) {
                console.error('Ошибка в printInvoiceFromOrders:', error);
                this.showNotification(this.$t('error'), this.$t('errorGeneratingPdf'), true);
            }
        }
    }
};


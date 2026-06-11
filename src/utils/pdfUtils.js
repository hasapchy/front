import { formatQuantity } from './numberUtils';
import { getPdfMakeWithFonts } from './pdfMakeSetup';
import { invoiceOrderGroupTitle, sumInvoiceLineTotals } from './invoiceOrderLinesUtils';

const EMPTY_COMPANY_PDF = {
  name: '',
  address: '',
  phone: '',
  registrationNumber: '',
  warehouseNumber: '',
  email: '',
};

/**
 * @param {unknown} value
 * @returns {string}
 */
function trimCompanyField(value) {
  return String(value ?? '').trim();
}

/**
 * @param {object|null|undefined} source
 * @returns {typeof EMPTY_COMPANY_PDF}
 */
function resolveCompanyPdfData(source) {
  if (!source) {
    return { ...EMPTY_COMPANY_PDF };
  }

  const fullName = trimCompanyField(source.fullName);
  const shortName = trimCompanyField(source.name);

  return {
    name: fullName || shortName,
    address: trimCompanyField(source.address),
    phone: trimCompanyField(source.phone),
    registrationNumber: trimCompanyField(source.registrationNumber),
    warehouseNumber: trimCompanyField(source.warehouseNumber),
    email: trimCompanyField(source.email),
  };
}

/**
 * @param {typeof EMPTY_COMPANY_PDF} company
 * @param {number} marginAfter
 * @returns {Array<Record<string, unknown>>}
 */
function buildCompanySupplierPdfBlocks(company, marginAfter = 15) {
  const blocks = [];

  if (company.name) {
    blocks.push({ text: company.name, margin: [0, 0, 0, 5] });
  }

  if (company.address) {
    blocks.push({ text: company.address, margin: [0, 0, 0, 5] });
  }

  const registrationLine = [
    company.registrationNumber,
    company.warehouseNumber ? `W/H ${company.warehouseNumber}` : '',
  ].filter(Boolean).join(' ');

  if (registrationLine) {
    blocks.push({ text: registrationLine, margin: [0, 0, 0, 5] });
  }

  if (company.phone) {
    blocks.push({ text: `Тел.: ${company.phone}`, margin: [0, 0, 0, 5] });
  }

  if (company.email) {
    blocks.push({ text: `Email: ${company.email}`, margin: [0, 0, 0, 5] });
  }

  if (blocks.length) {
    blocks[blocks.length - 1].margin = [0, 0, 0, marginAfter];
  }

  return blocks;
}

export class InvoicePdfGenerator {
  constructor(invoice, company, variant = 'short') {
    this.invoice = invoice;
    this.company = resolveCompanyPdfData(company);
    this.variant = variant;
  }

  // Генерируем документ для pdfmake
  generateDocument() {
    if (this.variant === 'detailed') {
      return this.generateDetailedDocument();
    } else {
      return this.generateShortDocument();
    }
  }

  /**
   * @param {unknown} value
   * @returns {boolean}
   */
  isValidCurrencySymbol(value) {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) {
      return false;
    }
    if (/^\d{4}-\d{2}-\d{2}([\sT]\d{2}:\d{2}:\d{2}.*)?Z?$/.test(trimmed)) {
      return false;
    }
    return trimmed !== 'Нет валюты';
  }

  /**
   * @param {object|null|undefined} [order]
   * @returns {string}
   */
  resolveCurrencyCode(order = null) {
    const candidate = order ?? this.invoice.orders?.[0];
    if (candidate?.currencyCode && this.isValidCurrencySymbol(candidate.currencyCode)) {
      return String(candidate.currencyCode).trim();
    }
    return 'TMT';
  }

  /**
   * @param {number|string|null|undefined} value
   * @param {string} [currencyCode]
   * @returns {string}
   */
  formatMoneyAmount(value, currencyCode) {
    const amount = parseFloat(value || 0).toFixed(2);
    const sym = currencyCode || this.resolveCurrencyCode();
    return `${amount} ${sym}`;
  }

  getCurrencyAmount() {
    return this.formatMoneyAmount(this.invoice.totalAmount, this.resolveCurrencyCode());
  }

  /**
   * @returns {boolean}
   */
  hasMixedOrderCurrencies() {
    const symbols = (this.invoice.orders || []).map((order) => this.resolveCurrencyCode(order));
    return new Set(symbols).size > 1;
  }

  /**
   * @returns {string}
   */
  getPriceColumnHeaderLabel() {
    if (this.hasMixedOrderCurrencies()) {
      return 'Цена';
    }
    return `Цена, ${this.resolveCurrencyCode()}`;
  }

  /**
   * @returns {string}
   */
  getAmountColumnHeaderLabel() {
    if (this.hasMixedOrderCurrencies()) {
      return 'Стоимость';
    }
    return `Стоимость, ${this.resolveCurrencyCode()}`;
  }

  /**
   * @param {object} order
   * @returns {string}
   */
  buildOrderGroupTitle(order) {
    const formattedDate = order.date
      ? new Date(order.date).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      : null;
    const currencySuffix = this.hasMixedOrderCurrencies()
      ? (order.currencyCode || this.resolveCurrencyCode(order))
      : null;
    return invoiceOrderGroupTitle(order.id, formattedDate, currencySuffix);
  }

  /**
   * @returns {string}
   */
  getInvoiceHeaderText() {
    const invoiceDate = new Date(this.invoice.invoiceDate).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const rawNumber = this.invoice.invoiceNumber ?? this.invoice.id;
    const number = rawNumber != null && String(rawNumber).trim() !== '' ? String(rawNumber).trim() : null;
    return number ? `СЧЕТ №${number} от ${invoiceDate}` : `СЧЕТ от ${invoiceDate}`;
  }

  // Краткий вариант документа
  generateShortDocument() {
    const productsTable = {
      table: {
        headerRows: 1,
        widths: [30, '*', 80, 80, 80],
        body: [
          [
            { text: '№', style: 'tableHeader', alignment: 'center' },
            { text: 'Наименование товара, работ, услуг', style: 'tableHeader' },
            { text: 'Кол-во', style: 'tableHeader', alignment: 'center' },
            { text: this.getPriceColumnHeaderLabel(), style: 'tableHeader', alignment: 'right' },
            { text: this.getAmountColumnHeaderLabel(), style: 'tableHeader', alignment: 'right' },
          ],
          ...this.invoice.products.map((product, index) => {
            const lineCurrency = this.resolveCurrencyCode(
              this.findOrderForProduct(product),
            );
            return [
              { text: (index + 1).toString(), alignment: 'center' },
              { text: product.productName },
              {
                text: `${formatQuantity(product.quantity)} ${product.getUnitName ? product.getUnitName() : (product.unitShortName || product.unit?.name || 'шт.')}`,
                alignment: 'center',
              },
              {
                text: this.formatMoneyAmount(product.price, lineCurrency),
                alignment: 'right',
              },
              {
                text: this.formatMoneyAmount(product.totalPrice, lineCurrency),
                alignment: 'right',
              },
            ];
          }),
        ],
      },
      layout: {
        hLineWidth: function () {
          return 1;
        },
        vLineWidth: function () {
          return 1;
        },
        hLineColor: function () {
          return '#000000';
        },
        vLineColor: function () {
          return '#000000';
        }
      }
    };

    const documentDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      defaultStyle: {
        fontSize: 10
      },
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 20]
        },
        sectionTitle: {
          fontSize: 12,
          bold: true,
          margin: [0, 10, 0, 5]
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: 'black'
        },
        total: {
          fontSize: 12,
          bold: true,
          alignment: 'right',
          margin: [0, 10, 0, 0]
        }
      },
      content: [
        {
          text: this.getInvoiceHeaderText(),
          style: 'header'
        },
        {
          canvas: [
            {
              type: 'line',
              x1: 0, y1: 0,
              x2: 515, y2: 0, // Ширина A4 минус отступы
              lineWidth: 2,
              lineColor: '#000000'
            }
          ],
          margin: [0, 10, 0, 20]
        },
        
        // Поставщик
        {
          text: 'Поставщик: (исполнитель)',
          style: 'sectionTitle',
        },
        ...buildCompanySupplierPdfBlocks(this.company, 15),
        
        // Покупатель
        {
          text: 'Покупатель: (заказчик)',
          style: 'sectionTitle'
        },
        ...(this.invoice.client ? [
          {
            text: this.invoice.client.phones && this.invoice.client.phones.length > 0 
              ? `${this.invoice.client.fullName()} (${this.invoice.client.phones[0].phone})`
              : this.invoice.client.fullName(),
            margin: [0, 0, 0, 5]
          },
          ...(this.invoice.client.address ? [{
            text: `Адрес: ${this.invoice.client.address}`,
            margin: [0, 0, 0, 5]
          }] : [])
        ] : [{
          text: 'Клиент не указан',
          margin: [0, 0, 0, 5]
        }]),
        
        // Таблица товаров
        {
          text: '',
          margin: [0, 0, 0, 10]
        },
        productsTable,
        
        // Итого
        {
          text: `Итого: ${this.getCurrencyAmount()}`,
          style: 'total'
        }
      ]
    };

    return documentDefinition;
  }

  // Подробный вариант документа с группировкой по заказам
  generateDetailedDocument() {
    // Группируем товары по заказам
    const ordersData = this.groupProductsByOrders();

    const documentDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      defaultStyle: {
        fontSize: 10
      },
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 20]
        },
        sectionTitle: {
          fontSize: 12,
          bold: true,
          margin: [0, 10, 0, 5]
        },
        orderTitle: {
          fontSize: 11,
          bold: true,
          margin: [0, 8, 0, 5],
          color: '#333'
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: 'black'
        },
        total: {
          fontSize: 12,
          bold: true,
          alignment: 'right',
          margin: [0, 10, 0, 0]
        }
      },
      content: [
        {
          text: this.getInvoiceHeaderText(),
          style: 'header'
        },
        {
          canvas: [
            {
              type: 'line',
              x1: 0, y1: 0,
              x2: 515, y2: 0,
              lineWidth: 2,
              lineColor: '#000000'
            }
          ],
          margin: [0, 10, 0, 20]
        },
        
        // Поставщик (сокращенная информация)
        {
          text: 'Поставщик: (исполнитель)',
          style: 'sectionTitle',
        },
        ...buildCompanySupplierPdfBlocks(this.company, 15),
        
        // Покупатель (только название)
        {
          text: 'Покупатель: (заказчик)',
          style: 'sectionTitle'
        },
        ...(this.invoice.client ? [
          {
            text: this.invoice.client.phones && this.invoice.client.phones.length > 0 
              ? `${this.invoice.client.fullName()} (${this.invoice.client.phones[0].phone})`
              : this.invoice.client.fullName(),
            margin: [0, 0, 0, 15]
          }
        ] : [{
          text: 'Клиент не указан',
          margin: [0, 0, 0, 15]
        }]),
        
        // Таблица товаров с группировкой по заказам
        ...this.generateDetailedProductsTable(ordersData),
        
        // Итого
        {
          text: `Итого к оплате: ${this.getCurrencyAmount()}`,
          style: 'total'
        }
      ]
    };

    return documentDefinition;
  }

  /**
   * @param {object} product
   * @returns {object|null}
   */
  findOrderForProduct(product) {
    const orderId = product?.orderId;
    if (orderId == null || !this.invoice.orders?.length) {
      return null;
    }
    return this.invoice.orders.find((o) => String(o.id) === String(orderId)) ?? null;
  }

  // Группируем товары по заказам
  groupProductsByOrders() {
    const ordersMap = new Map();
    
    // Если есть заказы в счете, используем их данные
    if (this.invoice.orders && this.invoice.orders.length > 0) {
      this.invoice.orders.forEach(order => {
        ordersMap.set(order.id, {
          id: order.id,
          name: `Заказ ${order.id}`,
          date: order.date || order.createdAt,
          currencyCode: this.resolveCurrencyCode(order),
          products: [],
        });
      });
    }
    
    // Группируем товары по заказам
    this.invoice.products.forEach((product) => {
      const orderId = product.orderId || (this.invoice.orders && this.invoice.orders.length > 0 ? this.invoice.orders[0].id : 'INV');
      
      if (!ordersMap.has(orderId)) {
        const order = this.findOrderForProduct({ orderId });
        ordersMap.set(orderId, {
          id: orderId,
          name: `Заказ ${orderId}`,
          date: order ? (order.date || order.createdAt) : null,
          currencyCode: this.resolveCurrencyCode(order),
          products: [],
        });
      }
      
      // Добавляем товар в заказ с правильной нумерацией
      const orderProducts = ordersMap.get(orderId).products;
      ordersMap.get(orderId).products.push({
        ...product,
        index: orderProducts.length + 1,
        // Сохраняем методы объекта
        getUnitName: product.getUnitName ? product.getUnitName.bind(product) : null
      });
    });
    
    return Array.from(ordersMap.values());
  }

  // Генерируем подробную таблицу товаров с группировкой
  generateDetailedProductsTable(ordersData) {
    const tableBody = [];
    let globalIndex = 1;
    tableBody.push([
      { text: '№', style: 'tableHeader', alignment: 'center' },
      { text: 'Наименование товаров, работ, услуг', style: 'tableHeader' },
      { text: 'Кол-во', style: 'tableHeader', alignment: 'center' },
      { text: this.getPriceColumnHeaderLabel(), style: 'tableHeader', alignment: 'right' },
      { text: this.getAmountColumnHeaderLabel(), style: 'tableHeader', alignment: 'right' },
    ]);
    
    ordersData.forEach(order => {
      const orderTitle = this.buildOrderGroupTitle(order);
      const orderCurrency = order.currencyCode || this.resolveCurrencyCode(order);
      const orderTotalValue = sumInvoiceLineTotals(order.products);
      const orderTotal = this.formatMoneyAmount(
        orderTotalValue,
        orderCurrency,
      );

      tableBody.push([
        {
          text: orderTitle,
          colSpan: 5,
          style: 'orderTitle',
          alignment: 'left',
        },
        { text: '' },
        { text: '' },
        { text: '' },
        { text: '' },
      ]);

      order.products.forEach(product => {
        tableBody.push([
          { text: globalIndex.toString(), alignment: 'center' },
          { text: product.productName },
          {
            text: `${formatQuantity(product.quantity)} ${product.getUnitName ? product.getUnitName() : (product.unitShortName || product.unit?.name || 'шт.')}`,
            alignment: 'center',
          },
          {
            text: this.formatMoneyAmount(product.price, orderCurrency),
            alignment: 'right',
          },
          {
            text: this.formatMoneyAmount(product.totalPrice, orderCurrency),
            alignment: 'right',
          },
        ]);
        globalIndex++;
      });

      tableBody.push([
        {
          text: 'Итого:',
          colSpan: 4,
          style: 'orderTitle',
          alignment: 'right',
        },
        { text: '' },
        { text: '' },
        { text: '' },
        {
          text: orderTotal,
          style: 'orderTitle',
          alignment: 'right',
        },
      ]);
    });
    
    return [{
      table: {
        headerRows: 1,
        widths: [30, '*', 80, 80, 80],
        body: tableBody
      },
      layout: {
        hLineWidth: function () { return 1; },
        vLineWidth: function () { return 1; },
        hLineColor: function () { return '#000000'; },
        vLineColor: function () { return '#000000'; }
      }
    }];
  }

  // Генерируем PDF с помощью pdfmake
  async generate() {
    const documentDefinition = this.generateDocument();

    const pdfMake = await getPdfMakeWithFonts();
    const pdfDoc = pdfMake.createPdf(documentDefinition);
    pdfDoc.download(`invoice_${this.invoice.invoiceNumber}.pdf`);

    return pdfDoc;
  }

}

/**
 * @param {object} invoice
 * @param {object|null} [company]
 * @param {'short'|'detailed'} [variant]
 * @returns {Promise<import('pdfmake/build/pdfmake').default>}
 */
export async function generateInvoicePdf(invoice, company = null, variant = 'short') {
  const generator = new InvoicePdfGenerator(
    invoice,
    company,
    variant,
  );
  return await generator.generate();
}

/**
 * @param {object} invoice
 * @param {object} [options]
 * @param {object|null} [options.company]
 * @param {'short'|'detailed'} [options.variant]
 * @param {(ctx: { cleanup: () => void }) => void} [options.onPrinted]
 * @param {() => void} [options.onError]
 * @returns {Promise<void>}
 */
export async function printInvoicePdf(invoice, options = {}) {
  const {
    company = null,
    variant = 'short',
    onPrinted,
    onError,
  } = options;

  const pdfMake = await getPdfMakeWithFonts();
  const generator = new InvoicePdfGenerator(
    invoice,
    company,
    variant,
  );
  const documentDefinition = generator.generateDocument();
  const pdfDoc = pdfMake.createPdf(documentDefinition);

  return new Promise((resolve, reject) => {
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
            cleanup();
            onPrinted?.({ cleanup });
            printWindow.removeEventListener('afterprint', handleAfterPrint);
            window.removeEventListener('afterprint', handleAfterPrint);
            resolve();
          };

          printWindow.addEventListener('afterprint', handleAfterPrint);
          window.addEventListener('afterprint', handleAfterPrint);
          printWindow.print();
        }, 300);
      };

      iframe.onerror = () => {
        cleanup();
        onError?.();
        reject(new Error('Invoice PDF print failed'));
      };
    });
  });
}


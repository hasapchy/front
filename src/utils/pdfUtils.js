import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Устанавливаем шрифты
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts && pdfFonts.vfs) {
  pdfMake.vfs = pdfFonts.vfs;
} else {
  // Fallback - используем встроенные шрифты
  pdfMake.vfs = {};
}

export class InvoicePdfGenerator {
  constructor(invoice, companyData, variant = 'short') {
    this.invoice = invoice;
    this.company = companyData;
    this.variant = variant; // 'short' или 'detailed'
  }

  // Генерируем документ для pdfmake
  generateDocument() {
    if (this.variant === 'detailed') {
      return this.generateDetailedDocument();
    } else {
      return this.generateShortDocument();
    }
  }

  // Получаем сумму с валютой
  getCurrencyAmount() {
    const amount = parseFloat(this.invoice.totalAmount || 0).toFixed(2);
    
    // Пытаемся получить символ валюты из заказов
    let currencySymbol = 'Нет валюты';
    
    if (this.invoice.orders && this.invoice.orders.length > 0) {
      // Берем валюту из первого заказа
      const firstOrder = this.invoice.orders[0];
      if (firstOrder.currencySymbol) {
        currencySymbol = firstOrder.currencySymbol;
      } else if (firstOrder.currencyCode) {
        currencySymbol = firstOrder.currencyCode;
      } else if (firstOrder.currencyName) {
        currencySymbol = firstOrder.currencyName;
      }
    } else if (this.invoice.amountInfo) {
      // Если нет заказов, но есть метод amountInfo, используем его
      const amountInfo = this.invoice.amountInfo();
      const match = amountInfo.match(/\d+(?:\.\d+)?\s+(.+)$/);
      if (match && match[1] && match[1] !== 'Нет валюты') {
        currencySymbol = match[1];
      }
    }
    
    return `${amount} ${currencySymbol}`;
  }

  // Краткий вариант документа
  generateShortDocument() {
    const invoiceDate = new Date(this.invoice.invoiceDate).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
    
    // Создаем таблицу товаров
    const productsTable = {
      table: {
        headerRows: 1,
        widths: [30, '*', 80, 80, 80],
        body: [
          // Заголовки
          [
            { text: '№', style: 'tableHeader', alignment: 'center' },
            { text: 'Наименование товара, работ, услуг', style: 'tableHeader' },
            { text: 'Кол-во', style: 'tableHeader', alignment: 'center' },
            { text: 'Цена ТМТ', style: 'tableHeader', alignment: 'right' },
            { text: 'Сумма ТМТ', style: 'tableHeader', alignment: 'right' }
          ],
          // Данные товаров
          ...this.invoice.products.map((product, index) => {
            return [
              { text: (index + 1).toString(), alignment: 'center' },
              { text: product.productName || '' },
            { 
              text: `${Number(product.quantity)}${product.getUnitName ? product.getUnitName() : (product.unitName || product.unit_name || product.unitShortName || product.unit?.name || 'шт.')}`, 
              alignment: 'center' 
            },
            { 
              text: parseFloat(product.price || 0).toFixed(2), 
              alignment: 'right' 
            },
            { 
              text: parseFloat(product.totalPrice || 0).toFixed(2), 
              alignment: 'right' 
            }
            ];
          })
        ]
      },
      layout: {
        hLineWidth: function (i, node) {
          return 1;
        },
        vLineWidth: function (i, node) {
          return 1;
        },
        hLineColor: function (i, node) {
          return '#000000';
        },
        vLineColor: function (i, node) {
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
        // Заголовок
        {
          text: `СЧЕТ № ${this.invoice.invoiceNumber} от ${invoiceDate}`,
          style: 'header'
        },
        // Жирная линия разделитель
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
          style: 'sectionTitle'
        },
        {
          text: this.company.name,
          margin: [0, 0, 0, 5]
        },
        {
          text: this.company.address,
          margin: [0, 0, 0, 5]
        },
        {
          text: `${this.company.tax_id} W/H ${this.company.warehouse_id}`,
          margin: [0, 0, 0, 5]
        },
        {
          text: `Email: ${this.company.email}`,
          margin: [0, 0, 0, 15]
        },
        
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
    const invoiceDate = new Date(this.invoice.invoiceDate).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });

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
        // Заголовок
        {
          text: `СЧЕТ № ${this.invoice.invoiceNumber} от ${invoiceDate}`,
          style: 'header'
        },
        
        // Жирная линия разделитель
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
          style: 'sectionTitle'
        },
        {
          text: this.company.name,
          margin: [0, 0, 0, 15]
        },
        
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

  // Группируем товары по заказам
  groupProductsByOrders() {
    const ordersMap = new Map();
    
    // Если есть заказы в счете, используем их данные
    if (this.invoice.orders && this.invoice.orders.length > 0) {
      this.invoice.orders.forEach(order => {
        ordersMap.set(order.id, {
          id: order.id,
          name: `Заказ ${order.id}`,
          date: order.date || order.created_at,
          products: []
        });
      });
    }
    
    // Группируем товары по заказам
    this.invoice.products.forEach((product, _index) => {
      const orderId = product.orderId || (this.invoice.orders && this.invoice.orders.length > 0 ? this.invoice.orders[0].id : 'INV');
      
      if (!ordersMap.has(orderId)) {
        // Ищем заказ в списке заказов счета
        const order = this.invoice.orders ? this.invoice.orders.find(o => o.id == orderId) : null;
        ordersMap.set(orderId, {
          id: orderId,
          name: `Заказ ${orderId}`,
          date: order ? (order.date || order.created_at) : null,
          products: []
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
    
    // Заголовки таблицы
    tableBody.push([
      { text: '№', style: 'tableHeader', alignment: 'center' },
      { text: 'Наименование товаров, работ, услуг', style: 'tableHeader' },
      { text: 'Кол-во', style: 'tableHeader', alignment: 'center' },
      { text: 'Цена, ТМТ', style: 'tableHeader', alignment: 'right' },
      { text: 'Стоимость, ТМТ', style: 'tableHeader', alignment: 'right' }
    ]);
    
    ordersData.forEach(order => {
      // Заголовок заказа как строка в таблице
      tableBody.push([
        { 
          text: order.date ? 
            `${order.name} от ${new Date(order.date).toLocaleDateString('ru-RU', {
              day: '2-digit',
              month: '2-digit', 
              year: 'numeric'
            })}` : 
            order.name, 
          colSpan: 5, 
          style: 'orderTitle', 
          alignment: 'left' 
        },
        { text: '' },
        { text: '' },
        { text: '' },
        { text: '' }
      ]);
      
      // Товары заказа
      order.products.forEach(product => {
        tableBody.push([
          { text: globalIndex.toString(), alignment: 'center' },
          { text: product.productName || '' },
          {
            text: `${Number(product.quantity)}${product.getUnitName ? product.getUnitName() : (product.unitName || product.unit_name || product.unitShortName || product.unit?.name || 'шт.')}`,
            alignment: 'center'
          },
          {
            text: parseFloat(product.price || 0).toFixed(2),
            alignment: 'right'
          },
          {
            text: parseFloat(product.totalPrice || 0).toFixed(2),
            alignment: 'right'
          }
        ]);
        globalIndex++;
      });
    });
    
    return [{
      table: {
        headerRows: 1,
        widths: [30, '*', 80, 80, 80],
        body: tableBody
      },
      layout: {
        hLineWidth: function (i, node) { return 1; },
        vLineWidth: function (i, node) { return 1; },
        hLineColor: function (i, node) { return '#000000'; },
        vLineColor: function (i, node) { return '#000000'; }
      }
    }];
  }

  // Генерируем PDF с помощью pdfmake
  generate() {
    const documentDefinition = this.generateDocument();
    
    // Создаем и скачиваем PDF
    const pdfDoc = pdfMake.createPdf(documentDefinition);
    pdfDoc.download(`invoice_${this.invoice.invoiceNumber}.pdf`);
    
    return pdfDoc;
  }

}

export function generateInvoicePdf(invoice, companyData = null, variant = 'short') {
  const defaultCompanyData = {
    name: 'LEBIZLI TURKMEN',
    address: 'Aşgabat şäheri, Berkararlyk etraby, 2127 (G. Gulyýew) köçesi, 26A H/H',
    tax_id: '23202934173861407785000',
    warehouse_id: '23202000173861807785000',
    email: 'lebizliturkmen@mail.ru',
    phone: '+993 12 45-26-17'
  };

  const generator = new InvoicePdfGenerator(invoice, companyData || defaultCompanyData, variant);
  return generator.generate();
}


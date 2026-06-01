import { dtoDateFormatters } from '@/utils/dateUtils';
import { createFromApiArray } from '@/utils/dtoUtils';
import { getCashRegisterDisplayNameByParts } from '@/utils/cashRegisterUtils';
import ClientDto from '@/dto/client/ClientDto';
import TransactionDto from '@/dto/transaction/TransactionDto';
import WarehousePurchaseProductDto from '@/dto/warehouse/WarehousePurchaseProductDto';
import WarehouseReceiptDto from '@/dto/warehouse/WarehouseReceiptDto';
import i18n from '@/i18n';

export default class WarehousePurchaseDto {
  constructor(
    id,
    supplier = null,
    warehouseId = null,
    warehouseName = null,
    creatorId = null,
    creator = null,
    status = 'draft',
    date = '',
    createdAt = '',
    updatedAt = '',
    amount = 0,
    origAmount = null,
    origCurrencyId = null,
    origCurrencySymbol = null,
    cashId = null,
    cashName = null,
    clientBalanceId = null,
    currencyId = null,
    note = '',
    products = [],
    transactions = [],
    receipts = [],
    paidAmount = 0,
    paymentStatus = null,
    paymentStatusText = null,
    totalAmount = 0,
    goodsPaymentRemainingDefault = null
  ) {
    this.id = id;
    this.supplier = supplier;
    this.warehouseId = warehouseId;
    this.warehouseName = warehouseName;
    this.creatorId = creatorId;
    this.creator = creator;
    this.status = status;
    this.date = date;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.amount = amount;
    this.origAmount = origAmount;
    this.origCurrencyId = origCurrencyId;
    this.origCurrencySymbol = origCurrencySymbol;
    this.cashId = cashId;
    this.cashName = cashName;
    this.clientBalanceId = clientBalanceId;
    this.currencyId = currencyId;
    this.note = note;
    this.products = products;
    this.transactions = transactions;
    this.receipts = receipts;
    this.paidAmount = paidAmount;
    this.paymentStatus = paymentStatus;
    this.paymentStatusText = paymentStatusText;
    this.totalAmount = totalAmount;
    this.goodsPaymentRemainingDefault = goodsPaymentRemainingDefault;
  }

  formatDate() {
    return dtoDateFormatters.formatDate(this.date);
  }

  formatCreatedAt() {
    return dtoDateFormatters.formatCreatedAt(this.createdAt);
  }

  formatDateUser() {
    const formattedDate = this.date ? dtoDateFormatters.formatDate(this.date) : '';
    if (!formattedDate) {
      return '-';
    }
    return `${formattedDate} / ${this.creator?.name || '-'}`;
  }

  getPaymentStatusText() {
    if (this.paymentStatusText) {
      return this.paymentStatusText;
    }
    if (this.paymentStatus === 'paid') {
      return i18n.global.t('paid');
    }
    if (this.paymentStatus === 'partially_paid') {
      return i18n.global.t('partiallyPaid');
    }
    return i18n.global.t('unpaid');
  }

  getPaymentStatusClass() {
    if (this.paymentStatus === 'paid') {
      return 'text-[#5CB85C] font-medium';
    }
    if (this.paymentStatus === 'partially_paid') {
      return 'text-[#FFA500] font-medium';
    }
    return 'text-[#EE4F47] font-medium';
  }

  getPaymentStatusIcon() {
    if (this.paymentStatus === 'paid') {
      return 'fas fa-check-circle';
    }
    if (this.paymentStatus === 'partially_paid') {
      return 'fas fa-adjust';
    }
    return 'fas fa-times-circle';
  }

  static fromApi(data) {
    if (!data) {
      return null;
    }

    const supplier = data.supplier ? ClientDto.fromApi(data.supplier) : null;
    const products = WarehousePurchaseProductDto.fromApiArray(data.products ?? []);
    const transactions = TransactionDto.fromApiArray(data.transactions ?? []);
    const receipts = (data.receipts ?? [])
      .map((row) => WarehouseReceiptDto.fromApi(row))
      .filter(Boolean);

    return new WarehousePurchaseDto(
      data.id,
      supplier,
      data.warehouse_id != null ? Number(data.warehouse_id) : null,
      data.warehouse?.name ?? null,
      data.creator_id ?? null,
      data.creator ?? null,
      data.status,
      data.date,
      data.created_at ?? '',
      data.updated_at ?? '',
      Number(data.amount ?? 0),
      data.orig_amount != null ? Number(data.orig_amount) : null,
      data.orig_currency_id != null ? Number(data.orig_currency_id) : null,
      data.orig_currency?.code ?? null,
      data.cash_id != null ? Number(data.cash_id) : null,
      data.cash_id
        ? getCashRegisterDisplayNameByParts(data.cash_register?.name, data.cash_register?.is_cash)
        : null,
      data.client_balance_id != null ? Number(data.client_balance_id) : null,
      data.currency_id != null ? Number(data.currency_id) : null,
      data.note ?? '',
      products,
      transactions,
      receipts,
      Number(data.paid_amount ?? 0),
      data.payment_status ?? null,
      data.payment_status_text ?? null,
      Number(data.total_amount ?? data.amount ?? 0),
      data.goods_payment_remaining_default != null
        ? Number(data.goods_payment_remaining_default)
        : null
    );
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, WarehousePurchaseDto.fromApi).filter(Boolean);
  }
}

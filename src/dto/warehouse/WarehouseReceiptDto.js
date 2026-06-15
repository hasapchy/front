import { dtoDateFormatters } from '@/utils/dateUtils';
import { formatCurrencyForDisplay } from '@/utils/numberUtils';
import { createFromApiArray } from '@/utils/dtoUtils';
import ClientDto from '@/dto/client/ClientDto';
import WarehouseReceiptProductDto from '@/dto/warehouse/WarehouseReceiptProductDto';
import i18n from '@/i18n';
import { getCashRegisterDisplayNameByParts, formatCashRegisterDisplay } from '@/utils/cashRegisterUtils';

export default class WarehouseReceiptDto {
  constructor(
    id,
    warehouseId,
    warehouseName,
    amount,
    origAmount = null,
    origCurrencyId = null,
    origCurrencyCode = null,
    clientBalanceId = null,
    client = null,
    products = [],
    note = '',
    creatorId = null,
    creator = null,
    date = '',
    createdAt = '',
    updatedAt = '',
    cashId = null,
    cashName = null,
    currencyCode = null,
    purchaseId = null,
    isFromPurchase = false,
    status = 'draft',
    landedCost = null,
    goodsPaymentRemainingDefault = null,
    paymentStatus = null,
    paymentStatusText = null,
    paidAmount = null,
    totalAmount = null,
    returnAdjustedAmount = null,
    effectiveRemaining = null,
    returnedGoodsAmount = null,
    netGoodsAmount = null,
    linkedReturns = []
  ) {
    this.id = id;
    this.warehouseId = warehouseId;
    this.warehouseName = warehouseName;
    this.amount = amount;
    this.origAmount = origAmount;
    this.origCurrencyId = origCurrencyId;
    this.origCurrencyCode = origCurrencyCode;
    this.clientBalanceId = clientBalanceId;
    this.client = client;
    this.products = products;
    this.note = note;
    this.creatorId = creatorId;
    this.creator = creator ?? null;
    this.date = date;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.cashId = cashId;
    this.cashName = cashName;
    this.currencyCode = currencyCode;
    this.type = this.cashId ? 'cash' : 'balance';
    this.purchaseId = purchaseId;
    this.isFromPurchase = isFromPurchase;
    this.status = status;
    this.landedCost = landedCost;
    this.goodsPaymentRemainingDefault = goodsPaymentRemainingDefault;
    this.paymentStatus = paymentStatus;
    this.paymentStatusText = paymentStatusText;
    this.paidAmount = paidAmount;
    this.totalAmount = totalAmount;
    this.returnAdjustedAmount = returnAdjustedAmount;
    this.effectiveRemaining = effectiveRemaining;
    this.returnedGoodsAmount = returnedGoodsAmount;
    this.netGoodsAmount = netGoodsAmount;
    this.linkedReturns = linkedReturns;
  }

  cashNameDisplay() {
    if (this.cashId) {
      return formatCashRegisterDisplay(this.cashName, this.currencyCode);
    }
    return i18n.global.t('notSpecified');
  }

  paymentTypeDisplay() {
    return this.type === 'cash'
      ? i18n.global.t('toCash')
      : i18n.global.t('inDebt');
  }

  priceInfo() {
    const code = this.currencyCode || '';
    return formatCurrencyForDisplay(this.amount ?? 0, code, true);
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
    if (this.isFromPurchase && this.paymentStatus == null) {
      return i18n.global.t('paymentStatusNotApplicable');
    }
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
    if (this.isFromPurchase && this.paymentStatus == null) {
      return 'text-gray-500 dark:text-[var(--text-secondary)]';
    }
    if (this.paymentStatus === 'paid') {
      return 'text-[var(--color-success)] font-medium';
    }
    if (this.paymentStatus === 'partially_paid') {
      return 'text-[var(--color-warning)] font-medium';
    }
    return 'text-[var(--color-danger)] font-medium';
  }

  getPaymentStatusIcon() {
    if (this.isFromPurchase && this.paymentStatus == null) {
      return 'fas fa-minus-circle';
    }
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

    const client = data.supplier ? ClientDto.fromApi(data.supplier) : null;
    const products = WarehouseReceiptProductDto.fromApiArray(data.products ?? []);
    const landedCost = data.landed_cost
      ? {
          goodsSubtotalDefault: Number(data.landed_cost.goods_subtotal_default),
          expensesAllocatedTotal: Number(data.landed_cost.expenses_allocated_total),
          fullCostDefault: Number(data.landed_cost.full_cost_default),
          defaultCurrencyCode: data.landed_cost.default_currency_symbol ?? '',
        }
      : null;

    return new WarehouseReceiptDto(
      data.id,
      data.warehouse_id != null ? Number(data.warehouse_id) : null,
      data.warehouse?.name ?? null,
      Number(data.amount ?? 0),
      data.orig_amount != null ? Number(data.orig_amount) : null,
      data.orig_currency_id != null ? Number(data.orig_currency_id) : null,
      data.orig_currency?.code ?? null,
      data.client_balance_id != null ? Number(data.client_balance_id) : null,
      client,
      products,
      data.note ?? '',
      data.creator_id ?? null,
      data.creator ?? null,
      data.date,
      data.created_at ?? '',
      data.updated_at ?? '',
      data.cash_id != null ? Number(data.cash_id) : null,
      data.cash_id
        ? getCashRegisterDisplayNameByParts(data.cash_register?.name, data.cash_register?.is_cash)
        : null,
      data.cash_register?.currency?.code ?? null,
      data.purchase_id != null ? Number(data.purchase_id) : null,
      Boolean(data.is_from_purchase),
      data.status,
      landedCost,
      data.goods_payment_remaining_default != null
        ? Number(data.goods_payment_remaining_default)
        : null,
      data.payment_status ?? null,
      data.payment_status_text ?? null,
      Number(data.paid_amount ?? 0),
      Number(data.total_amount ?? data.amount ?? 0),
      data.return_adjusted_amount != null ? Number(data.return_adjusted_amount) : null,
      data.effective_remaining != null ? Number(data.effective_remaining) : null,
      data.returned_goods_amount != null ? Number(data.returned_goods_amount) : null,
      data.net_goods_amount != null ? Number(data.net_goods_amount) : null,
      Array.isArray(data.linked_returns)
        ? data.linked_returns.map((item) => {
            const date = item.date ?? '';
            return {
              id: Number(item.id),
              date,
              returnAmount: Number(item.return_amount ?? 0),
              unpaidPortion: Number(item.unpaid_portion ?? 0),
              paidPortion: Number(item.paid_portion ?? 0),
              formatDate() {
                return date ? dtoDateFormatters.formatCreatedAt(date) : '';
              },
            };
          })
        : []
    );
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, WarehouseReceiptDto.fromApi).filter(Boolean);
  }
}

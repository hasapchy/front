import { dtoDateFormatters } from '@/utils/dateUtils';
import { formatCurrencyForDisplay } from '@/utils/numberUtils';
import { createFromApiArray } from '@/utils/dtoUtils';
import WarehouseWriteoffProductDto from '@/dto/warehouse/WarehouseWriteoffProductDto';

export default class WarehouseWriteoffDto {
  constructor(
    id,
    warehouseId,
    sourceReceiptId = null,
    warehouseName,
    reason,
    products = [],
    note = '',
    date = '',
    creatorId = null,
    creator = null,
    createdAt = '',
    updatedAt = '',
    unpaidPortion = null,
    paidPortion = null,
    cashReturnRemainingDefault = null,
    returnAmount = null,
    returnCurrencyCode = null
  ) {
    this.id = id;
    this.warehouseId = warehouseId;
    this.sourceReceiptId = sourceReceiptId;
    this.warehouseName = warehouseName;
    this.reason = reason;
    this.products = products;
    this.note = note;
    this.date = date;
    this.creatorId = creatorId;
    this.creator = creator ?? null;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.unpaidPortion = unpaidPortion;
    this.paidPortion = paidPortion;
    this.cashReturnRemainingDefault = cashReturnRemainingDefault;
    this.returnAmount = returnAmount;
    this.returnCurrencyCode = returnCurrencyCode;
    this.returnAmountDisplay = WarehouseWriteoffDto.formatReturnAmountDisplay(returnAmount, returnCurrencyCode);
  }

  static formatReturnAmountDisplay(returnAmount, returnCurrencyCode) {
    if (returnAmount == null || Number.isNaN(Number(returnAmount))) {
      return '—';
    }
    return formatCurrencyForDisplay(Number(returnAmount), returnCurrencyCode ?? '', true);
  }

  formatCreatedAt() {
    return dtoDateFormatters.formatCreatedAt(this.createdAt);
  }

  formatDate() {
    return this.formatCreatedAt();
  }

  formatDateUser() {
    const formattedDate = this.createdAt ? dtoDateFormatters.formatCreatedAt(this.createdAt) : '';
    if (!formattedDate) {
      return '-';
    }
    return `${formattedDate} / ${this.creator?.name || '-'}`;
  }

  static fromApi(data) {
    if (!data) {
      return null;
    }

    const products = WarehouseWriteoffProductDto.fromApiArray(data.products ?? []);
    const returnAmount = data.return_amount != null ? Number(data.return_amount) : null;
    const returnCurrencyCode = data.return_currency_code ?? null;

    return new WarehouseWriteoffDto(
      data.id,
      data.warehouse_id != null ? Number(data.warehouse_id) : null,
      data.source_receipt_id != null ? Number(data.source_receipt_id) : null,
      data.warehouse_name ?? null,
      data.reason,
      products,
      data.note ?? '',
      data.date ?? data.created_at ?? '',
      data.creator_id ?? null,
      data.creator ?? null,
      data.created_at ?? '',
      data.updated_at ?? '',
      data.unpaid_portion != null ? Number(data.unpaid_portion) : null,
      data.paid_portion != null ? Number(data.paid_portion) : null,
      data.cash_return_remaining_default != null ? Number(data.cash_return_remaining_default) : null,
      returnAmount,
      returnCurrencyCode
    );
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, WarehouseWriteoffDto.fromApi).filter(Boolean);
  }
}

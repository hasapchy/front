import { dtoDateFormatters } from '@/utils/dateUtils';
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
    creatorId = null,
    creator = null,
    createdAt = '',
    updatedAt = ''
  ) {
    this.id = id;
    this.warehouseId = warehouseId;
    this.sourceReceiptId = sourceReceiptId;
    this.warehouseName = warehouseName;
    this.reason = reason;
    this.products = products;
    this.note = note;
    this.creatorId = creatorId;
    this.creator = creator ?? null;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  formatCreatedAt() {
    return dtoDateFormatters.formatCreatedAt(this.createdAt);
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

    return new WarehouseWriteoffDto(
      data.id,
      data.warehouse_id != null ? Number(data.warehouse_id) : null,
      data.source_receipt_id != null ? Number(data.source_receipt_id) : null,
      data.warehouse_name ?? null,
      data.reason,
      products,
      data.note ?? '',
      data.creator_id ?? null,
      data.creator ?? null,
      data.created_at ?? '',
      data.updated_at ?? ''
    );
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, WarehouseWriteoffDto.fromApi).filter(Boolean);
  }
}

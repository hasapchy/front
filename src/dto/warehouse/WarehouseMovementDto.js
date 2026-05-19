import { dtoDateFormatters } from '@/utils/dateUtils';
import { createFromApiArray } from '@/utils/dtoUtils';
import WarehouseMovementProductDto from '@/dto/warehouse/WarehouseMovementProductDto';

export default class WarehouseMovementDto {
  constructor(
    id,
    warehouseFromId,
    warehouseFromName,
    warehouseToId,
    warehouseToName,
    products = [],
    note = '',
    creatorId = null,
    creator = null,
    date = '',
    createdAt = '',
    updatedAt = ''
  ) {
    this.id = id;
    this.warehouseFromId = warehouseFromId;
    this.warehouseFromName = warehouseFromName;
    this.warehouseToId = warehouseToId;
    this.warehouseToName = warehouseToName;
    this.products = products;
    this.note = note;
    this.creatorId = creatorId;
    this.creator = creator ?? null;
    this.date = date;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
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

  static fromApi(data) {
    if (!data) {
      return null;
    }

    const products = WarehouseMovementProductDto.fromApiArray(data.products ?? []);

    return new WarehouseMovementDto(
      data.id,
      data.warehouse_from_id != null ? Number(data.warehouse_from_id) : null,
      data.warehouse_from_name ?? null,
      data.warehouse_to_id != null ? Number(data.warehouse_to_id) : null,
      data.warehouse_to_name ?? null,
      products,
      data.note ?? '',
      data.creator_id ?? null,
      data.creator ?? null,
      data.date,
      data.created_at ?? '',
      data.updated_at ?? ''
    );
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, WarehouseMovementDto.fromApi).filter(Boolean);
  }
}

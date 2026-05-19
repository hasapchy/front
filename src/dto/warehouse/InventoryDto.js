import { dtoDateFormatters } from '@/utils/dateUtils';
import { createFromApiArray } from '@/utils/dtoUtils';

export default class InventoryDto {
  constructor(
    id,
    warehouseId,
    status,
    startedAt = null,
    finishedAt = null,
    itemsCount = 0,
    whReceiptId = null,
    whWriteOffId = null,
    categoryIds = [],
    stockRecalcStatus = null,
    creatorName = ''
  ) {
    this.id = id;
    this.warehouseId = warehouseId;
    this.status = status;
    this.startedAt = startedAt;
    this.finishedAt = finishedAt;
    this.itemsCount = itemsCount;
    this.whReceiptId = whReceiptId;
    this.whWriteOffId = whWriteOffId;
    this.categoryIds = categoryIds;
    this.stockRecalcStatus = stockRecalcStatus;
    this.creatorName = creatorName;
  }

  formatStartedAt() {
    return this.startedAt ? dtoDateFormatters.formatCreatedAt(this.startedAt) : '—';
  }

  static fromApi(data) {
    if (!data) {
      return null;
    }

    const raw = data.category_ids;
    const categoryIds = Array.isArray(raw)
      ? raw.map((id) => Number(id)).filter((n) => Number.isInteger(n) && n > 0)
      : [];

    return new InventoryDto(
      data.id,
      data.warehouse_id != null ? Number(data.warehouse_id) : null,
      data.status,
      data.started_at ?? null,
      data.finished_at ?? null,
      Number(data.items_count ?? 0),
      data.wh_receipt_id != null ? Number(data.wh_receipt_id) : null,
      data.wh_write_off_id != null ? Number(data.wh_write_off_id) : null,
      categoryIds,
      data.stock_recalc_status ?? null,
      data.creator_name ?? ''
    );
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, InventoryDto.fromApi).filter(Boolean);
  }
}

import { dtoDateFormatters } from "@/utils/dateUtils";

export default class InventoryDto {
  constructor(
    id,
    warehouseId,
    status,
    startedAt = null,
    finishedAt = null,
    itemsCount = 0,
    whReceiptId = null,
    whWriteOffId = null
  ) {
    this.id = id;
    this.warehouseId = warehouseId;
    this.status = status;
    this.startedAt = startedAt;
    this.finishedAt = finishedAt;
    this.itemsCount = itemsCount;
    this.whReceiptId = whReceiptId;
    this.whWriteOffId = whWriteOffId;
  }

  formatStartedAt() {
    return this.startedAt ? dtoDateFormatters.formatCreatedAt(this.startedAt) : "—";
  }

  static fromApi(data) {
    if (!data) return null;
    return new InventoryDto(
      data.id,
      data.warehouse_id,
      data.status,
      data.started_at,
      data.finished_at,
      data.items_count ?? 0,
      data.wh_receipt_id ?? null,
      data.wh_write_off_id ?? null
    );
  }
}

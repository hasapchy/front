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
    whWriteOffId = null,
    categoryIds = []
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
  }

  formatStartedAt() {
    return this.startedAt ? dtoDateFormatters.formatCreatedAt(this.startedAt) : "—";
  }

  static fromApi(data) {
    if (!data) return null;
    const raw = data.category_ids;
    const categoryIds = Array.isArray(raw)
      ? raw.map((id) => Number(id)).filter((n) => Number.isInteger(n) && n > 0)
      : [];
    return new InventoryDto(
      data.id,
      data.warehouse_id,
      data.status,
      data.started_at,
      data.finished_at,
      data.items_count ?? 0,
      data.wh_receipt_id ?? null,
      data.wh_write_off_id ?? null,
      categoryIds
    );
  }
}

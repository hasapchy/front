import { dtoDateFormatters } from "@/utils/dateUtils";
import { createFromApiArray } from "@/utils/dtoUtils";
import WarehouseWriteoffProductDto from "./WarehouseWriteoffProductDto";

export default class WarehouseWriteoffDto {
  constructor(
    id,
    warehouseId,
    sourceReceiptId = null,
    warehouseName,
    reason,
    products = null,
    note = "",
    creatorId,
    creator,
    createdAt = "",
    updatedAt = ""
  ) {
    this.id = id;
    this.warehouseId = warehouseId;
    this.sourceReceiptId = sourceReceiptId;
    this.warehouseName = warehouseName;
    this.reason = reason;
    /** @type {Array<WarehouseWriteoffProductDto> | null} */
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

  static fromApi(data) {
    const products = data?.products ? WarehouseWriteoffProductDto.fromApiArray(data.products) : null;

    return new WarehouseWriteoffDto(
      data?.id,
      data?.warehouse_id,
      data?.source_receipt_id ?? null,
      data?.warehouse_name,
      data?.reason,
      products,
      data?.note ?? "",
      data?.creator_id,
      data?.creator ?? null,
      data?.created_at,
      data?.updated_at
    );
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      return WarehouseWriteoffDto.fromApi(data);
    }).filter(Boolean);
  }
}

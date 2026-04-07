import { dtoDateFormatters } from "@/utils/dateUtils";
import { createFromApiArray } from "@/utils/dtoUtils";
import WarehouseMovementProductDto from "./WarehouseMovementProductDto";

export default class WarehouseMovementDto {
  constructor(
    id,
    warehouseFromId,
    warehouseFromName,
    warehouseToId,
    warehouseToName,
    products = null,
    note = "",
    creatorId,
    creator,
    date = "",
    createdAt = "",
    updatedAt = ""
  ) {
    this.id = id;
    this.warehouseFromId = warehouseFromId;
    this.warehouseFromName = warehouseFromName;
    this.warehouseToId = warehouseToId;
    this.warehouseToName = warehouseToName;
    /** @type {Array<WarehouseMovementProductDto> | null} */
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
  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      const products = data.products ? WarehouseMovementProductDto.fromApiArray(data.products) : null;
      
      return new WarehouseMovementDto(
        data.id,
        data.warehouse_from_id,
        data.warehouse_from_name,
        data.warehouse_to_id,
        data.warehouse_to_name,
        products,
        data.note,
        data.creator_id,
        data.creator ?? null,
        data.date,
        data.created_at,
        data.updated_at
      );
    }).filter(Boolean);
  }
}

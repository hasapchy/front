import { dtoDateFormatters } from "@/utils/dateUtils";
import { createProductsHtmlList, createFromApiArray } from "@/utils/dtoUtils";
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
    userId,
    userName,
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
    this.userId = userId;
    this.userName = userName;
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

  formatUpdatedAt() {
    return dtoDateFormatters.formatUpdatedAt(this.updatedAt);
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
        data.user_id,
        data.user_name,
        data.date,
        data.created_at,
        data.updated_at
      );
    }).filter(Boolean);
  }
}

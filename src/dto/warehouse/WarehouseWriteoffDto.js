import { dtoDateFormatters } from "@/utils/dateUtils";
import { createProductsHtmlList, createFromApiArray } from "@/utils/dtoUtils";
import WarehouseWriteoffProductDto from "./WarehouseWriteoffProductDto";

export default class WarehouseWriteoffDto {
  constructor(
    id,
    warehouseId,
    warehouseName,
    products = null,
    note = "",
    userId,
    userName,
    createdAt = "",
    updatedAt = ""
  ) {
    this.id = id;
    this.warehouseId = warehouseId;
    this.warehouseName = warehouseName;
    /** @type {Array<WarehouseWriteoffProductDto> | null} */
    this.products = products;
    this.note = note;
    this.userId = userId;
    this.userName = userName;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }


  formatCreatedAt() {
    return dtoDateFormatters.formatCreatedAt(this.createdAt);
  }

  formatUpdatedAt() {
    return dtoDateFormatters.formatUpdatedAt(this.updatedAt);
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      const products = data.products ? WarehouseWriteoffProductDto.fromApiArray(data.products) : null;
      
      return new WarehouseWriteoffDto(
        data.id,
        data.warehouse_id,
        data.warehouse_name,
        products,
        data.note,
        data.user_id,
        data.user_name,
        data.created_at,
        data.updated_at
      );
    }).filter(Boolean);
  }
}

import { dtoDateFormatters } from '@/utils/dateUtils';
import { getImageUrl, createFromApiArray } from '@/utils/dtoUtils';

export default class WarehouseStockDto {
  constructor(
    id,
    warehouseId,
    warehouseName,
    productId,
    productName,
    productImage,
    unitId,
    unitName,
    unitShortName,
    categoryId,
    categoryName,
    quantity,
    createdAt = '',
    isBelowMinStock = false,
    stockByUnits = []
  ) {
    this.id = id;
    this.warehouseId = warehouseId;
    this.warehouseName = warehouseName;
    this.productId = productId;
    this.productName = productName;
    this.productImage = productImage;
    this.unitId = unitId;
    this.unitName = unitName;
    this.unitShortName = unitShortName;
    this.categoryId = categoryId;
    this.categoryName = categoryName;
    this.quantity = quantity;
    this.createdAt = createdAt;
    this.isBelowMinStock = Boolean(isBelowMinStock);
    this.stockByUnits = Array.isArray(stockByUnits) ? stockByUnits : [];
  }

  imgUrl() {
    return getImageUrl(this.productImage);
  }

  formatCreatedAt() {
    return dtoDateFormatters.formatCreatedAt(this.createdAt);
  }

  static fromApi(data) {
    if (!data) {
      return null;
    }

    return new WarehouseStockDto(
      data.id,
      data.warehouse_id != null ? Number(data.warehouse_id) : null,
      data.warehouse_name ?? null,
      data.product_id != null ? Number(data.product_id) : null,
      data.product_name ?? null,
      data.product_image ?? null,
      data.unit_id != null ? Number(data.unit_id) : null,
      data.unit_name ?? null,
      data.unit_short_name ?? null,
      data.category_id != null ? Number(data.category_id) : null,
      data.category_name ?? null,
      Number(data.quantity ?? 0),
      data.created_at ?? '',
      Boolean(data.is_below_min_stock),
      data.stock_by_units ?? []
    );
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, WarehouseStockDto.fromApi).filter(Boolean);
  }
}

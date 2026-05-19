import { createFromApiArray } from '@/utils/dtoUtils';

export default class InventoryItemDto {
  constructor(
    id,
    productId,
    categoryId,
    productName,
    categoryName,
    unitShortName,
    expectedQuantity,
    actualQuantity,
    differenceQuantity,
    differenceType
  ) {
    this.id = id;
    this.productId = productId;
    this.categoryId = categoryId;
    this.productName = productName;
    this.categoryName = categoryName;
    this.unitShortName = unitShortName;
    this.expectedQuantity = expectedQuantity;
    this.actualQuantity = actualQuantity;
    this.differenceQuantity = differenceQuantity;
    this.differenceType = differenceType;
  }

  get stockQuantity() {
    return this.expectedQuantity;
  }

  set stockQuantity(value) {
    this.expectedQuantity = value != null && value !== '' ? Number(value) : 0;
  }

  static fromApi(data) {
    if (!data) {
      return null;
    }

    return new InventoryItemDto(
      data.id,
      data.product_id != null ? Number(data.product_id) : null,
      data.category_id != null ? Number(data.category_id) : null,
      data.product_name ?? '',
      data.category_name ?? '',
      data.unit_short_name ?? '',
      Number(data.expected_quantity ?? 0),
      data.actual_quantity != null ? Number(data.actual_quantity) : null,
      Number(data.difference_quantity ?? 0),
      data.difference_type ?? null
    );
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, InventoryItemDto.fromApi).filter(Boolean);
  }
}

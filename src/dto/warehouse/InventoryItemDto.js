import { createFromApiArray } from "@/utils/dtoUtils";

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

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, (data) => {
      return new InventoryItemDto(
        data.id,
        data.product_id,
        data.category_id,
        data.product_name,
        data.category_name,
        data.unit_short_name,
        data.expected_quantity,
        data.actual_quantity,
        data.difference_quantity,
        data.difference_type
      );
    }).filter(Boolean);
  }
}

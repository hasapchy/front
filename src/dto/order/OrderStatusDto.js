import { dtoDateFormatters } from "@/utils/dateUtils";
import { createFromApiArray } from "@/utils/dtoUtils";
import OrderStatusCategoryDto from "./OrderStatusCategoryDto";
export default class OrderStatusDto {
  constructor(
    id,
    name,
    categoryId,
    category = null,
    createdAt = "",
    updatedAt = ""
  ) {
    this.id = id;
    this.name = name;
    this.categoryId = categoryId;
    this.category = category;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
  get categoryName() {
    return this.category ? this.category.name : '-';
  }

  formatCreatedAt() {
    return dtoDateFormatters.formatCreatedAt(this.createdAt);
  }

  formatUpdatedAt() {
    return dtoDateFormatters.formatUpdatedAt(this.updatedAt);
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      const category = data.category ? OrderStatusCategoryDto.fromApiArray([data.category])[0] || null : null;
      
      return new OrderStatusDto(
        data.id,
        data.name,
        data.category_id,
        category,
        data.created_at,
        data.updated_at
      );
    }).filter(Boolean);
  }
}

import { createFromApiArray } from "@/utils/dtoUtils";
import BaseDto from "@/dto/BaseDto";
import OrderStatusCategoryDto from "./OrderStatusCategoryDto";

export default class OrderStatusDto extends BaseDto {
  constructor(
    id,
    name,
    categoryId,
    category = null,
    createdAt = "",
    updatedAt = ""
  ) {
    super();
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

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      const category = data.category ? OrderStatusCategoryDto.fromApiArray([data.category])[0] : null;
      
      return new OrderStatusDto(
        data.id,
        data.name,
        data.category_id,
        category,
        data.created_at,
        data.updated_at
      );
    });
  }
}

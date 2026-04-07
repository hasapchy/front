import { dtoDateFormatters } from "@/utils/dateUtils";
import { createFromApiArray } from "@/utils/dtoUtils";
import OrderStatusCategoryDto from "./OrderStatusCategoryDto";
export default class OrderStatusDto {
  constructor(
    id,
    name,
    categoryId,
    category = null,
    isActive = true,
    kanbanOutcome = null,
    createdAt = "",
    updatedAt = ""
  ) {
    this.id = id;
    this.name = name;
    this.categoryId = categoryId;
    this.category = category;
    this.isActive = isActive;
    this.kanbanOutcome = kanbanOutcome;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
  get categoryName() {
    return this.category ? this.category.name : '-';
  }

  formatCreatedAt() {
    return dtoDateFormatters.formatCreatedAt(this.createdAt);
  }
  static fromApi(data) {
    if (!data) return null;
    const category = data.category ? OrderStatusCategoryDto.fromApi(data.category) : null;

    return new OrderStatusDto(
      data.id,
      data.name,
      data.category_id,
      category,
      data.is_active !== undefined ? data.is_active : true,
      data.kanban_outcome,
      data.created_at,
      data.updated_at
    );
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, OrderStatusDto.fromApi).filter(Boolean);
  }
}

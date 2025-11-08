import { dtoDateFormatters } from "@/utils/dateUtils";
import { createFromApiArray } from "@/utils/dtoUtils";
export default class OrderCategoryDto {
  constructor(
    id,
    name,
    userId,
    userName = null,
    createdAt = "",
    updatedAt = ""
  ) {
    this.id = id;
    this.name = name;
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
      return new OrderCategoryDto(
        data.id,
        data.name,
        data.user_id,
        data.user_name,
        data.created_at,
        data.updated_at
      );
    }).filter(Boolean);
  }
}

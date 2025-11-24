import { createFromApiArray } from "@/utils/dtoUtils";
import BaseDto from "@/dto/BaseDto";

export default class OrderStatusCategoryDto extends BaseDto {
  constructor(id, name, color, userId, createdAt, updatedAt) {
    super();
    this.id = id;
    this.name = name;
    this.color = color;
    this.userId = userId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, (data) => {
      return new OrderStatusCategoryDto(
        data.id,
        data.name,
        data.color,
        data.user_id,
        data.created_at,
        data.updated_at
      );
    });
  }
}

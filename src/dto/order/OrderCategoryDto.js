import { createFromApiArray } from "@/utils/dtoUtils";
import BaseDto from "@/dto/BaseDto";

export default class OrderCategoryDto extends BaseDto {
  constructor(
    id,
    name,
    userId,
    userName = null,
    createdAt = "",
    updatedAt = ""
  ) {
    super();
    this.id = id;
    this.name = name;
    this.userId = userId;
    this.userName = userName;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
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
    });
  }
}

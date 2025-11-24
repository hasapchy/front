import { createFromApiArray } from "@/utils/dtoUtils";
import BaseDto from "@/dto/BaseDto";

export default class ProjectStatusDto extends BaseDto {
  constructor(
    id,
    name,
    color = "#6c757d",
    userId = null,
    user = null,
    createdAt = "",
    updatedAt = ""
  ) {
    super();
    this.id = id;
    this.name = name;
    this.color = color;
    this.userId = userId;
    this.user = user;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      return new ProjectStatusDto(
        data.id,
        data.name,
        data.color,
        data.user_id,
        data.user,
        data.created_at,
        data.updated_at
      );
    });
  }
}

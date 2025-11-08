import { dtoDateFormatters } from "@/utils/dateUtils";
import { createFromApiArray } from "@/utils/dtoUtils";

export default class ProjectStatusDto {
  constructor(
    id,
    name,
    color = "#6c757d",
    userId = null,
    user = null,
    createdAt = "",
    updatedAt = ""
  ) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.userId = userId;
    this.user = user;
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
      return new ProjectStatusDto(
        data.id,
        data.name,
        data.color,
        data.user_id,
        data.user,
        data.created_at,
        data.updated_at
      );
    }).filter(Boolean);
  }
}

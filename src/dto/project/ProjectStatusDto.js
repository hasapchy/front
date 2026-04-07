import { dtoDateFormatters } from "@/utils/dateUtils";
import { createFromApiArray } from "@/utils/dtoUtils";

export default class ProjectStatusDto {
  constructor(
    id,
    name,
    color = "#6c757d",
    isVisible = true,
    kanbanOutcome = null,
    userId = null,
    user = null,
    createdAt = "",
    updatedAt = ""
  ) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.isVisible = isVisible;
    this.kanbanOutcome = kanbanOutcome;
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

  static fromApi(data) {
    if (!data) return null;
    return new ProjectStatusDto(
      data.id,
      data.name,
      data.color,
      data.is_visible !== undefined ? data.is_visible : true,
      data.kanban_outcome,
      data.creator_id,
      data.user,
      data.created_at,
      data.updated_at
    );
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, ProjectStatusDto.fromApi).filter(Boolean);
  }
}

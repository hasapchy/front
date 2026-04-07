import { dtoDateFormatters } from "@/utils/dateUtils";
import { createFromApiArray } from "@/utils/dtoUtils";

export default class TaskStatusDto {
  constructor(
    id,
    name,
    color = "#6c757d",
    kanbanOutcome = null,
    userId = null,
    user = null,
    createdAt = "",
    updatedAt = ""
  ) {
    this.id = id;
    this.name = name;
    this.color = color;
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

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      return new TaskStatusDto(
        data.id,
        data.name,
        data.color,
        data.kanban_outcome,
        data.creator_id,
        data.user,
        data.created_at,
        data.updated_at
      );
    }).filter(Boolean);
  }
}

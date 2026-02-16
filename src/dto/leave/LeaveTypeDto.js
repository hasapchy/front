import { dtoDateFormatters } from "@/utils/dateUtils";
import { createFromApiArray } from "@/utils/dtoUtils";

export default class LeaveTypeDto {
  constructor(
    id,
    name,
    color = null,
    isPenalty = false,
    createdAt = "",
    updatedAt = ""
  ) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.isPenalty = isPenalty;
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
      return new LeaveTypeDto(
        data.id,
        data.name,
        data.color || null,
        Boolean(data.is_penalty),
        data.created_at,
        data.updated_at
      );
    }).filter(Boolean);
  }
}


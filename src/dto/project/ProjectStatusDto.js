import { dayjsDate, dayjsDateTime } from "@/utils/dateUtils";

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

  formatDate() {
    return dayjsDateTime(this.date);
  }

  formatCreatedAt() {
    return dayjsDateTime(this.createdAt);
  }

  formatUpdatedAt() {
    return dayjsDateTime(this.updatedAt);
  }
}

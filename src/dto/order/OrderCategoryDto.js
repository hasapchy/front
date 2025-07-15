import { dayjsDate, dayjsDateTime } from "@/utils/dateUtils";
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

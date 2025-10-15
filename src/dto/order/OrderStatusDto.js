import { dayjsDateTime } from "@/utils/dateUtils";
export default class OrderStatusDto {
  constructor(
    id,
    name,
    categoryId,
    category = null,
    createdAt = "",
    updatedAt = ""
  ) {
    this.id = id;
    this.name = name;
    this.categoryId = categoryId;
    this.category = category;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
  get categoryName() {
    return this.category ? this.category.name : '-';
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

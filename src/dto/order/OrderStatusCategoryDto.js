import { dayjsDate } from '@/utils/dateUtils';

export default class OrderStatusCategoryDto {
  constructor(id, name, color, userId, createdAt, updatedAt) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.userId = userId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  formatCreatedAt() {
    return dayjsDate(this.createdAt);
  }
}

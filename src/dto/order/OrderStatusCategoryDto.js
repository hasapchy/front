import { dtoDateFormatters } from '@/utils/dateUtils';
import { createFromApiArray } from '@/utils/dtoUtils';

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
    return dtoDateFormatters.formatCreatedAt(this.createdAt);
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      return new OrderStatusCategoryDto(
        data.id,
        data.name,
        data.color,
        data.creator_id,
        data.created_at,
        data.updated_at
      );
    }).filter(Boolean);
  }
}

import { dtoDateFormatters } from '@/utils/dateUtils';
import { createFromApiArray } from '@/utils/dtoUtils';

export default class LeadSourceDto {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.name = data.name ?? '';
    this.createdAt = data.created_at ?? '';
    this.updatedAt = data.updated_at ?? '';
  }

  formatCreatedAt() {
    return dtoDateFormatters.formatCreatedAt(this.createdAt);
  }

  static fromApi(data) {
    if (!data) {
      return null;
    }
    return new LeadSourceDto(data);
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, LeadSourceDto.fromApi).filter(Boolean);
  }
}

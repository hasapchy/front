import { dtoDateFormatters } from '@/utils/dateUtils';
import { createFromApiArray } from '@/utils/dtoUtils';

export default class LeadStatusDto {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.name = data.name ?? '';
    this.color = data.color ?? '#6c757d';
    this.isActive = data.is_active !== false;
    this.sort = data.sort ?? 0;
    this.kanbanOutcome = data.kanban_outcome ?? null;
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
    return new LeadStatusDto(data);
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, LeadStatusDto.fromApi).filter(Boolean);
  }
}

import { dtoDateFormatters } from "@/utils/dateUtils";
import { createFromApiArray } from "@/utils/dtoUtils";

export default class MessageTemplateDto {
  constructor(
    id,
    type,
    name,
    content = '',
    companyId = null,
    company = null,
    userId = null,
    user = null,
    isActive = true,
    createdAt = "",
    updatedAt = "",
  ) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.content = content;
    this.companyId = companyId;
    this.company = company;
    this.userId = userId;
    this.user = user;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  formatCreatedAt() {
    return dtoDateFormatters.formatCreatedAt(this.createdAt);
  }

  formatUpdatedAt() {
    return dtoDateFormatters.formatUpdatedAt(this.updatedAt);
  }

  getTypeLabel() {
    // Динамическая генерация label: преобразуем snake_case в Title Case
    if (!this.type) return '';
    return this.type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      return new MessageTemplateDto(
        data.id,
        data.type,
        data.name,
        data.content,
        data.company?.id || null,
        data.company || null,
        data.user?.id || null,
        data.user || null,
        data.is_active ?? true,
        data.created_at,
        data.updated_at
      );
    }).filter(Boolean);
  }
}


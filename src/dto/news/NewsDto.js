import { dtoDateFormatters } from "@/utils/dateUtils";
import { createFromApiArray } from "@/utils/dtoUtils";

export default class NewsDto {
  constructor(
    id,
    title,
    content = '',
    authorId = null,
    author = null,
    companyId = null,
    company = null,
    createdAt = "",
    updatedAt = "",
  ) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.authorId = authorId;
    this.author = author;
    this.companyId = companyId;
    this.company = company;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  formatCreatedAt() {
    return dtoDateFormatters.formatCreatedAt(this.createdAt);
  }

  formatUpdatedAt() {
    return dtoDateFormatters.formatUpdatedAt(this.updatedAt);
  }

  // Удалить HTML теги для превью
  getPreviewText(maxLength = 150) {
    const text = this.content.replace(/<[^>]*>/g, '');
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      return new NewsDto(
        data.id,
        data.title,
        data.content,
        data.author?.id || null,
        data.author || null,
        data.company?.id || null,
        data.company || null,
        data.created_at,
        data.updated_at
      );
    }).filter(Boolean);
  }
}




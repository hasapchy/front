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
    commentsCount = 0,
    reactionsCount = 0,
    reactionsSummary = [],
    unreadCommentsCount = 0,
    isImportant = false,
    viewedBy = [],
    acknowledgedBy = [],
    acknowledgementsCount = 0,
    acknowledgedByMe = false,
    acknowledgedAt = null,
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
    this.commentsCount = commentsCount;
    this.reactionsCount = reactionsCount;
    this.reactionsSummary = reactionsSummary;
    this.unreadCommentsCount = unreadCommentsCount;
    this.isImportant = isImportant;
    this.viewedBy = viewedBy;
    this.acknowledgedBy = acknowledgedBy;
    this.acknowledgementsCount = acknowledgementsCount;
    this.acknowledgedByMe = acknowledgedByMe;
    this.acknowledgedAt = acknowledgedAt;
  }

  formatCreatedAt() {
    return dtoDateFormatters.formatCreatedAt(this.createdAt);
  }

  getPreviewText(maxLength = 150) {
    const text = this.content.replace(/<[^>]*>/g, '');
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  static fromApiItem(data) {
    if (!data) return null;
    return new NewsDto(
      data.id,
      data.title,
      data.content,
      data.author?.id ?? data.creator_id ?? null,
      data.author ?? null,
      data.company?.id ?? data.company_id ?? null,
      data.company ?? null,
      data.created_at,
      data.updated_at,
      Number(data.comments_count ?? 0),
      Number(data.reactions_count ?? 0),
      Array.isArray(data.reactions_summary) ? data.reactions_summary : [],
      Number(data.unread_comments_count ?? 0),
      Boolean(data.is_important ?? false),
      Array.isArray(data.viewed_by) ? data.viewed_by : [],
      Array.isArray(data.acknowledged_by) ? data.acknowledged_by : [],
      Number(data.acknowledgements_count ?? 0),
      Boolean(data.acknowledged_by_me ?? false),
      data.acknowledged_at ?? null,
    );
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => NewsDto.fromApiItem(data)).filter(Boolean);
  }
}

export default class RecurringScheduleDto {
  constructor(
    id,
    templateId,
    template,
    recurrenceRule,
    startDate,
    nextRunAt,
    endDate,
    endCount,
    occurrenceCount,
    isActive,
    creatorId,
    creator,
    createdAt,
    updatedAt
  ) {
    this.id = id;
    this.templateId = templateId;
    this.template = template;
    this.recurrenceRule = recurrenceRule;
    this.startDate = startDate;
    this.nextRunAt = nextRunAt;
    this.endDate = endDate;
    this.endCount = endCount;
    this.occurrenceCount = occurrenceCount;
    this.isActive = isActive;
    this.creatorId = creatorId;
    this.creator = creator;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromApi(item) {
    if (!item) return null;
    const recurrenceRule = item.recurrence_rule
      ? {
          ...item.recurrence_rule,
          monthDay: item.recurrence_rule.month_day,
        }
      : null;
    return new RecurringScheduleDto(
      item.id,
      item.template_id,
      item.template,
      recurrenceRule,
      item.start_date,
      item.next_run_at,
      item.end_date,
      item.end_count,
      item.occurrence_count,
      item.is_active,
      item.creator_id,
      item.creator,
      item.created_at,
      item.updated_at
    );
  }

  static fromApiArray(items) {
    return Array.isArray(items) ? items.map((item) => RecurringScheduleDto.fromApi(item)) : [];
  }

  static toApi(payload) {
    const recurrenceRule = payload.recurrenceRule
      ? {
          ...payload.recurrenceRule,
          month_day: payload.recurrenceRule.monthDay,
        }
      : null;
    const data = {
      recurrence_rule: recurrenceRule,
      start_date: payload.startDate,
      end_date: payload.endDate,
      end_count: payload.endCount,
      is_active: payload.isActive,
    };
    if (payload.templateId != null) {
      data.template_id = payload.templateId;
    }
    return data;
  }
}

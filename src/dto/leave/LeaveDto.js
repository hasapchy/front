import { dtoDateFormatters } from "@/utils/dateUtils";
import { createFromApiArray } from "@/utils/dtoUtils";
import LeaveTypeDto from "./LeaveTypeDto";

export default class LeaveDto {
  constructor(
    id,
    leaveTypeId,
    leaveType = null,
    userId,
    user = null,
    comment = null,
    dateFrom,
    dateTo,
    createdAt = "",
    updatedAt = ""
  ) {
    this.id = id;
    this.leaveTypeId = leaveTypeId;
    this.leaveType = leaveType;
    this.userId = userId;
    this.user = user;
    this.comment = comment;
    this.dateFrom = dateFrom;
    this.dateTo = dateTo;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  get leaveTypeName() {
    return this.leaveType ? this.leaveType.name : '-';
  }

  get userName() {
    return this.user ? (this.user.name || this.user.email) : '-';
  }

  formatDateFrom() {
    if (!this.dateFrom) return '';
    return dtoDateFormatters.formatDate(this.dateFrom);
  }

  formatDateTo() {
    if (!this.dateTo) return '';
    return dtoDateFormatters.formatDate(this.dateTo);
  }

  formatCreatedAt() {
    return dtoDateFormatters.formatCreatedAt(this.createdAt);
  }

  formatUpdatedAt() {
    return dtoDateFormatters.formatUpdatedAt(this.updatedAt);
  }

  get duration() {
    if (!this.dateFrom || !this.dateTo) return { days: 0, hours: 0, minutes: 0 };
    const from = new Date(this.dateFrom);
    const to = new Date(this.dateTo);
    const diffTime = Math.abs(to - from);
    
    // Вычисляем дни, часы и минуты
    const totalMinutes = Math.floor(diffTime / (1000 * 60));
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    
    return { days, hours, minutes };
  }
  
  formatDuration(t) {
    if (!t) t = (key) => key;
    const { days, hours, minutes } = this.duration;
    
    const parts = [];
    if (days > 0) {
      parts.push(`${days} ${days === 1 ? t('day') : t('days')}`);
    }
    if (hours > 0) {
      const hourKey = hours === 1 ? 'hour' : 'hours';
      parts.push(`${hours} ${t(hourKey)}`);
    }
    if (minutes > 0) {
      const minuteKey = minutes === 1 ? 'minute' : 'minutes';
      parts.push(`${minutes} ${t(minuteKey)}`);
    }
    
    return parts.length > 0 ? parts.join(' ') : `0 ${t('minutes')}`;
  }

  get dateFromForInput() {
    if (!this.dateFrom) return '';
    return String(this.dateFrom).slice(0, 16);
  }

  get dateToForInput() {
    if (!this.dateTo) return '';
    return String(this.dateTo).slice(0, 16);
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      const leaveTypeData = data.leave_type || data.leaveType;
      const leaveType = leaveTypeData 
        ? LeaveTypeDto.fromApiArray([leaveTypeData])[0] || null 
        : null;
      
      const user = data.user || null;

      return new LeaveDto(
        data.id,
        data.leave_type_id || data.leaveTypeId,
        leaveType,
        data.user_id || data.userId,
        user,
        data.comment,
        data.date_from || data.dateFrom,
        data.date_to || data.dateTo,
        data.created_at || data.createdAt,
        data.updated_at || data.updatedAt
      );
    }).filter(Boolean);
  }
}


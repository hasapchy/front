import { dtoDateFormatters } from "@/utils/dateUtils";
import { formatNumber, formatCurrency } from "@/utils/numberUtils";
import { createFromApiArray, getUserIdsFromArray } from "@/utils/dtoUtils";
import ClientDto from "@/dto/client/ClientDto";
import CurrencyDto from "@/dto/app/CurrencyDto";
import ProjectStatusDto from "@/dto/project/ProjectStatusDto";
import "dayjs/locale/ru";

export default class ProjectDto {
  constructor(
    id,
    name,
    budget,
    currencyId = null,
    date = null,
    clientId = null,
    client = null,
    userId = null,
    userName = null,
    userPhoto = null,
    users = [],
    createdAt = "",
    updatedAt = "",
    files = [],
    currency = null,
    description = null,
    creator = null,
    statusId = null,
    status = null,
  ) {
    this.id = id;
    this.name = name;
    this.date = date;
    this.budget = budget;
    this.currencyId = currencyId;
    this.clientId = clientId;
    /** @type {ClientDto | null} */
    this.client = client;
    this.userId = userId;
    this.userName = userName;
    this.userPhoto = userPhoto;
    this.users = users;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.files = files;
    this.currency = currency;
    this.description = description;
    this.creator = creator;
    this.statusId = statusId;
    this.status = status;
  }

  get statusName() {
    return this.status?.name || '';
  }

  set statusName(value) {
    if (this.status) {
      this.status.name = value;
    }
  }

  formatDate() {
    return dtoDateFormatters.formatDate(this.date);
  }

  formatCreatedAt() {
    return dtoDateFormatters.formatCreatedAt(this.createdAt);
  }

  formatUpdatedAt() {
    return dtoDateFormatters.formatUpdatedAt(this.updatedAt);
  }

  getUserIds() {
    return getUserIdsFromArray(this.users);
  }

  getFileUrl(file) {
    return file?.path ? `/storage/${file.path}` : "#";
  }

  getFileIcon(file) {
    const ext = (file?.name || file?.path || "").split(".").pop().toLowerCase();
    if (["pdf"].includes(ext)) return "far fa-file-pdf";
    if (["doc", "docx"].includes(ext)) return "far fa-file-word";
    if (["xls", "xlsx"].includes(ext)) return "far fa-file-excel";
    if (["png", "jpg", "jpeg", "gif", "bmp", "svg"].includes(ext))
      return "far fa-file-image";
    if (["zip", "rar", "7z"].includes(ext)) return "far fa-file-archive";
    if (["txt", "md"].includes(ext)) return "far fa-file-alt";
    return "far fa-file";
  }

  getFormattedFiles() {
    return (this.files || []).map((file) => ({
      name: file.name || file.path,
      url: this.getFileUrl(file),
      icon: this.getFileIcon(file),
      path: file.path,
      size: file.size,
      mimeType: file.mime_type,
      uploadedAt: file.uploaded_at,
      formattedSize: this.formatFileSize(file.size),
      formattedUploadDate: file.uploaded_at ? dtoDateFormatters.formatCreatedAt(file.uploaded_at) : ''
    }));
  }

  formatFileSize(bytes) {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  hasFiles() {
    return this.files && this.files.length > 0;
  }

  getFilesCount() {
    return this.files ? this.files.length : 0;
  }

  getBudgetDisplay() {
    if (!this.currencyId || !this.currency) {
      return formatNumber(this.budget);
    }
    return formatCurrency(this.budget, this.currency.symbol);
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      const client = data.client ? ClientDto.fromApiArray([data.client])[0] || null : null;
      const currency = data.currency ? new CurrencyDto({
        id: data.currency.id,
        name: data.currency.name,
        symbol: data.currency.symbol,
        is_default: data.currency.is_default,
        is_report: data.currency.is_report,
        status: data.currency.status
      }) : null;
      
      const status = data.status ? ProjectStatusDto.fromApiArray([data.status])[0] : null;
      
      return new ProjectDto(
        data.id,
        data.name,
        data.budget,
        data.currency_id,
        data.date,
        data.client_id,
        client,
        data.creator_id,
        data.user_name,
        data.user_photo,
        data.users || [],
        data.created_at,
        data.updated_at,
        data.files || [],
        currency,
        data.description,
        data.creator,
        data.status_id,
        status
      );
    }).filter(Boolean);
  }
}

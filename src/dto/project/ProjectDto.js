import { dayjsDate, dayjsDateTime } from "@/utils/dateUtils";
import ClientDto from "../client/ClientDto";
import "dayjs/locale/ru";

export default class ProjectDto {
  constructor(
    id,
    name,
    budget,
    currencyId = null,
    exchangeRate = null,
    date = null,
    clientId = null,
    client = null,
    userId = null,
    userName = null,
    users = [],
    createdAt = "",
    updatedAt = "",
    files = [],
    currency = null,
    description = null,
    creator = null,
    statusId = null,
    status = null
  ) {
    this.id = id;
    this.name = name;
    this.date = date;
    this.budget = budget;
    this.currencyId = currencyId;
    this.exchangeRate = exchangeRate;
    this.clientId = clientId;
    /** @type {ClientDto | null} */
    this.client = client;
    this.userId = userId;
    this.userName = userName;
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

  formatDate() {
    return dayjsDateTime(this.date);
  }

  formatCreatedAt() {
    return dayjsDate(this.createdAt);
  }

  formatUpdatedAt() {
    return dayjsDate(this.updatedAt);
  }

  // Получить список ID пользователей
  getUserIds() {
    return this.users.map(user => user.id.toString());
  }

  // Получить список имен пользователей
  getUserNames() {
    return this.users.map(user => user.name).join(', ');
  }

  // Проверить, есть ли пользователь с указанным ID
  hasUser(userId) {
    return this.users.some(user => user.id == userId);
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
      formattedUploadDate: file.uploaded_at ? dayjsDate(file.uploaded_at) : ''
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

  getExchangeRateDisplay() {
    return this.exchangeRate ? this.exchangeRate.toFixed(6) : '1.000000';
  }

  // Получить бюджет в манатах (дефолтная валюта)
  getBudgetInManat() {
    if (!this.currencyId) {
      return this.budget; // Если валюта не выбрана, возвращаем как есть
    }
    
    // Используем курс из атрибута, который автоматически получает актуальный курс
    const rate = this.exchangeRate || 1;
    return (this.budget * rate).toFixed(2);
  }

  // Получить отображение бюджета с двумя валютами
  getBudgetDisplay() {
    if (!this.currencyId || !this.currency) {
      return this.budget; // Если валюта не выбрана, возвращаем только бюджет
    }
    
    const budgetInManat = this.getBudgetInManat();
    return `${this.budget} ${this.currency.symbol} (${budgetInManat} ${this.currency.symbol})`;
  }
}

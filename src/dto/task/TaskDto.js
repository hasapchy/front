import { dtoDateFormatters } from "@/utils/dateUtils";
import { createFromApiArray } from "@/utils/dtoUtils";

export default class TaskDto {
  constructor(
    id,
    title,
    description = null,
    status = 'in_progress',
    deadline = null,
    creatorId = null,
    creator = null,
    supervisorId = null,
    supervisor = null,
    executorId = null,
    executor = null,
    projectId = null,
    project = null,
    companyId = null,
    files = [],
    comments = [],
    createdAt = "",
    updatedAt = "",
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.status = status;
    this.deadline = deadline;
    this.creatorId = creatorId;
    this.creator = creator;
    this.supervisorId = supervisorId;
    this.supervisor = supervisor;
    this.executorId = executorId;
    this.executor = executor;
    this.projectId = projectId;
    this.project = project;
    this.companyId = companyId;
    this.files = files;
    this.comments = comments;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  formatDeadline() {
    if (!this.deadline) return '';
    return dtoDateFormatters.formatDate(this.deadline);
  }

  formatCreatedAt() {
    return dtoDateFormatters.formatCreatedAt(this.createdAt);
  }

  formatUpdatedAt() {
    return dtoDateFormatters.formatUpdatedAt(this.updatedAt);
  }

  getStatusBadge() {
    const badges = {
      'pending': { class: 'bg-yellow-100 text-yellow-800', text: 'Ожидает' },
      'in_progress': { class: 'bg-blue-100 text-blue-800', text: 'В работе' },
      'completed': { class: 'bg-green-100 text-green-800', text: 'Завершена' },
      'postponed': { class: 'bg-gray-100 text-gray-800', text: 'Отложена' },
    };
    return badges[this.status] || { class: '', text: this.status };
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

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      return new TaskDto(
        data.id,
        data.title,
        data.description,
        data.status,
        data.deadline,
        data.creator?.id || null,
        data.creator || null,
        data.supervisor?.id || null,
        data.supervisor || null,
        data.executor?.id || null,
        data.executor || null,
        data.project?.id || null,
        data.project || null,
        data.company_id || null,
        data.files || [],
        data.comments || [],
        data.created_at,
        data.updated_at
      );
    }).filter(Boolean);
  }
}


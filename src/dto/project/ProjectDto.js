import { dayjsDate, dayjsDateTime } from "@/utils/dateUtils";
import ClientDto from "../client/ClientDto";
import "dayjs/locale/ru";

export default class ProjectDto {
  constructor(
    id,
    name,
    budget,
    date = null,
    clientId = null,
    client = null,
    userId = null,
    userName = null,
    users = [],
    createdAt = "",
    updatedAt = "",
    files = []
  ) {
    this.id = id;
    this.name = name;
    this.date = date;
    this.budget = budget;
    this.clientId = clientId;
    /** @type {ClientDto | null} */
    this.client = client;
    this.userId = userId;
    this.userName = userName;
    this.users = users;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.files = files;
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
    }));
  }
}

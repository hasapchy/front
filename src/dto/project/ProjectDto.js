import { dayjsDate } from "@/utils/dateUtils";
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
    return this.date !== null ? dayjsDate(this.date) : "-";
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
}

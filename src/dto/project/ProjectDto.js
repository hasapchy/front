import { dtoDateFormatters } from "@/utils/dateUtils";
import { formatNumberForDisplay, formatCurrencyForDisplay } from "@/utils/numberUtils";
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
    users = [],
    createdAt = "",
    updatedAt = "",
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
    this.users = users;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.currency = currency;
    this.currencyCode = currency?.code ?? null;
    this.description = description;
    this.creator = creator;
    this.statusId = statusId;
    this.status = status;
  }

  get statusName() {
    return this.status?.name ;
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
  getUserIds() {
    return getUserIdsFromArray(this.users);
  }

  getBudgetDisplay() {
    const code = this.currencyCode || this.currency?.code;
    if (!this.currencyId || !code) {
      return formatNumberForDisplay(this.budget, true);
    }
    return formatCurrencyForDisplay(this.budget, code, true);
  }

  static fromApi(data) {
    if (!data) return null;
    const client = data.client ? ClientDto.fromApi(data.client) : null;
    const currency = data.currency ? new CurrencyDto({
      id: data.currency.id,
      name: data.currency.name,
      code: data.currency.code,
      is_default: data.currency.is_default,
      is_report: data.currency.is_report,
      status: data.currency.status
    }) : null;

    const status = data.status ? ProjectStatusDto.fromApi(data.status) : null;

    return new ProjectDto(
      data.id,
      data.name,
      data.budget,
      data.currency_id,
      data.date,
      data.client_id,
      client,
      data.creator_id,
      data.users ?? [],
      data.created_at,
      data.updated_at,
      currency,
      data.description,
      data.creator,
      data.status_id,
      status
    );
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, ProjectDto.fromApi).filter(Boolean);
  }

  static hydrate(data) {
    if (!data) {
      return null;
    }
    if (typeof data.getBudgetDisplay === "function") {
      return data;
    }
    const dto = Object.create(ProjectDto.prototype);
    Object.assign(dto, data);
    dto.currencyCode = data.currencyCode ?? data.currency?.code ?? null;
    return dto;
  }
}

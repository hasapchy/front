import { createFromApiArray } from '@/utils/dtoUtils';
import ClientDto from '@/dto/client/ClientDto';

export default class TransactionTemplateDto {
  constructor(
    id,
    name,
    icon,
    amount,
    currencyId,
    currencySymbol,
    type,
    typeName,
    categoryId,
    categoryName,
    date,
    clientId,
    clientName,
    client,
    projectId,
    projectName,
    note,
    creatorId,
    creatorName,
    cashId,
    cashName,
    createdAt,
    activeScheduleId = null
  ) {
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.amount = amount;
    this.currencyId = currencyId;
    this.currencySymbol = currencySymbol;
    this.type = type;
    this.typeName = typeName;
    this.categoryId = categoryId;
    this.categoryName = categoryName;
    this.date = date;
    this.clientId = clientId;
    this.clientName = clientName;
    this.client = client;
    this.projectId = projectId;
    this.projectName = projectName;
    this.note = note;
    this.creatorId = creatorId;
    this.creatorName = creatorName;
    this.cashId = cashId;
    this.cashName = cashName;
    this.createdAt = createdAt ?? null;
    this.activeScheduleId = activeScheduleId;
  }

  static fromApi(item) {
    if (!item) return null;
    const creator = item.creator || item.user;
    const creatorName = creator
      ? [creator.name, creator.surname].filter(Boolean).join(' ').trim() || creator.name
      : '';
    const type = item.type === true || item.type === 1 ? 1 : 0;
    const typeName = type === 1 ? 'income' : 'outcome';
    const client = item.client ? ClientDto.fromApiArray([item.client])[0] || null : null;
    const clientName = client && typeof client.fullName === 'function'
      ? client.fullName()
      : (item.client
          ? [item.client.first_name, item.client.last_name].filter(Boolean).join(' ').trim()
          : '');
    return new TransactionTemplateDto(
      item.id,
      item.name,
      item.icon || '',
      item.amount != null ? parseFloat(item.amount) : null,
      item.currency_id ?? item.currencyId ?? null,
      item.currency?.symbol ?? item.currencySymbol ?? '',
      type,
      typeName,
      item.category_id ?? item.categoryId ?? null,
      item.category?.name ?? item.categoryName ?? '',
      item.date ?? null,
      item.client_id ?? item.clientId ?? null,
      clientName,
      client,
      item.project_id ?? item.projectId ?? null,
      item.project?.name ?? item.projectName ?? '',
      item.note ?? '',
      item.creator_id ?? item.creatorId ?? null,
      creatorName,
      item.cash_id ?? item.cashId ?? null,
      item.cash_register?.name ?? item.cashRegister?.name ?? item.cashName ?? '',
      item.created_at ?? item.createdAt ?? null,
      Array.isArray(item.rec_schedules) && item.rec_schedules.length > 0
        ? item.rec_schedules[0].id
        : null
    );
  }

  static fromApiArray(arr) {
    return createFromApiArray(arr, TransactionTemplateDto.fromApi);
  }
}

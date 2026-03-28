import { createFromApiArray } from '@/utils/dtoUtils';
import ClientDto from '@/dto/client/ClientDto';
import { getClientDisplayName } from '@/utils/displayUtils';
import { getCashRegisterDisplayNameByParts } from '@/utils/cashRegisterUtils';

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
    creator,
    cashId,
    cashName,
    createdAt
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
    this.creator = creator ?? null;
    this.cashId = cashId;
    this.cashName = cashName;
    this.createdAt = createdAt ?? null;
  }

  static fromApi(item) {
    if (!item) return null;
    const creator = item.creator ?? null;
    const type = Number(item.type) === 1 ? 1 : 0;
    const typeName = type === 1 ? 'income' : 'outcome';
    const client = item.client ? ClientDto.fromApi(item.client) : null;
    const clientName = getClientDisplayName(client);
    return new TransactionTemplateDto(
      item.id,
      item.name,
      item.icon ,
      item.amount != null ? parseFloat(item.amount) : null,
      item.currency_id ?? null,
      item.currency?.symbol ?? '',
      type,
      typeName,
      item.category_id ?? null,
      item.category?.name ?? '',
      item.date ?? null,
      item.client_id ?? null,
      clientName,
      client,
      item.project_id ?? null,
      item.project?.name ?? '',
      item.note ?? '',
      item.creator_id ?? null,
      creator,
      item.cash_id ?? null,
      getCashRegisterDisplayNameByParts(item.cash_register?.name, item.cash_register?.is_cash),
      item.created_at ?? null
    );
  }

  static fromApiArray(arr) {
    return createFromApiArray(arr, TransactionTemplateDto.fromApi);
  }
}

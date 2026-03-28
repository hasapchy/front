import { formatNumber } from "@/utils/numberUtils";

export default class ClientBalanceDto {
  constructor(id, clientId, currencyId, type, currency, balance, isDefault, note, users = []) {
    this.id = id;
    this.clientId = clientId;
    this.currencyId = currencyId;
    this.type = Number(type) === 0 ? 0 : 1;
    this.currency = currency;
    this.balance = parseFloat(balance) || 0;
    this.isDefault = Number(isDefault) === 1;
    this.note = note ;
    this.users = Array.isArray(users) ? users : [];
  }

  balanceFormatted() {
    return formatNumber(this.balance, null, true);
  }

  getUserIds() {
    return this.users.map(u => (u?.id != null ? u.id : u)).filter(Boolean);
  }

  static fromApi(data) {
    const users = (data.users ?? []).map(u => ({ id: u?.id ?? u, name: u?.name  }));
    return new ClientBalanceDto(
      data.id,
      data.client_id,
      data.currency_id,
      data.type,
      data.currency,
      data.balance,
      data.is_default,
      data.note,
      users
    );
  }

  static fromApiArray(dataArray) {
    return (dataArray ?? []).map(data => ClientBalanceDto.fromApi(data));
  }
}

import { formatNumber } from "@/utils/numberUtils";

export default class ClientBalanceDto {
  constructor(id, clientId, currencyId, currency, balance, isDefault, note, users = []) {
    this.id = id;
    this.clientId = clientId;
    this.currencyId = currencyId;
    this.currency = currency;
    this.balance = parseFloat(balance) || 0;
    this.isDefault = Boolean(isDefault);
    this.note = note || '';
    this.users = Array.isArray(users) ? users : [];
  }

  balanceFormatted() {
    return formatNumber(this.balance, null, true);
  }

  getUserIds() {
    return this.users.map(u => (typeof u === 'object' && u?.id != null) ? u.id : u).filter(Boolean);
  }

  static fromApi(data) {
    const users = (data.users || []).map(u => (typeof u === 'object' ? { id: u.id, name: u.name } : { id: u, name: '' }));
    return new ClientBalanceDto(
      data.id,
      data.client_id,
      data.currency_id,
      data.currency,
      data.balance,
      data.is_default,
      data.note,
      users
    );
  }

  static fromApiArray(dataArray) {
    return (dataArray || []).map(data => ClientBalanceDto.fromApi(data));
  }
}

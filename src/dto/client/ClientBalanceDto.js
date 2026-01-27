import { formatNumber } from "@/utils/numberUtils";

export default class ClientBalanceDto {
  constructor(id, clientId, currencyId, currency, balance, isDefault, note) {
    this.id = id;
    this.clientId = clientId;
    this.currencyId = currencyId;
    this.currency = currency;
    this.balance = parseFloat(balance) || 0;
    this.isDefault = Boolean(isDefault);
    this.note = note || '';
  }

  balanceFormatted() {
    return formatNumber(this.balance, null, true);
  }

  static fromApi(data) {
    return new ClientBalanceDto(
      data.id,
      data.client_id,
      data.currency_id,
      data.currency,
      data.balance,
      data.is_default,
      data.note
    );
  }

  static fromApiArray(dataArray) {
    return (dataArray || []).map(data => ClientBalanceDto.fromApi(data));
  }
}

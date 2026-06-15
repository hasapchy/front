import { formatNumberForDisplay } from "@/utils/numberUtils";
import { createFromApiArray } from "@/utils/dtoUtils";

export default class ClientSearchDto {
  constructor(
    id,
    clientType,
    balance = 0,
    isSupplier,
    isConflict,
    firstName,
    lastName,
    position,
    primaryPhone = null
  ) {
    this.id = id;
    this.clientType = clientType;
    this.balance = balance != null ? parseFloat(balance) || 0 : 0;
    this.isSupplier = Number(isSupplier) === 1;
    this.isConflict = Number(isConflict) === 1;
    this.firstName = firstName;
    this.lastName = lastName;
    this.position = position;
    this.status = true;
    this.primaryPhone = primaryPhone;
  }

  balanceFormatted() {
    return formatNumberForDisplay(this.balance, true);
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      return new ClientSearchDto(
        data.id,
        data.client_type,
        data.balance ?? 0,
        data.is_supplier,
        data.is_conflict,
        data.first_name,
        data.last_name,
        data.position,
        data.primary_phone
      );
    }).filter(Boolean);
  }
}

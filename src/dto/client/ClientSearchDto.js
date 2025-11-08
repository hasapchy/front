import ClientPhoneDto from "./ClientPhoneDto";
import { formatNumber } from "@/utils/numberUtils";
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
    contactPerson,
    status,
    phones = []
  ) {
    this.id = id;
    this.clientType = clientType;
    this.balance = balance != null ? parseFloat(balance) || 0 : 0;
    this.isSupplier = Boolean(isSupplier);
    this.isConflict = Boolean(isConflict);
    this.firstName = firstName;
    this.lastName = lastName;
    this.contactPerson = contactPerson;
    this.status = Boolean(status);
    this.phones = (phones || []).map((phone) => {
      if (typeof phone === 'string') {
        return { phone };
      } else if (phone && phone.phone) {
        return new ClientPhoneDto(phone.id, phone.client_id, phone.phone);
      } else {
        return phone;
      }
    });
  }

  balanceFormatted() {
    return formatNumber(this.balance, null, true);
  }

  fullName() {
    const baseName = [this.firstName, this.lastName].filter(Boolean).join(' ').trim();
    const contactPerson = this.contactPerson || '';
    
    if (!baseName && !contactPerson) return '';
    if (!baseName) return contactPerson;
    if (!contactPerson) return baseName;
    
    return `${baseName} (${contactPerson})`;
  }

  icons() {
    let res = this.clientType === "company"
      ? '<i class="fas fa-building text-[#3571A4] mr-2" title="Компания"></i>'
      : '<i class="fas fa-user text-[#3571A4] mr-2" title="Индивидуальный клиент"></i>';
    
    if (this.isConflict) {
      res += '<i class="fas fa-exclamation-triangle text-[#D53935] mr-2" title="Проблемный клиент"></i>';
    }
    if (this.isSupplier) {
      res += '<i class="fas fa-truck text-[#3571A4] mr-2" title="Поставщик"></i>';
    }
    return res;
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      return new ClientSearchDto(
        data.id,
        data.client_type,
        data.balance || 0,
        data.is_supplier,
        data.is_conflict,
        data.first_name,
        data.last_name,
        data.contact_person,
        data.status,
        data.phones || []
      );
    }).filter(Boolean);
  }
}

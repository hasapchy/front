import ClientPhoneDto from "./ClientPhoneDto";
import { formatNumber } from "@/utils/numberUtils";
import { createFromApiArray } from "@/utils/dtoUtils";
import { stripPositionFromFullName } from "@/utils/displayUtils";

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
    return formatNumber(this.balance, null, true);
  }

  fullName() {
    if (this.clientType === 'employee' || this.clientType === 'investor') {
      const baseName = [this.firstName, this.lastName].filter(Boolean).join(' ').trim();
      const position = this.position ;
      
      if (!baseName) return '';
      
      if (position) {
        return `${baseName} (${position})`;
      }
      
      return baseName;
    } else if (this.clientType === 'company') {
      const baseName = [this.firstName, this.lastName].filter(Boolean).join(' ').trim();
      const position = this.position ;
      if (!baseName) return '';
      if (position) {
        return `${baseName} (${position})`;
      }
      return baseName;
    } else {
      const baseName = [this.firstName, this.lastName].filter(Boolean).join(' ').trim();
      const position = this.position ;
      
      if (!baseName) return '';
      
      if (position) {
        return `${baseName} (${position})`;
      }
      
      return baseName;
    }
  }

  displayName() {
    return stripPositionFromFullName(this.fullName());
  }

  displayPosition() {
    return this.position ;
  }

  icons() {
    let res = this.clientType === "company"
      ? '<i class="fas fa-building text-[#3571A4] mr-2" title="Компания"></i>'
      : '<i class="fas fa-user text-[#3571A4] mr-2" title="Индивидуальный клиент"></i>';
    
    if (this.isConflict) {
      res += '<i class="fas fa-angry text-[#D53935] mr-2" title="Проблемный клиент"></i>';
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

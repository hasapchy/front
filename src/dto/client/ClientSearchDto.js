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
    patronymic,
    contactPerson,
    position,
    status,
    phones = [],
    employeeId = null,
    employee = null
  ) {
    this.id = id;
    this.clientType = clientType;
    this.balance = balance != null ? parseFloat(balance) || 0 : 0;
    this.isSupplier = Boolean(isSupplier);
    this.isConflict = Boolean(isConflict);
    this.firstName = firstName;
    this.lastName = lastName;
    this.patronymic = patronymic;
    this.contactPerson = contactPerson;
    this.position = position;
    this.status = Boolean(status);
    this.employeeId = employeeId;
    this.employee = employee;
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
    if (this.clientType === 'employee' || this.clientType === 'investor') {
      if (this.employee) {
        const employeeName = this.employee.name || '';
        const employeeSurname = this.employee.surname || '';
        const employeePosition = this.employee.position || '';
        const parts = [employeeName, employeeSurname].filter(Boolean);
        let result = parts.join(' ').trim();
        if (employeePosition) {
          result += ` (${employeePosition})`;
        }
        return result || this.firstName || '';
      }
      return this.firstName || '';
    } else if (this.clientType === 'company') {
      const baseName = [this.firstName, this.lastName].filter(Boolean).join(' ').trim();
      const position = this.position || '';
      const contactPerson = this.contactPerson || '';
      
      if (!baseName && !contactPerson) return '';
      if (!baseName) return contactPerson;
      
      let result = baseName;
      if (position) {
        result += ` (${position})`;
      }
      if (contactPerson && contactPerson !== baseName) {
        result += ` (${contactPerson})`;
      }
      
      return result;
    } else {
      const baseName = [this.firstName, this.lastName].filter(Boolean).join(' ').trim();
      const position = this.position || '';
      
      if (!baseName) return '';
      
      if (position) {
        return `${baseName} (${position})`;
      }
      
      return baseName;
    }
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
        data.patronymic,
        data.contact_person,
        data.position,
        data.status,
        data.phones || [],
        data.employee_id,
        data.employee
      );
    }).filter(Boolean);
  }
}

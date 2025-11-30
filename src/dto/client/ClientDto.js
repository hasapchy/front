import ClientPhoneDto from "./ClientPhoneDto";
import ClientEmailDto from "./ClientEmailDto";
import { dtoDateFormatters } from "@/utils/dateUtils";
import { formatNumber } from "@/utils/numberUtils";
import { createFromApiArray } from "@/utils/dtoUtils";

export default class ClientDto {
  constructor(
    id,
    clientType,
    balance = 0,
    isSupplier,
    isConflict,
    firstName,
    lastName,
    contactPerson,
    address,
    note,
    status,
    discountType,
    discount,
    createdAt,
    updatedAt,
    emails = [],
    phones = [],
    userId = null,
    userName = null,
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
    this.contactPerson = contactPerson;
    this.address = address;
    this.note = note;
    this.status = Boolean(status);
    this.discountType = discountType;
    this.discount = discount;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.userId = userId;
    this.userName = userName;
    this.employeeId = employeeId;
    this.employee = employee;
    this.emails = (emails || []).map(
      (email) => new ClientEmailDto(email.id, email.client_id, email.email)
    );
    this.phones = (phones || []).map(
      (phone) => new ClientPhoneDto(phone.id, phone.client_id, phone.phone)
    );
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

  discountFormatted() {
    if (this.discount == null && !this.discountType) return "";
    const discount = this.discount ?? "";
    const typeMap = {
      "fixed": "фиксированная",
      "percent": "процентная"
    };
    const discountType = typeMap[this.discountType] || this.discountType;
    return discount + (discountType ? ` (${discountType})` : "");
  }

  formatCreatedAt() {
    const date = dtoDateFormatters.formatCreatedAt(this.createdAt);
    const user = this.userName ? ` (${this.userName})` : '';
    return date + user;
  }

  formatUpdatedAt() {
    return dtoDateFormatters.formatUpdatedAt(this.updatedAt);
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      return new ClientDto(
        data.id,
        data.client_type,
        data.balance,
        data.is_supplier,
        data.is_conflict,
        data.first_name,
        data.last_name,
        data.contact_person,
        data.address,
        data.note,
        data.status,
        data.discount_type,
        data.discount,
        data.created_at,
        data.updated_at,
        data.emails || [],
        data.phones || [],
        data.user_id,
        data.user_name || data.user?.name || null,
        data.employee_id,
        data.employee
      );
    }).filter(Boolean);
  }
}

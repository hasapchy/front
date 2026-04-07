import ClientPhoneDto from "./ClientPhoneDto";
import ClientEmailDto from "./ClientEmailDto";
import ClientBalanceDto from "./ClientBalanceDto";
import { dtoDateFormatters } from "@/utils/dateUtils";
import { formatNumber } from "@/utils/numberUtils";
import { createFromApiArray } from "@/utils/dtoUtils";
import { dt } from "@/utils/displayI18n";
export default class ClientDto {
  constructor(
    id,
    clientType,
    balance = 0,
    isSupplier,
    isConflict,
    firstName,
    lastName,
    patronymic,
    position,
    address,
    note,
    status,
    discountType,
    discount,
    createdAt,
    updatedAt,
    emails = [],
    phones = [],
    creatorId = null,
    creator = null,
    employeeId = null,
    employee = null,
    currencySymbol = null,
    balances = []
  ) {
    this.id = id;
    this.clientType = clientType;
    this.balance = balance != null ? parseFloat(balance) || 0 : 0;
    this.isSupplier = Number(isSupplier) === 1;
    this.isConflict = Number(isConflict) === 1;
    this.firstName = firstName;
    this.lastName = lastName;
    this.patronymic = patronymic;
    this.position = position;
    this.address = address;
    this.note = note;
    this.status = Number(status) === 1;
    this.discountType = discountType;
    this.discount = discount;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.creatorId = creatorId;
    this.creator = creator;
    this.employeeId = employeeId;
    this.employee = employee;
    this.currencySymbol = currencySymbol;
    this.balances = balances;
    this.emails = (emails ?? []).map(
      (email) => new ClientEmailDto(email.id, null, email.email)
    );
    this.phones = (phones ?? []).map(
      (phone) => new ClientPhoneDto(phone.id, null, phone.phone)
    );
  }

  balanceFormatted() {
    return formatNumber(this.balance, null, true);
  }

  fullName() {
    if (this.clientType === 'employee' || this.clientType === 'investor') {
      if (this.employee) {
        const employeeName = this.employee.name ;
        const employeeSurname = this.employee.surname ;
        const employeePosition = this.employee.position ;
        const parts = [employeeName, employeeSurname].filter(Boolean);
        let result = parts.join(' ').trim();
        if (employeePosition) {
          result += ` (${employeePosition})`;
        }
        return result || this.firstName ;
      }
      return this.firstName ;
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
    if (this.clientType === 'employee' || this.clientType === 'investor') {
      if (this.employee) {
        const parts = [this.employee.name, this.employee.surname].filter(Boolean);
        return parts.join(' ').trim() || this.firstName ;
      }
      return this.firstName ;
    }
    return [this.firstName, this.lastName].filter(Boolean).join(' ').trim();
  }

  displayPosition() {
    if (this.clientType === 'employee' || this.clientType === 'investor') {
      return this.employee?.position ;
    }
    return this.position ;
  }

  icons() {
    let res = this.clientType === "company"
      ? `<i class="fas fa-building text-[var(--nav-accent)] mr-2" title="${dt('iconTitleCompany')}"></i>`
      : `<i class="fas fa-user text-[var(--nav-accent)] mr-2" title="${dt('iconTitleIndividualClient')}"></i>`;
    
    if (this.isConflict) {
      res += `<i class="fas fa-angry text-[#D53935] mr-2" title="${dt('iconTitleProblemClient')}"></i>`;
    }
    if (this.isSupplier) {
      res += `<i class="fas fa-truck text-[var(--nav-accent)] mr-2" title="${dt('iconTitleSupplier')}"></i>`;
    }
    return res;
  }

  discountFormatted() {
    if (this.discount == null && !this.discountType) return "";
    const discount = this.discount ?? "";
    const iconMap = {
      fixed: `<i class="fas fa-coins ml-1 text-[var(--nav-accent)]" title="${dt('iconTitleDiscountFixed')}"></i>`,
      percent: `<i class="fas fa-percent ml-1 text-[var(--nav-accent)]" title="${dt('iconTitleDiscountPercent')}"></i>`
    };
    const icon = iconMap[this.discountType] || "";
    return discount + icon;
  }

  formatCreatedAt() {
    const date = dtoDateFormatters.formatCreatedAt(this.createdAt);
    const user = this.creator?.name ? ` (${this.creator.name})` : '';
    return date + user;
  }
  static fromApi(data) {
    if (!data) return null;
    return new ClientDto(
      data.id,
      data.client_type,
      data.balance,
      data.is_supplier,
      data.is_conflict,
      data.first_name,
      data.last_name,
      data.patronymic,
      data.position,
      data.address,
      data.note,
      data.status,
      data.discount_type,
      data.discount,
      data.created_at,
      data.updated_at,
      data.emails ?? [],
      data.phones ?? [],
      data.creator_id,
      data.creator ?? null,
      data.employee_id,
      data.employee,
      data.currency_symbol ?? null,
      (data.balances ?? []).map((b) =>
        ClientBalanceDto.fromApi({ ...b, client_id: data.id })
      )
    );
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, ClientDto.fromApi).filter(Boolean);
  }
}

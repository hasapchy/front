import ClientPhoneDto from "./ClientPhoneDto";
import ClientEmailDto from "./ClientEmailDto";
import ClientBalanceDto from "./ClientBalanceDto";
import { dtoDateFormatters } from "@/utils/dateUtils";
import { formatNumberForDisplay } from "@/utils/numberUtils";
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
    currencyCode = null,
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
    this.currencyCode = currencyCode;
    this.balances = balances;
    this.emails = (emails ?? []).map(
      (email) => new ClientEmailDto(email.id, null, email.email)
    );
    this.phones = (phones ?? []).map(
      (phone) => new ClientPhoneDto(phone.id, null, phone.phone)
    );
  }

  balanceFormatted() {
    return formatNumberForDisplay(this.balance, true);
  }

  balanceDisplay() {
    const symbol = this.currencyCode ?? '';
    return symbol
      ? `${this.balanceFormatted()} ${symbol}`
      : this.balanceFormatted();
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

  discountFormatted() {
    if (this.discount == null && !this.discountType) return "";
    const discount = this.discount ?? "";
    const pill = 'filter-modal-icon-badge shrink-0 ml-1';
    const iconMap = {
      fixed: `<span class="${pill}"><i class="fas fa-coins text-[var(--nav-accent)] text-sm leading-none" title="${dt('iconTitleDiscountFixed')}"></i></span>`,
      percent: `<span class="${pill}"><i class="fas fa-percent text-[var(--nav-accent)] text-sm leading-none" title="${dt('iconTitleDiscountPercent')}"></i></span>`
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

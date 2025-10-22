import ClientPhoneDto from "./ClientPhoneDto";

// ClientSearchDto описывает структуру клиента для поиска (только необходимые поля)
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
    this.id = id; // Идентификатор клиента
    this.clientType = clientType; // Тип клиента
    this.balance = balance === null ? 0 : parseFloat(balance) || 0; // Баланс клиента
    this.isSupplier = Boolean(isSupplier); // Является ли поставщиком
    this.isConflict = Boolean(isConflict); // Является ли конфликтным
    this.firstName = firstName; // Имя клиента
    this.lastName = lastName; // Фамилия клиента
    this.contactPerson = contactPerson; // Контактное лицо
    this.status = Boolean(status); // Статус клиента
    this.phones = phones.map(
      (phone) => new ClientPhoneDto(phone.id, phone.client_id, phone.phone)
    ); // Список телефонов
  }

  balanceFormatted() {
    return this.balance.toFixed(2);
  }

  fullName() {
    return this.contactPerson
      ? `${this.firstName} ${this.lastName} (${this.contactPerson})`
      : `${this.firstName} ${this.lastName}`;
  }

  icons() {
    var res = "";
    if (this.clientType === "company") {
      res +=
        '<i class="fas fa-building text-[#3571A4] mr-2" title="Компания"></i>';
    } else {
      res +=
        '<i class="fas fa-user text-[#3571A4] mr-2" title="Индивидуальный клиент"></i>';
    }
    if (this.isConflict) {
      res +=
        '<i class="fas fa-exclamation-triangle text-[#D53935] mr-2" title="Проблемный клиент"></i>';
    }
    if (this.isSupplier) {
      res +=
        '<i class="fas fa-truck text-[#3571A4] mr-2" title="Поставщик"></i>';
    }
    return res;
  }

  static fromApi(data) {
    if (!data) return null;
    
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
  }
}

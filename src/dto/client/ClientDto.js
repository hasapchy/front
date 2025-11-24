import ClientPhoneDto from "./ClientPhoneDto";
import ClientEmailDto from "./ClientEmailDto";
import { formatNumber } from "@/utils/numberUtils";
import { createFromApiArray, normalizeNumber, normalizeBoolean } from "@/utils/dtoUtils";
import BaseDto from "@/dto/BaseDto";

/**
 * DTO для клиента
 * @class ClientDto
 * @extends BaseDto
 */
export default class ClientDto extends BaseDto {
  /**
   * Создает экземпляр ClientDto
   * @param {number} id - ID клиента
   * @param {string} clientType - Тип клиента (company, individual, employee, investor)
   * @param {number} balance - Баланс клиента
   * @param {boolean} isSupplier - Является ли поставщиком
   * @param {boolean} isConflict - Является ли проблемным клиентом
   * @param {string} firstName - Имя
   * @param {string} lastName - Фамилия
   * @param {string} contactPerson - Контактное лицо
   * @param {string} address - Адрес
   * @param {string} note - Примечание
   * @param {boolean} status - Статус (активен/неактивен)
   * @param {string} discountType - Тип скидки (fixed, percent)
   * @param {number} discount - Размер скидки
   * @param {string} createdAt - Дата создания
   * @param {string} updatedAt - Дата обновления
   * @param {Array} emails - Массив email адресов
   * @param {Array} phones - Массив телефонов
   * @param {number|null} userId - ID пользователя, создавшего клиента
   * @param {string|null} userName - Имя пользователя, создавшего клиента
   * @param {number|null} employeeId - ID сотрудника (если клиент - сотрудник)
   * @param {Object|null} employee - Объект сотрудника
   */
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
    super();
    this.id = id;
    this.clientType = clientType;
    this.balance = balance != null ? (normalizeNumber(balance) ?? 0) : 0;
    this.isSupplier = normalizeBoolean(isSupplier, false);
    this.isConflict = normalizeBoolean(isConflict, false);
    this.firstName = firstName;
    this.lastName = lastName;
    this.contactPerson = contactPerson;
    this.address = address;
    this.note = note;
    this.status = normalizeBoolean(status, false);
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

  /**
   * Получить отформатированный баланс
   * @returns {string} Отформатированный баланс
   */
  balanceFormatted() {
    return formatNumber(this.balance, null, true);
  }

  /**
   * Получить полное имя клиента
   * @returns {string} Полное имя (имя + фамилия) или контактное лицо, или их комбинация
   */
  fullName() {
    const baseName = [this.firstName, this.lastName].filter(Boolean).join(' ').trim();
    const contactPerson = this.contactPerson || '';
    
    if (!baseName && !contactPerson) return '';
    if (!baseName) return contactPerson;
    if (!contactPerson) return baseName;
    
    return `${baseName} (${contactPerson})`;
  }

  /**
   * Получить HTML иконки для типа клиента и статусов
   * @returns {string} HTML строка с иконками
   */
  icons() {
    const typeIcons = {
      company: '<i class="fas fa-building text-[#3571A4] mr-2" title="Компания"></i>',
      employee: '<i class="fas fa-id-badge text-[#3571A4] mr-2" title="Сотрудник"></i>',
      investor: '<i class="fas fa-hand-holding-usd text-[#3571A4] mr-2" title="Инвестор"></i>'
    };
    
    let res = typeIcons[this.clientType] || '<i class="fas fa-user text-[#3571A4] mr-2" title="Индивидуальный клиент"></i>';
    if (this.isConflict) {
      res += '<i class="fas fa-exclamation-triangle text-[#D53935] mr-2" title="Проблемный клиент"></i>';
    }
    if (this.isSupplier) {
      res += '<i class="fas fa-truck text-[#3571A4] mr-2" title="Поставщик"></i>';
    }
    return res;
  }

  /**
   * Получить HTML иконку статуса клиента
   * @returns {string} HTML строка с иконкой статуса
   */
  statusIcon() {
    return this.status
      ? '<i class="fas fa-circle-check text-[#5CB85C]" title="Активен"></i>'
      : '<i class="fas fa-times text-[#D53935]" title="Неактивен"></i>';
  }

  /**
   * Вспомогательный метод для создания HTML списка
   * @private
   * @param {Array} items - Массив элементов
   * @param {Function} getValue - Функция для получения значения из элемента
   * @returns {string} HTML строка со списком
   */
  _createHtmlList(items, getValue) {
    if (!items?.length) return '';
    const listItems = items.map(item => `<li>${getValue(item)}</li>`).join('');
    return `<ul>${listItems}</ul>`;
  }

  /**
   * Получить HTML список телефонов
   * @returns {string} HTML строка со списком телефонов
   */
  phonesHtmlList() {
    return this._createHtmlList(this.phones, phone => phone.phone);
  }

  /**
   * Получить HTML список email адресов
   * @returns {string} HTML строка со списком email адресов
   */
  emailsHtmlList() {
    return this._createHtmlList(this.emails, email => email.email);
  }

  /**
   * Получить отформатированную информацию о скидке
   * @returns {string} Отформатированная строка со скидкой и типом
   */
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

  /**
   * Форматирует дату создания с указанием пользователя
   * @returns {string} Отформатированная дата создания с именем пользователя
   */
  formatCreatedAt() {
    const date = super.formatCreatedAt();
    const user = this.userName ? ` (${this.userName})` : '';
    return date + user;
  }

  /**
   * Создает массив экземпляров ClientDto из массива данных API
   * @param {Array} dataArray - Массив объектов клиентов из API
   * @returns {Array<ClientDto>} Массив экземпляров ClientDto
   */
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
        data.user_name || data.user?.name,
        data.employee_id,
        data.employee
      );
    });
  }
}

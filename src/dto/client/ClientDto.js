import ClientPhoneDto from "./ClientPhoneDto";
import ClientEmailDto from "./ClientEmailDto";
import { dayjsDate, dayjsDateTime } from "@/utils/dateUtils";

// ClientDto описывает структуру клиента
export default class ClientDto {
    constructor(id, clientType, balance = 0, isSupplier, isConflict, firstName, lastName, contactPerson, address, note, status, discountType, discount, createdAt, updatedAt, emails = [], phones = []) {
        this.id = id; // Идентификатор клиента
        this.clientType = clientType; // Тип клиента
        this.balance = balance; // Баланс клиента
        this.isSupplier = (isSupplier == 1 || isSupplier == '1' || isSupplier == true) ? true : false; // Является ли поставщиком
        this.isConflict = (isConflict == 1 || isConflict == '1' || isConflict == true) ? true : false; // Является ли конфликтным
        this.firstName = firstName; // Имя клиента
        this.lastName = lastName; // Фамилия клиента
        this.contactPerson = contactPerson; // Контактное лицо
        this.address = address; // Адрес клиента
        this.note = note; // Заметка
        this.status = (status == 1 || status == '1' || status == true) ? true : false; // Статус клиента
        this.discountType = discountType; // Тип скидки
        this.discount = discount; // Скидка
        this.createdAt = createdAt; // Дата создания клиента
        this.updatedAt = updatedAt; // Дата обновления клиента
        this.emails = emails.map(email => new ClientEmailDto(email.id, email.client_id, email.email)); // Список email-ов
        this.phones = phones.map(phone => new ClientPhoneDto(phone.id, phone.client_id, phone.phone)); // Список телефонов
    
    }

    balanceNumeric(){
        const balanceStr = this.balance.toString();
        return parseFloat(balanceStr);
    }
    
    balanceFormatted(){
        const balanceStr = this.balance.toString();
        const balanceFloat = parseFloat(balanceStr);
        return balanceFloat.toFixed(2);
    }

    fullName() {
        return this.contactPerson ? `${this.firstName} ${this.lastName} (${this.contactPerson})` : `${this.firstName} ${this.lastName}`;
    }

    icons() {
        var res = '';
        if (this.clientType === 'company') {
            res += '<i class="fas fa-building text-[#3571A4] mr-2" title="Компания"></i>';
        } else {
            res += '<i class="fas fa-user text-[#3571A4] mr-2" title="Индивидульный клиент"></i>';
        }
        if (this.isConflict) {
            res += '<i class="fas fa-exclamation-triangle text-[#D53935] mr-2" title="Проблемный клиент"></i>';
        }
        if (this.isSupplier) {
            res += '<i class="fas fa-truck text-[#3571A4] mr-2" title="Поставщик"></i>';
        }
        return res;
    }

    statusIcon() {
        if (this.status === true || this.status === '1') {
            return '<i class="fas fa-circle-check text-[#5CB85C]" title="Активен"></i>';
        } else {
            return '<i class="fas fa-times text-[#D53935]" title="Неактивен"></i>';
        }
    }

    phonesHtmlList(){
        var res = '<ul>';
        this.phones.forEach(phone => {
            res += `<li>${phone.phone}</li>`;
        });
        res += '</ul>';
        return res;
    }
    emailsHtmlList(){
        var res = '<ul>';
        this.emails.forEach(email => {
            res += `<li>${email.email}</li>`;
        });
        res += '</ul>';
        return res;
    }

    discountFormatted() {
        const discount = this.discount !== undefined ? this.discount : '';
        let discountType = '';
        if (this.discountType !== undefined && this.discountType) {
            if (this.discountType === 'fixed') {
                discountType = 'фиксированная';
            } else if (this.discountType === 'percent') {
                discountType = 'процентная';
            } else {
                discountType = this.discountType;
            }
        }
        return discount + (discountType ? ` (${discountType})` : '');
    }

    formatCreatedAt() {
        return dayjsDateTime(this.createdAt);
    }

    formatUpdatedAt() {
        return dayjsDate(this.updatedAt);
    }
}
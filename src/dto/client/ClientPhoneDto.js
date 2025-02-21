// ClientPhoneDto описывает структуру телефона клиента
export default class ClientPhoneDto {
    constructor(id, clientId, phone) {
        this.id = id; // Идентификатор телефона
        this.clientId = clientId; // Идентификатор клиента
        this.phone = phone; // Номер телефона
    }
}
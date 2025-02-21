// ClientEmailDto описывает структуру email-а клиента
export default class ClientEmailDto {
    constructor(id, clientId, email) {
        this.id = id; // Идентификатор email-а
        this.clientId = clientId; // Идентификатор клиента
        this.email = email; // Email
    }
}
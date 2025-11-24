/**
 * DTO для связи заказа с транзакцией
 * @class OrderTransactionDto
 */
export default class OrderTransactionDto {
  /**
   * Создает экземпляр OrderTransactionDto
   * @param {number} id - ID связи
   * @param {number} orderId - ID заказа
   * @param {number} transactionId - ID транзакции
   * @param {string} createdAt - Дата создания
   * @param {string} updatedAt - Дата обновления
   */
  constructor(
    id,
    orderId,
    transactionId,
    createdAt = "",
    updatedAt = ""
  ) {
    this.id = id;
    this.orderId = orderId;
    this.transactionId = transactionId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Создает экземпляр OrderTransactionDto из данных API
   * @param {Object} data - Объект данных из API
   * @param {number} data.id - ID связи
   * @param {number} data.order_id - ID заказа
   * @param {number} data.transaction_id - ID транзакции
   * @param {string} data.created_at - Дата создания
   * @param {string} data.updated_at - Дата обновления
   * @returns {OrderTransactionDto} Экземпляр OrderTransactionDto
   */
  static fromApi(data) {
    return new OrderTransactionDto(
      data.id,
      data.order_id,
      data.transaction_id,
      data.created_at,
      data.updated_at
    );
  }

  /**
   * Создает массив экземпляров OrderTransactionDto из массива данных API
   * @param {Array} dataArray - Массив объектов связей из API
   * @returns {Array<OrderTransactionDto>} Массив экземпляров OrderTransactionDto
   */
  static fromApiArray(dataArray) {
    if (!Array.isArray(dataArray)) return [];
    return dataArray.map(data => this.fromApi(data));
  }

  /**
   * Преобразует DTO в объект для отправки на API
   * @returns {Object} Объект с полями в формате snake_case
   */
  toApi() {
    return {
      order_id: this.orderId,
      transaction_id: this.transactionId
    };
  }
} 
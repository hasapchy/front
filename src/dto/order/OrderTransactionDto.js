export default class OrderTransactionDto {
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

  static fromApi(data) {
    return new OrderTransactionDto(
      data.id,
      data.order_id,
      data.transaction_id,
      data.created_at,
      data.updated_at
    );
  }

  toApi() {
    return {
      order_id: this.orderId,
      transaction_id: this.transactionId
    };
  }
} 
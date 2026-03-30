import BaseController from "./BaseController";

export default class CommentController extends BaseController {
  static normalizeTimelineItem(item) {
    const meta = item?.meta || null;
    return {
      ...item,
      createdAt: item.created_at,
      meta: meta
        ? {
            ...meta,
            transactionId: meta.transaction_id,
            productPrice: meta.product_price,
            productCurrencySymbol: meta.product_currency_symbol,
            productUnit: meta.product_unit,
          }
        : null,
    };
  }

  static normalizeComment(item) {
    if (!item) return null;
    return {
      ...item,
      createdAt: item.created_at,
    };
  }

  static async storeItem(item) {
    const body = await super.storeItem("/comments", {
      type: item.type,
      id: item.id,
      body: item.body,
    });
    const inner = body.data;
    return {
      message: inner.message,
      comment: this.normalizeComment(inner.comment),
    };
  }

  static async updateItem(id, item) {
    return super.updateItem("/comments", id, { body: item.body || item });
  }

  static async deleteItem(id) {
    return super.deleteItem("/comments", id);
  }

  static async getTimeline(type, id) {
    const data = await super.get("/comments/timeline", {
      params: { type, id },
    });
    return (data || []).map((item) => this.normalizeTimelineItem(item));
  }

  static async create(type, id, body) {
    return this.storeItem({ type, id, body });
  }
}

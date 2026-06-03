import BaseController from "./BaseController";

export default class CommentController extends BaseController {
  static normalizeTimelineItem(item) {
    const meta = item?.meta || null;
    const viewedBy = Array.isArray(item?.viewed_by)
      ? item.viewed_by.map((row) => ({
          ...row,
          viewedAt: row?.viewed_at,
        }))
      : [];
    return {
      ...item,
      createdAt: item.created_at,
      viewedBy,
      descriptionKey: item.description_key,
      descriptionParams: item.description_params || {},
      descriptionFallback: item.description_fallback,
      logName: item.log_name,
      meta: meta
        ? {
            ...meta,
            transactionId: meta.transaction_id,
            currencyCode: meta.currency_symbol,
            productPrice: meta.product_price,
            productCurrencyCode: meta.product_currency_symbol,
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

  static normalizeTimelinePage(body) {
    const page = body?.data ?? body ?? {};
    const items = Array.isArray(page.items) ? page.items : [];
    return {
      items: items.map((item) => this.normalizeTimelineItem(item)),
      nextCursor: page.next_cursor ?? null,
      hasMore: Boolean(page.has_more),
    };
  }

  static async storeItem(item) {
    const body = await super.storeItem("/comments", {
      type: item.type,
      id: item.id,
      body: item.body,
    });
    const inner = body.data;
    const timelineItem = inner.timeline_item
      ? this.normalizeTimelineItem(inner.timeline_item)
      : null;
    return {
      message: inner.message,
      comment: this.normalizeComment(inner.comment),
      timelineItem,
    };
  }

  static async updateItem(id, item) {
    return super.updateItem("/comments", id, { body: item.body || item });
  }

  static async deleteItem(id) {
    return super.deleteItem("/comments", id);
  }

  static async getTimelinePage(type, id, { limit = 50, cursor = null } = {}) {
    const params = { type, id, limit };
    if (cursor) {
      params.cursor = cursor;
    }
    const body = await super.get("/comments/timeline", { params });
    return this.normalizeTimelinePage(body);
  }

  static async getTimeline(type, id) {
    const page = await this.getTimelinePage(type, id);
    return page.items;
  }

  static async create(type, id, body) {
    return this.storeItem({ type, id, body });
  }

  static async getTimelineUnreadCounts(type, ids) {
    const body = await super.post("/comments/timeline/unread-counts", {
      type,
      ids,
    });
    return body?.data?.counts || {};
  }

  static async markTimelineRead(type, id) {
    const body = await super.post("/comments/timeline/read", { type, id });
    return body?.data || {};
  }
}

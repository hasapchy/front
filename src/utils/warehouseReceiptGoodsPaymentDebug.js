const LOG_PREFIX = '[wh-receipt-goods-payment]';

/**
 * @param {string} step
 * @param {Record<string, unknown>} payload
 */
export function logWhReceiptGoodsPayment(step, payload = {}) {
  if (typeof console === 'undefined' || !console.info) {
    return;
  }
  console.info(LOG_PREFIX, step, payload);
}

const LOG_PREFIX = '[wh-purchase-transactions]';

/**
 * @param {string} step
 * @param {Record<string, unknown>} payload
 */
export function logWarehousePurchaseTransactions(step, payload = {}) {
    if (typeof console === 'undefined' || !console.info) {
        return;
    }
    console.info(LOG_PREFIX, step, payload);
}

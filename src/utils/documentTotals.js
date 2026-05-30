/**
 * Итог документа со строками — только с API (заказ, оприходование, закупка).
 * Договор: одно поле amount, округление при вводе (FormattedDecimalInput, scope contract).
 *
 * @typedef {'order'|'warehouse'} DocumentTotalsKind
 */

/** @type {Record<DocumentTotalsKind, { total: string[], subtotal?: string[], products?: string }>} */
const FIELDS = {
  order: {
    total: ['totalPrice', 'total_price'],
    subtotal: ['price'],
    products: 'products',
  },
  warehouse: {
    total: ['origAmount', 'orig_amount'],
    products: 'products',
  },
};

/**
 * @param {Record<string, unknown>} item
 * @param {string[]} keys
 * @returns {number|null}
 */
function pickNumeric(item, keys) {
  if (!item) {
    return null;
  }
  for (const key of keys) {
    const n = Number(item[key]);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return null;
}

/**
 * @param {Record<string, unknown>} item
 * @param {DocumentTotalsKind} kind
 * @returns {number|null}
 */
export function parseDocumentTotalPrice(item, kind) {
  return pickNumeric(item, FIELDS[kind].total);
}

/**
 * @param {Record<string, unknown>} item
 * @param {DocumentTotalsKind} kind
 * @returns {number|null}
 */
export function parseDocumentSubtotalPrice(item, kind) {
  return pickNumeric(item, FIELDS[kind].subtotal || []);
}

/**
 * @param {Record<string, unknown>} item
 * @param {DocumentTotalsKind} kind
 * @returns {Array<unknown>|null}
 */
export function parseDocumentProducts(item, kind) {
  if (!item) {
    return null;
  }
  const products = item[FIELDS[kind].products];
  return Array.isArray(products) && products.length ? products : null;
}

/**
 * @param {Record<string, unknown>} item
 * @param {DocumentTotalsKind} kind
 * @returns {{ documentTotalPrice: number|null, documentSubtotalPrice: number|null, products: Array<unknown>|null }}
 */
export function applyDocumentFromApiResponse(item, kind) {
  return {
    documentTotalPrice: parseDocumentTotalPrice(item, kind),
    documentSubtotalPrice: parseDocumentSubtotalPrice(item, kind),
    products: parseDocumentProducts(item, kind),
  };
}

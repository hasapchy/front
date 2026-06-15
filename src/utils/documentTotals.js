import OrderDto from '@/dto/order/OrderDto';

/**
 * Итог документа со строками — только с API (заказ, оприходование, закупка).
 * Договор: одно поле amount, округление при вводе (FormattedDecimalInput, scope contract).
 *
 * @typedef {'order'|'warehouse'} DocumentTotalsKind
 */

/**
 * @param {unknown} item
 * @returns {OrderDto|null}
 */
function asOrderDto(item) {
  if (!item) {
    return null;
  }
  if (item instanceof OrderDto) {
    return item;
  }
  return OrderDto.fromApi(item);
}

/**
 * @param {Record<string, unknown>|OrderDto|null} item
 * @param {DocumentTotalsKind} kind
 * @returns {number|null}
 */
export function parseDocumentTotalPrice(item, kind) {
  if (!item) {
    return null;
  }
  if (kind === 'order') {
    const order = asOrderDto(item);
    if (!order || order.totalPrice == null) {
      return null;
    }
    const n = Number(order.totalPrice);
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(item.origAmount);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {Record<string, unknown>|OrderDto|null} item
 * @param {DocumentTotalsKind} kind
 * @returns {number|null}
 */
export function parseDocumentSubtotalPrice(item, kind) {
  if (kind !== 'order' || !item) {
    return null;
  }
  const order = asOrderDto(item);
  if (!order || order.price == null) {
    return null;
  }
  const n = Number(order.price);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {Record<string, unknown>|OrderDto|null} item
 * @param {DocumentTotalsKind} kind
 * @returns {number|null}
 */
export function parseDocumentDefTotalPrice(item, kind) {
  if (kind !== 'order' || !item) {
    return null;
  }
  const order = asOrderDto(item);
  if (!order || order.defTotalPrice == null) {
    return null;
  }
  const n = Number(order.defTotalPrice);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {Record<string, unknown>|OrderDto|null} item
 * @param {DocumentTotalsKind} kind
 * @returns {{ documentTotalPrice: number|null, documentSubtotalPrice: number|null, documentDefTotalPrice: number|null }}
 */
export function applyDocumentFromApiResponse(item, kind) {
  return {
    documentTotalPrice: parseDocumentTotalPrice(item, kind),
    documentSubtotalPrice: parseDocumentSubtotalPrice(item, kind),
    documentDefTotalPrice: parseDocumentDefTotalPrice(item, kind),
  };
}

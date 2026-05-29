import { getClientDisplayName, getClientDisplayPosition } from '@/utils/displayUtils';

/**
 * @param {Array} orders
 * @param {string} query
 * @returns {Array}
 */
export function filterOrdersByQuery(orders, query) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) {
    return orders;
  }
  return orders.filter((order) => {
    const idMatch = String(order?.id ?? '').includes(normalizedQuery);
    const clientName = String(getClientDisplayName(order?.client) || '').toLowerCase();
    const position = String(getClientDisplayPosition(order?.client) || '').toLowerCase();
    const statusName = String(order?.statusName || '').toLowerCase();
    return (
      idMatch
      || clientName.includes(normalizedQuery)
      || position.includes(normalizedQuery)
      || statusName.includes(normalizedQuery)
    );
  });
}

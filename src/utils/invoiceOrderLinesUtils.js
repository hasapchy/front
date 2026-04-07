export function sortedOrderIdsKey(orders) {
  return (orders || [])
    .map((o) => o.id)
    .filter(Boolean)
    .slice()
    .sort((x, y) => Number(x) - Number(y))
    .join(',');
}

export function invoiceLineExcludeKey({ orderId, productId, productName, quantity, price, totalPrice }) {
  return JSON.stringify({
    o: orderId,
    p: productId,
    n: productName ?? '',
    q: quantity,
    pr: price,
    t: totalPrice
  });
}

export function parseInvoiceOrdersApiRow(row) {
  const productId = row.product_id ?? row.productId ?? null;
  const orderId = row.order_id ?? row.orderId;
  const productName = row.product_name ?? row.productName ?? '';
  const quantity = parseFloat(row.quantity ?? 0);
  const price = parseFloat(row.price ?? 0);
  const totalRaw = row.total_price ?? row.totalPrice;
  const totalPrice = parseFloat(
    totalRaw != null && totalRaw !== '' ? totalRaw : quantity * price
  );
  const unitId = row.unit_id ?? row.unitId ?? null;
  const productDescription = row.product_description ?? row.productDescription ?? null;
  return {
    productId,
    orderId,
    productName,
    quantity,
    price,
    totalPrice,
    unitId,
    productDescription
  };
}

export function createOrderSearchLineFromApiRow(row, index) {
  const p = parseInvoiceOrdersApiRow(row);
  const excludeKey = invoiceLineExcludeKey({
    orderId: p.orderId,
    productId: p.productId,
    productName: p.productName,
    quantity: p.quantity,
    price: p.price,
    totalPrice: p.totalPrice
  });
  return {
    id: `inv-line-${p.orderId}-${index}`,
    excludeKey,
    ...p,
    name: p.productName,
    unitName: null,
    type: p.productId ? 1 : null,
    productImage: null,
    imgUrl() {
      return null;
    },
    icons() {
      return p.productId
        ? '<i class="fas fa-box text-[#3571A4]"></i>'
        : '<i class="fas fa-concierge-bell text-[#3571A4]"></i>';
    }
  };
}

export function invoiceLineExcludeKeyFromLine(line) {
  const quantity = parseFloat(line.quantity ?? 0);
  const price = parseFloat(line.price ?? 0);
  const totalFallback = quantity * price;
  const totalPrice = parseFloat(
    line.totalPrice != null && line.totalPrice !== '' ? line.totalPrice : totalFallback
  );
  return invoiceLineExcludeKey({
    orderId: line.orderId,
    productId: line.productId,
    productName: line.productName ?? line.name ?? '',
    quantity,
    price,
    totalPrice: Number.isNaN(totalPrice) ? 0 : totalPrice
  });
}

export function sumInvoiceLineTotals(lines) {
  return lines.reduce((sum, p) => {
    const line = Number(p.totalPrice);
    if (!Number.isNaN(line)) {
      return sum + line;
    }
    return sum + (Number(p.price) || 0) * (Number(p.quantity) || 0);
  }, 0);
}

export function createPdfLineFromApiRow(row, getUnitShortName) {
  const p = parseInvoiceOrdersApiRow(row);
  return {
    productId: p.productId,
    productName: p.productName,
    productDescription: p.productDescription,
    quantity: p.quantity,
    price: p.price,
    totalPrice: p.totalPrice,
    unitId: p.unitId,
    unitName: null,
    getUnitName() {
      if (this.unitName) {
        return this.unitName;
      }
      if (this.unitId && getUnitShortName) {
        return getUnitShortName(this.unitId) || 'шт.';
      }
      return 'шт.';
    }
  };
}

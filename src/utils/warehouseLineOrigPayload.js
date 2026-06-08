export function lineOrigSavePayload(product) {
  const ou = product.origUnitId ?? product.alternateInputUnitId;
  const oq = product.origQuantity;
  if (ou == null || ou === '' || oq == null || oq === '') {
    return {};
  }
  return { origUnitId: Number(ou), origQuantity: Number(oq) };
}

export function warehouseLinePriceForSave(product) {
  const quantity = Number(product.quantity) || 0;
  const price = Number(product.price) || 0;
  if (quantity <= 0) {
    return price;
  }
  const amount = product.amount;
  if (amount !== null && amount !== undefined && amount !== '') {
    return (Number(amount) || 0) / quantity;
  }
  return price;
}

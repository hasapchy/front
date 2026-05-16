export function lineOrigSavePayload(product) {
  const ou = product.origUnitId;
  const oq = product.origQuantity;
  if (ou == null || ou === '' || oq == null || oq === '') {
    return {};
  }
  return { origUnitId: Number(ou), origQuantity: Number(oq) };
}

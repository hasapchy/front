export function mapWarehouseLineUnitPresentation(line) {
  const stockRaw = line?.stock_by_units ?? line?.stockByUnits ?? [];
  const altRaw = line?.alternate_unit_options ?? line?.alternateUnitOptions ?? [];
  const stockByUnits = Array.isArray(stockRaw)
    ? stockRaw.map((r) => ({
        unit_id: r.unit_id,
        short_name: r.short_name,
        quantity: r.quantity,
        to_base_factor: r.to_base_factor,
      }))
    : [];
  const alternateUnitOptions = Array.isArray(altRaw)
    ? altRaw.map((r) => ({
        unit_id: r.unit_id,
        short_name: r.short_name,
        quantity: r.quantity,
        to_base_factor: r.to_base_factor,
      }))
    : [];
  return { stockByUnits, alternateUnitOptions };
}

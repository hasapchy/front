export function logRoundingGetter(name, value, state) {
  console.log(`[Store] ${name}:`, {
    companyId: state.currentCompany?.id,
    companyName: state.currentCompany?.name,
    value,
  });
}

export function logCompanyRoundingSettings(company) {
  if (!company) {
    return;
  }
  const payload = {
    companyId: company.id,
    name: company.name,
    amounts: {
      enabled: company.rounding_enabled,
      decimals: company.rounding_decimals,
      direction: company.rounding_direction,
      customThreshold: company.rounding_custom_threshold,
    },
    quantity: {
      enabled: company.rounding_quantity_enabled,
      decimals: company.rounding_quantity_decimals,
      direction: company.rounding_quantity_direction,
      customThreshold: company.rounding_quantity_custom_threshold,
    },
  };
  console.log("[Company] Rounding settings:", payload);
}


export const DEFAULT_AMOUNT_ROUNDING_SCOPE = 'transaction';

export const CLIENT_BALANCE_MODULE = 'transaction';

export const PROJECT_BALANCE_MODULE = 'contract';

export const ROUNDING_MODULES = [
  {
    key: 'order',
    enabledFormKey: 'roundingOrdersEnabled',
    decimalsFormKey: 'roundingOrdersDecimals',
    enabledApiKey: 'rounding_orders_enabled',
    decimalsApiKey: 'rounding_orders_decimals',
    labelKey: 'roundingOrdersEnabled',
    amountRoundingScope: 'order',
  },
  {
    key: 'contract',
    enabledFormKey: 'roundingContractsEnabled',
    decimalsFormKey: 'roundingContractsDecimals',
    enabledApiKey: 'rounding_contracts_enabled',
    decimalsApiKey: 'rounding_contracts_decimals',
    labelKey: 'roundingContractsEnabled',
    amountRoundingScope: 'contract',
  },
  {
    key: 'warehouse',
    enabledFormKey: 'roundingWarehouseEnabled',
    decimalsFormKey: 'roundingWarehouseDecimals',
    enabledApiKey: 'rounding_warehouse_enabled',
    decimalsApiKey: 'rounding_warehouse_decimals',
    labelKey: 'roundingWarehouseEnabled',
    amountRoundingScope: 'warehouse',
  },
  {
    key: 'transaction',
    enabledFormKey: 'roundingTransactionsEnabled',
    decimalsFormKey: 'roundingTransactionsDecimals',
    enabledApiKey: 'rounding_transactions_enabled',
    decimalsApiKey: 'rounding_transactions_decimals',
    labelKey: 'roundingTransactionsEnabled',
    amountRoundingScope: 'transaction',
  },
];

export const AMOUNT_ROUNDING_SCOPES = ROUNDING_MODULES.map((mod) => mod.amountRoundingScope);

/**
 * @param {typeof ROUNDING_MODULES} modules
 * @returns {Record<string, (state: object) => unknown>}
 */
export function buildRoundingEnabledGetters(modules = ROUNDING_MODULES) {
  const getters = {};

  for (const mod of modules) {
    getters[mod.enabledFormKey] = (state) => {
      const company = state.currentCompany;
      if (!company?.roundingEnabled) {
        return false;
      }
      return Boolean(company[mod.enabledFormKey]);
    };
  }

  return getters;
}

/**
 * @param {typeof ROUNDING_MODULES} modules
 * @returns {Record<string, (state: object) => unknown>}
 */
export function buildRoundingDecimalsGetters(modules = ROUNDING_MODULES) {
  const getters = {};

  for (const mod of modules) {
    getters[mod.decimalsFormKey] = (state) => state.currentCompany[mod.decimalsFormKey];
  }

  return getters;
}

/**
 * @param {string} scope
 * @returns {typeof ROUNDING_MODULES[number]|null}
 */
export function findRoundingModuleByScope(scope) {
  return ROUNDING_MODULES.find((mod) => mod.amountRoundingScope === scope) ?? null;
}

/**
 * @returns {Record<string, number|boolean>}
 */
export function defaultRoundingModuleFormValues() {
  const values = {};
  for (const mod of ROUNDING_MODULES) {
    values[mod.decimalsFormKey] = 2;
    if (mod.key === 'order' || mod.key === 'warehouse' || mod.key === 'transaction') {
      values[mod.enabledFormKey] = true;
    } else {
      values[mod.enabledFormKey] = false;
    }
  }
  return values;
}

/**
 * @param {Record<string, unknown>} company
 * @returns {Record<string, number|boolean>}
 */
export function roundingModuleValuesFromCompany(company) {
  const values = {};
  for (const mod of ROUNDING_MODULES) {
    values[mod.enabledFormKey] = Boolean(company[mod.enabledFormKey]);
    values[mod.decimalsFormKey] = company[mod.decimalsFormKey] ?? 2;
  }
  return values;
}

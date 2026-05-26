import { normalizeBalanceId } from '@/utils/documentPaymentBalanceUtils';

export function filterCashRegistersByClientBalance(balance, cashRegisters) {
    if (!balance || !cashRegisters?.length) {
        return [];
    }
    const isCash = Number(balance.type) === 1;
    const curId = balance.currencyId ?? balance.currency_id ?? balance.currency?.id ?? null;
    let list = cashRegisters.filter((cash) => cash.isCash === isCash);
    if (curId != null && curId !== '') {
        list = list.filter((c) => Number(c.currencyId) === Number(curId));
    }
    return list;
}

export function getTransactionBalancesList(selectedClient, clientBalancesProp = []) {
    if (Array.isArray(selectedClient?.balances) && selectedClient.balances.length) {
        return selectedClient.balances;
    }
    return Array.isArray(clientBalancesProp) ? clientBalancesProp : [];
}

export function findBalanceById(balances, balanceId) {
    if (balanceId == null || balanceId === '' || !Array.isArray(balances)) {
        return null;
    }
    return balances.find((b) => Number(b.id) === Number(balanceId)) ?? null;
}

export function isClientBalanceSelected(editingItemId, selectedBalanceRecord) {
    if (editingItemId) {
        return false;
    }
    return selectedBalanceRecord != null;
}

export function isCashSelectDisabled(clientBalanceSelected, filteredCashRegisters) {
    return Boolean(
        clientBalanceSelected && (filteredCashRegisters?.length ?? 0) <= 1
    );
}

export function resolveCashRegistersForForm({
    clientBalanceSelected,
    selectedBalanceRecord,
    allCashRegisters = [],
    paymentTypeFieldVisible = false,
    paymentType,
}) {
    if (clientBalanceSelected) {
        if (!selectedBalanceRecord) {
            return [];
        }
        return filterCashRegistersByClientBalance(selectedBalanceRecord, allCashRegisters);
    }
    if (!paymentTypeFieldVisible || paymentType === undefined || paymentType === null) {
        return allCashRegisters;
    }
    const paymentTypeIsCash = paymentType === 1;
    return allCashRegisters.filter((c) => c.isCash === paymentTypeIsCash);
}

export function resolveCashIdForBalance({ balance, allCashRegisters = [], currentCashId }) {
    const strictList = filterCashRegistersByClientBalance(balance, allCashRegisters);
    const currentInList = strictList.some((c) => Number(c.id) === Number(currentCashId));
    if (strictList.length === 0) {
        return '';
    }
    if (strictList.length === 1) {
        return strictList[0].id;
    }
    if (!currentInList) {
        return strictList[0].id;
    }
    return currentCashId;
}

export function buildBalanceDefaultsPatch({
    balanceId,
    balances,
    allCashRegisters = [],
    currentCashId,
    includePaymentType = true,
}) {
    const balance = findBalanceById(balances, balanceId);
    if (!balance) {
        return null;
    }
    const patch = {};
    if (includePaymentType) {
        patch.paymentType = Number(balance.type) === 0 ? 0 : 1;
    }
    const nextCurrencyId = balance.currencyId ?? balance.currency_id ?? balance.currency?.id ?? null;
    if (nextCurrencyId != null) {
        patch.currencyId = Number(nextCurrencyId);
    }
    patch.cashId = resolveCashIdForBalance({
        balance,
        allCashRegisters,
        currentCashId,
    });
    return patch;
}

/**
 * Балансы клиента для форм (транзакции, контракты) — только GET clients/{id}, как ClientSearch.
 *
 * @param {number|string|null|undefined} clientId
 * @param {object|null|undefined} [client]
 * @returns {Promise<Array>}
 */
export async function loadClientBalancesForForm(clientId, client = null) {
    if (clientId == null || clientId === '') {
        return [];
    }
    const fromClient = client?.balances;
    if (Array.isArray(fromClient) && fromClient.length > 0) {
        return [...fromClient];
    }
    const { default: ClientController } = await import('@/api/ClientController');
    try {
        const loaded = await ClientController.getItem(clientId);
        return Array.isArray(loaded?.balances) ? [...loaded.balances] : [];
    } catch {
        return [];
    }
}

/**
 * Полный список балансов через GET clients/{id}/balances (вкладка балансов, админ).
 *
 * @param {number|string|null|undefined} clientId
 * @param {object|null|undefined} [client]
 * @returns {Promise<Array>}
 */
export async function loadClientBalancesDedicated(clientId, client = null) {
    const fromForm = await loadClientBalancesForForm(clientId, client);
    if (fromForm.length > 0) {
        return fromForm;
    }
    const { default: ClientController } = await import('@/api/ClientController');
    try {
        const rows = await ClientController.getClientBalances(clientId);
        return Array.isArray(rows) ? rows : [];
    } catch {
        return [];
    }
}

/**
 * @param {number|string|null|undefined} clientId
 * @param {{ client?: object|null, canFetchDedicatedBalances?: boolean }} [options]
 * @returns {Promise<Array>}
 */
export async function fetchClientBalancesForClientId(clientId, options = {}) {
    const client = options.client ?? null;
    if (options.canFetchDedicatedBalances === true) {
        return loadClientBalancesDedicated(clientId, client);
    }
    return loadClientBalancesForForm(clientId, client);
}

export function applyBalanceDefaultsPatchToVm(vm, patch, fieldMap = {}) {
    if (!patch) {
        return;
    }
    const paymentTypeKey = fieldMap.paymentType === false ? false : (fieldMap.paymentType ?? 'paymentType');
    const currencyIdKey = fieldMap.currencyId ?? 'currencyId';
    const cashIdKey = fieldMap.cashId ?? 'cashId';
    if (patch.paymentType !== undefined && paymentTypeKey !== false) {
        const hasPaymentType = Object.hasOwn(vm, paymentTypeKey)
            || (vm.$data != null && Object.hasOwn(vm.$data, paymentTypeKey));
        if (hasPaymentType) {
            vm[paymentTypeKey] = patch.paymentType;
        }
    }
    if (patch.currencyId !== undefined) {
        vm[currencyIdKey] = patch.currencyId;
    }
    if (patch.cashId !== undefined) {
        vm[cashIdKey] = patch.cashId;
    }
}

/**
 * Список клиентов в store часто без balances; не затираем уже загруженные строки балансов.
 *
 * @param {object|null|undefined} incoming
 * @param {object|null|undefined} previous
 * @returns {object|null|undefined}
 */
/**
 * @param {object|null|undefined} client
 * @param {Array} balanceRows
 * @returns {object|null|undefined}
 */
export function attachDocumentBalancesToClient(client, balanceRows) {
    if (!client?.id || !Array.isArray(balanceRows) || !balanceRows.length) {
        return client;
    }
    if (Array.isArray(client.balances) && client.balances.length > 0) {
        return client;
    }
    return { ...client, balances: balanceRows };
}

/**
 * @param {Array} rows
 * @param {{ explicitBalanceId?: number|string|null, preferCurrencyId?: number|string|null }} options
 * @returns {number|null}
 */
export function resolveInitialClientBalanceId(rows, options = {}) {
    if (!Array.isArray(rows) || rows.length === 0) {
        return null;
    }

    const explicitId = normalizeBalanceId(options.explicitBalanceId);
    if (explicitId != null && rows.some((b) => Number(b.id) === explicitId)) {
        return explicitId;
    }

    const preferCurrencyId = options.preferCurrencyId;
    let candidates = rows;
    if (preferCurrencyId != null && preferCurrencyId !== '') {
        const byCurrency = rows.filter((b) => {
            const cid = b.currencyId ?? b.currency_id ?? b.currency?.id;
            return Number(cid) === Number(preferCurrencyId);
        });
        if (byCurrency.length > 0) {
            candidates = byCurrency;
        }
    }

    const firstNonZeroIn = (list) => list.find((b) => Number(b.balance) !== 0) ?? null;
    if (!firstNonZeroIn(candidates)) {
        const nonZeroAny = firstNonZeroIn(rows);
        if (nonZeroAny?.id != null) {
            return Number(nonZeroAny.id);
        }
    }

    if (candidates.length === 1) {
        return Number(candidates[0].id);
    }

    const defaultRow = candidates.find((b) => b.isDefault)
        || rows.find((b) => b.isDefault)
        || candidates[0];
    if (defaultRow && Number(defaultRow.balance) === 0) {
        const nonZero = candidates.find((b) => Number(b.balance) !== 0);
        if (nonZero) {
            return Number(nonZero.id);
        }
    }

    if (defaultRow?.id != null) {
        return Number(defaultRow.id);
    }

    return candidates[0]?.id != null ? Number(candidates[0].id) : null;
}

/**
 * @param {Array} incoming
 * @param {Array} previous
 * @returns {Array}
 */
export function mergeClientBalancesList(incoming = [], previous = []) {
    const inc = Array.isArray(incoming) ? incoming : [];
    const prev = Array.isArray(previous) ? previous : [];
    if (!prev.length) {
        return [...inc];
    }
    if (!inc.length) {
        return [...prev];
    }
    const byId = new Map(prev.map((row) => [Number(row.id), { ...row }]));
    for (const row of inc) {
        const id = Number(row.id);
        if (!Number.isFinite(id)) {
            continue;
        }
        const existing = byId.get(id);
        byId.set(id, existing ? { ...existing, ...row } : { ...row });
    }
    return Array.from(byId.values());
}

/**
 * @param {object|null|undefined} incoming
 * @param {object|null|undefined} previous
 * @returns {object|null|undefined}
 */
export function mergeClientPreservingBalances(incoming, previous) {
    if (!incoming) {
        return incoming;
    }
    if (!previous || Number(incoming.id) !== Number(previous.id)) {
        return incoming;
    }
    const mergedBalances = mergeClientBalancesList(
        incoming.balances || [],
        previous.balances || [],
    );
    if (mergedBalances.length > 0) {
        incoming.balances = mergedBalances;
    } else if (Array.isArray(previous.balances) && previous.balances.length > 0) {
        incoming.balances = previous.balances;
    }
    return incoming;
}

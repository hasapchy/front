/**
 * @param {number|string|null|undefined} balanceId
 * @returns {number|null}
 */
export function normalizeBalanceId(balanceId) {
    if (balanceId == null || balanceId === '') {
        return null;
    }
    const n = Number(balanceId);
    return Number.isNaN(n) ? null : n;
}

/**
 * Список балансов для формы оплаты по документу.
 * Если у документа задан balanceId — только он; иначе все балансы (первый — дефолтный/предпочтительный).
 *
 * @param {Array} allBalances
 * @param {number|string|null} documentBalanceId
 */
export function balancesForDocumentPayment(allBalances, documentBalanceId) {
    if (!Array.isArray(allBalances) || allBalances.length === 0) {
        return [];
    }
    const docId = normalizeBalanceId(documentBalanceId);
    if (docId == null) {
        return sortBalancesPreferDefault(allBalances);
    }
    const matched = allBalances.find((b) => Number(b.id) === docId);
    return matched ? [matched] : [];
}

/**
 * @param {Array} balances
 * @param {{ documentBalanceId?: number|string|null, contractBalanceId?: number|string|null, pickContractBalance?: (contract: object, balances: Array) => number|null }} options
 * @returns {number|null}
 */
export function resolveTransactionPrefillBalanceId(balances, options = {}) {
    if (!Array.isArray(balances) || balances.length === 0) {
        return null;
    }

    const docId = normalizeBalanceId(options.documentBalanceId);
    if (docId != null && balances.some((b) => Number(b.id) === docId)) {
        return docId;
    }

    const contractId = normalizeBalanceId(options.contractBalanceId);
    if (contractId != null && balances.some((b) => Number(b.id) === contractId)) {
        return contractId;
    }

    if (typeof options.pickContractBalance === 'function') {
        const fromContract = options.pickContractBalance(options.contract, balances);
        const normalized = normalizeBalanceId(fromContract);
        if (normalized != null) {
            return normalized;
        }
    }

    const defaultBalance = balances.find((b) => b.isDefault);
    return defaultBalance ? Number(defaultBalance.id) : Number(balances[0].id);
}

/**
 * @param {number|string|null} documentBalanceId
 * @param {Array} paymentBalances
 */
export function isDocumentPaymentBalanceLocked(documentBalanceId, paymentBalances) {
    const docId = normalizeBalanceId(documentBalanceId);
    if (docId == null) {
        return false;
    }
    return Array.isArray(paymentBalances)
        && paymentBalances.some((b) => Number(b.id) === docId);
}

/**
 * @param {boolean} isDocumentPayment
 * @param {number|string|null} documentBalanceId
 * @param {number|string|null} selectedBalanceId
 * @param {{ clientExcludedFromRequest?: boolean, submitClientBalanceIdOption?: boolean }} formOptions
 */
export function shouldSubmitClientBalanceIdForTransaction(
    isDocumentPayment,
    documentBalanceId,
    selectedBalanceId,
    formOptions = {},
) {
    if (normalizeBalanceId(selectedBalanceId) == null) {
        return false;
    }
    if (isDocumentPayment && normalizeBalanceId(documentBalanceId) != null) {
        return true;
    }
    if (!formOptions.clientExcludedFromRequest) {
        return true;
    }
    return formOptions.submitClientBalanceIdOption === true;
}

function sortBalancesPreferDefault(balances) {
    const rows = [...balances];
    const idxDef = rows.findIndex((b) => b.isDefault);
    if (idxDef > 0) {
        const [row] = rows.splice(idxDef, 1);
        rows.unshift(row);
    }
    return rows;
}

/**
 * У документа задан баланс, но его нет среди балансов клиента в форме оплаты.
 *
 * @param {number|string|null} documentBalanceId
 * @param {Array} paymentBalances
 */
export function isDocumentBalanceMismatch(documentBalanceId, paymentBalances) {
    const docId = normalizeBalanceId(documentBalanceId);
    if (docId == null) {
        return false;
    }
    if (!Array.isArray(paymentBalances) || paymentBalances.length === 0) {
        return true;
    }
    return !paymentBalances.some((b) => Number(b.id) === docId);
}

/**
 * Нужно явно выбрать баланс при оплате по документу без client_balance_id на документе.
 *
 * @param {boolean} isDocumentPayment
 * @param {number|string|null} documentBalanceId
 * @param {{ warehouseReceiptGoodsPayment?: boolean }} formOptions
 */
export function requiresDocumentBalanceSelection(isDocumentPayment, documentBalanceId, formOptions = {}) {
    if (!isDocumentPayment) {
        return false;
    }
    if (normalizeBalanceId(documentBalanceId) != null) {
        return false;
    }
    if (formOptions.warehouseReceiptId && !formOptions.warehouseReceiptGoodsPayment) {
        return false;
    }
    return true;
}

/**
 * @returns {string|null} i18n key ошибки или null
 */
export function validateDocumentPaymentBeforeSave({
    isDocumentPayment,
    documentBalanceId,
    paymentBalances,
    selectedBalanceId,
    formOptions = {},
}) {
    if (!isDocumentPayment) {
        return null;
    }
    if (isDocumentBalanceMismatch(documentBalanceId, paymentBalances)) {
        return 'documentBalanceNotFoundAtClient';
    }
    const docId = normalizeBalanceId(documentBalanceId);
    const selectedId = normalizeBalanceId(selectedBalanceId);
    const enforceDocumentBalanceMatch = !(
        formOptions.warehouseReceiptId && !formOptions.warehouseReceiptGoodsPayment
    );
    if (enforceDocumentBalanceMatch && docId != null && selectedId != null && docId !== selectedId) {
        return 'documentPaymentBalanceMustMatch';
    }
    if (
        requiresDocumentBalanceSelection(isDocumentPayment, documentBalanceId, formOptions)
        && selectedId == null
    ) {
        return 'documentPaymentBalanceRequired';
    }
    return null;
}

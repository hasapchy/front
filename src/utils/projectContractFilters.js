/**
 * @param {object} item
 * @param {object} filters
 * @returns {boolean}
 */
export function matchesProjectContractFilters(item, filters) {
    if (!item) {
        return false;
    }

    const {
        lifecycleStatusFilter = '',
        contractStatusFilter = '',
        paymentStatusFilter = '',
        typeFilter = '',
        cashRegisterFilter = '',
    } = filters;

    if (lifecycleStatusFilter && (item.status ?? 'draft') !== lifecycleStatusFilter) {
        return false;
    }

    if (contractStatusFilter === '0' || contractStatusFilter === '1') {
        const returned = Boolean(item.returned);
        if (contractStatusFilter === '1' && !returned) {
            return false;
        }
        if (contractStatusFilter === '0' && returned) {
            return false;
        }
    }

    if (paymentStatusFilter) {
        const paymentStatus = resolveContractPaymentStatus(item);
        if (paymentStatus !== paymentStatusFilter) {
            return false;
        }
    }

    if (typeFilter !== '' && typeFilter !== null && typeFilter !== undefined) {
        if (Number(item.type) !== Number(typeFilter)) {
            return false;
        }
    }

    if (cashRegisterFilter && Number(item.cashId) !== Number(cashRegisterFilter)) {
        return false;
    }

    return true;
}

/**
 * @param {object} item
 * @returns {string}
 */
function resolveContractPaymentStatus(item) {
    if (item.status === 'draft' || item.paymentStatus === 'draft') {
        return 'draft';
    }
    if (item.paymentStatus) {
        return item.paymentStatus;
    }
    const paid = (item.paidAmount ?? 0) >= (item.amount ?? 0);
    if (paid) {
        return 'paid';
    }
    if ((item.paidAmount ?? 0) > 0) {
        return 'partially_paid';
    }
    return 'unpaid';
}

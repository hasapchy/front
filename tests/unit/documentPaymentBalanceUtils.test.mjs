import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    balancesForDocumentPayment,
    isDocumentBalanceMismatch,
    isDocumentPaymentBalanceLocked,
    normalizeBalanceId,
    requiresDocumentBalanceSelection,
    resolveTransactionPrefillBalanceId,
    shouldSubmitClientBalanceIdForTransaction,
    validateDocumentPaymentBeforeSave,
} from '../../src/utils/documentPaymentBalanceUtils.js';

const balances = [
    { id: 1, isDefault: false, currencyId: 1 },
    { id: 2, isDefault: true, currencyId: 2 },
    { id: 3, isDefault: false, currencyId: 1 },
];

describe('normalizeBalanceId', () => {
    it('returns null for empty values', () => {
        assert.equal(normalizeBalanceId(null), null);
        assert.equal(normalizeBalanceId(''), null);
        assert.equal(normalizeBalanceId(undefined), null);
    });

    it('returns numeric id', () => {
        assert.equal(normalizeBalanceId('5'), 5);
        assert.equal(normalizeBalanceId(5), 5);
    });

    it('returns null for invalid number', () => {
        assert.equal(normalizeBalanceId('abc'), null);
    });
});

describe('balancesForDocumentPayment', () => {
    it('returns all balances sorted with default first when document balance unset', () => {
        const list = balancesForDocumentPayment(balances, null);
        assert.equal(list.length, 3);
        assert.equal(list[0].id, 2);
    });

    it('returns single matching balance when document balance set', () => {
        const list = balancesForDocumentPayment(balances, 1);
        assert.equal(list.length, 1);
        assert.equal(list[0].id, 1);
    });

    it('returns empty when document balance not found on client', () => {
        assert.deepEqual(balancesForDocumentPayment(balances, 99), []);
    });

    it('returns empty for empty input', () => {
        assert.deepEqual(balancesForDocumentPayment([], 1), []);
    });
});

describe('resolveTransactionPrefillBalanceId', () => {
    it('prefers document balance over default', () => {
        assert.equal(resolveTransactionPrefillBalanceId(balances, { documentBalanceId: 1 }), 1);
    });

    it('uses contractBalanceId when document balance absent', () => {
        assert.equal(
            resolveTransactionPrefillBalanceId(balances, { contractBalanceId: 3 }),
            3,
        );
    });

    it('uses pickContractBalance callback', () => {
        const id = resolveTransactionPrefillBalanceId(balances, {
            pickContractBalance: () => 3,
        });
        assert.equal(id, 3);
    });

    it('falls back to default balance then first', () => {
        assert.equal(resolveTransactionPrefillBalanceId(balances, {}), 2);
        assert.equal(resolveTransactionPrefillBalanceId([{ id: 7 }], {}), 7);
    });

    it('returns null for empty balances', () => {
        assert.equal(resolveTransactionPrefillBalanceId([], { documentBalanceId: 1 }), null);
    });
});

describe('isDocumentPaymentBalanceLocked', () => {
    it('locks when document balance is in payment list', () => {
        assert.equal(isDocumentPaymentBalanceLocked(1, [{ id: 1 }]), true);
    });

    it('does not lock without document balance id', () => {
        assert.equal(isDocumentPaymentBalanceLocked(null, [{ id: 1 }]), false);
    });

    it('does not lock when document balance missing from list', () => {
        assert.equal(isDocumentPaymentBalanceLocked(1, []), false);
        assert.equal(isDocumentPaymentBalanceLocked(1, [{ id: 2 }]), false);
    });
});

describe('isDocumentBalanceMismatch', () => {
    it('detects mismatch when balance absent', () => {
        assert.equal(isDocumentBalanceMismatch(1, []), true);
        assert.equal(isDocumentBalanceMismatch(1, null), true);
    });

    it('passes when balance present', () => {
        assert.equal(isDocumentBalanceMismatch(1, [{ id: 1 }]), false);
    });

    it('passes when document balance not set', () => {
        assert.equal(isDocumentBalanceMismatch(null, []), false);
    });
});

describe('requiresDocumentBalanceSelection', () => {
    it('requires balance for order-like payment without document balance', () => {
        assert.equal(requiresDocumentBalanceSelection(true, null, {}), true);
    });

    it('does not require when document balance already set', () => {
        assert.equal(requiresDocumentBalanceSelection(true, 1, {}), false);
    });

    it('does not require for warehouse receipt logistics', () => {
        assert.equal(
            requiresDocumentBalanceSelection(true, null, {
                warehouseReceiptId: true,
                warehouseReceiptGoodsPayment: false,
            }),
            false,
        );
    });

    it('requires for warehouse receipt goods payment', () => {
        assert.equal(
            requiresDocumentBalanceSelection(true, null, {
                warehouseReceiptId: true,
                warehouseReceiptGoodsPayment: true,
            }),
            true,
        );
    });

    it('skips for non-document payment', () => {
        assert.equal(requiresDocumentBalanceSelection(false, null, {}), false);
    });
});

describe('shouldSubmitClientBalanceIdForTransaction', () => {
    it('always submits for document payment with document balance', () => {
        assert.equal(
            shouldSubmitClientBalanceIdForTransaction(true, 1, 1, { clientExcludedFromRequest: true }),
            true,
        );
    });

    it('submits when client not excluded from request', () => {
        assert.equal(
            shouldSubmitClientBalanceIdForTransaction(false, null, 2, { clientExcludedFromRequest: false }),
            true,
        );
    });

    it('respects submitClientBalanceIdOption when client excluded', () => {
        assert.equal(
            shouldSubmitClientBalanceIdForTransaction(false, null, 2, {
                clientExcludedFromRequest: true,
                submitClientBalanceIdOption: true,
            }),
            true,
        );
        assert.equal(
            shouldSubmitClientBalanceIdForTransaction(false, null, 2, {
                clientExcludedFromRequest: true,
                submitClientBalanceIdOption: false,
            }),
            false,
        );
    });

    it('returns false without selected balance', () => {
        assert.equal(
            shouldSubmitClientBalanceIdForTransaction(true, 1, null, {}),
            false,
        );
    });
});

describe('validateDocumentPaymentBeforeSave', () => {
    const base = {
        isDocumentPayment: true,
        paymentBalances: balances,
    };

    it('returns mismatch key when document balance not in list', () => {
        assert.equal(
            validateDocumentPaymentBeforeSave({
                ...base,
                documentBalanceId: 1,
                paymentBalances: [],
                selectedBalanceId: null,
            }),
            'documentBalanceNotFoundAtClient',
        );
    });

    it('returns required key when balance must be selected', () => {
        assert.equal(
            validateDocumentPaymentBeforeSave({
                ...base,
                documentBalanceId: null,
                selectedBalanceId: null,
                formOptions: {},
            }),
            'documentPaymentBalanceRequired',
        );
    });

    it('returns must match when selected differs from document', () => {
        assert.equal(
            validateDocumentPaymentBeforeSave({
                ...base,
                documentBalanceId: 1,
                paymentBalances: [{ id: 1 }],
                selectedBalanceId: 2,
            }),
            'documentPaymentBalanceMustMatch',
        );
    });

    it('allows different balance for receipt logistics expense', () => {
        assert.equal(
            validateDocumentPaymentBeforeSave({
                ...base,
                documentBalanceId: 1,
                paymentBalances: [{ id: 1 }, { id: 2 }],
                selectedBalanceId: 2,
                formOptions: {
                    warehouseReceiptId: true,
                    warehouseReceiptGoodsPayment: false,
                },
            }),
            null,
        );
    });

    it('returns null when valid order payment', () => {
        assert.equal(
            validateDocumentPaymentBeforeSave({
                ...base,
                documentBalanceId: 1,
                paymentBalances: [{ id: 1 }],
                selectedBalanceId: 1,
            }),
            null,
        );
    });

    it('returns null for receipt logistics without document balance', () => {
        assert.equal(
            validateDocumentPaymentBeforeSave({
                isDocumentPayment: true,
                documentBalanceId: null,
                paymentBalances: [],
                selectedBalanceId: null,
                formOptions: {
                    warehouseReceiptId: true,
                    warehouseReceiptGoodsPayment: false,
                },
            }),
            null,
        );
    });

    it('skips validation outside document payment', () => {
        assert.equal(
            validateDocumentPaymentBeforeSave({
                isDocumentPayment: false,
                documentBalanceId: 1,
                paymentBalances: [],
                selectedBalanceId: null,
            }),
            null,
        );
    });
});

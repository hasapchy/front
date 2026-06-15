import { isDraftTableRow } from '@/utils/draftTableRowClass';

/**
 * @param {Array<{ status?: string, amount?: number|string, paidAmount?: number|string, currencyCode?: string }>} contracts
 * @returns {{ paid: Record<string, number>, unpaid: Record<string, number>, total: Record<string, number> }}
 */
export function sumContractsByCurrency(contracts) {
    const paid = {};
    const unpaid = {};
    const total = {};

    for (const contract of contracts || []) {
        if (isDraftTableRow(contract, ['draft'])) {
            continue;
        }

        const currencyCode = contract.currencyCode || 'Нет валюты';
        const amount = parseFloat(contract.amount ?? 0);
        if (Number.isNaN(amount)) {
            continue;
        }

        total[currencyCode] = (total[currencyCode] || 0) + amount;

        const rawPaid = parseFloat(contract.paidAmount ?? 0);
        const paidPart = Number.isNaN(rawPaid) ? 0 : Math.min(Math.max(rawPaid, 0), amount);
        const unpaidPart = Math.max(0, amount - paidPart);

        paid[currencyCode] = (paid[currencyCode] || 0) + paidPart;
        unpaid[currencyCode] = (unpaid[currencyCode] || 0) + unpaidPart;
    }

    return { paid, unpaid, total };
}

/**
 * @param {Record<string, number>} totalsByCurrency
 * @param {(value: number, withDecimals?: boolean) => string} formatNumber
 * @returns {string}
 */
export function formatContractTotalsByCurrency(totalsByCurrency, formatNumber) {
    const result = Object.entries(totalsByCurrency || {})
        .map(([currencyCode, amount]) => `${formatNumber(amount || 0, true)} ${currencyCode}`.trim())
        .join(' / ');

    return result || '0';
}

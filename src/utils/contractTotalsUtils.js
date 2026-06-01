import { isDraftTableRow } from '@/utils/draftTableRowClass';

/**
 * @param {Array<{ status?: string, amount?: number|string, paidAmount?: number|string, currencySymbol?: string }>} contracts
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

        const currencySymbol = contract.currencySymbol || 'Нет валюты';
        const amount = parseFloat(contract.amount ?? 0);
        if (Number.isNaN(amount)) {
            continue;
        }

        total[currencySymbol] = (total[currencySymbol] || 0) + amount;

        const rawPaid = parseFloat(contract.paidAmount ?? 0);
        const paidPart = Number.isNaN(rawPaid) ? 0 : Math.min(Math.max(rawPaid, 0), amount);
        const unpaidPart = Math.max(0, amount - paidPart);

        paid[currencySymbol] = (paid[currencySymbol] || 0) + paidPart;
        unpaid[currencySymbol] = (unpaid[currencySymbol] || 0) + unpaidPart;
    }

    return { paid, unpaid, total };
}

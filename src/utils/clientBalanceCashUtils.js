export function prepareClientBalancesForOrderPayment(balances, preferredBalanceId) {
    if (!Array.isArray(balances) || balances.length === 0) {
        return [];
    }
    const rows = [...balances];
    const pref = preferredBalanceId != null && preferredBalanceId !== ''
        ? Number(preferredBalanceId)
        : null;
    if (pref != null && !Number.isNaN(pref)) {
        const idx = rows.findIndex((b) => Number(b.id) === pref);
        if (idx > 0) {
            const [row] = rows.splice(idx, 1);
            rows.unshift(row);
        }
        return rows;
    }
    const idxDef = rows.findIndex((b) => b.isDefault);
    if (idxDef > 0) {
        const [row] = rows.splice(idxDef, 1);
        rows.unshift(row);
    }
    return rows;
}

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

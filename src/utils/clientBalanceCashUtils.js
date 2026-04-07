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

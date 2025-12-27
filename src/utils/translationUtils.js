export function translate(key, name, t) {
    if (!name) return '';
    const translationKey = `${key}.${name}`;
    const translated = t(translationKey, null, { missingWarn: false });
    return translated !== translationKey ? translated : name;
}

export const translateUnit = (name, t) => translate('unit', name, t);
export const translateTaskStatus = (name, t) => translate('taskStatus', name, t);
export const translateOrderStatusCategory = (name, t) => translate('orderStatusCategory', name, t);
export const translateOrderStatus = (name, t) => translate('orderStatus', name, t);
export const translateLeaveType = (name, t) => translate('leaveType', name, t);
export const translateCurrency = (name, t) => translate('currency', name, t);


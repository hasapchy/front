export function translateTransactionCategory(categoryName, t) {
    if (!categoryName) return '';
    
    const translationKey = `transactionCategory.${categoryName}`;
    const translated = t(translationKey, null, { missingWarn: false });
    
    return translated !== translationKey ? translated : categoryName;
}


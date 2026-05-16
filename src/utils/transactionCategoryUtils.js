export function translateTransactionCategory(categoryName, t) {
    if (!categoryName) {
        return '';
    }

    const translationKey = `transactionCategory.${categoryName}`;
    const translated = t(translationKey, null, { missingWarn: false });

    return translated !== translationKey ? translated : categoryName;
}

export function getTransactionCategoryTypeIcon(category) {
    return category?.type ? '✅' : '🔺';
}

export function formatTransactionCategoryLabel(category, t) {
    if (!category) {
        return '';
    }
    const name = translateTransactionCategory(category.name, t);
    return `${getTransactionCategoryTypeIcon(category)} ${name}`.trim();
}

export function searchTransactionCategoriesLocal(categories, query, t, limit = 30) {
    const q = typeof query === 'string' ? query.trim().toLowerCase() : '';
    if (q.length < 2) {
        return [];
    }
    const list = Array.isArray(categories) ? categories : [];
    return list
        .filter((cat) => transactionCategoryMatchesQuery(cat, q, t))
        .slice(0, limit);
}

function transactionCategoryMatchesQuery(category, qLower, t) {
    if (!category?.name) {
        return false;
    }
    const translated = translateTransactionCategory(category.name, t).toLowerCase();
    const raw = String(category.name).toLowerCase();
    return translated.includes(qLower) || raw.includes(qLower);
}


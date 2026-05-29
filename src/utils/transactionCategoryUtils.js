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
    const matched = list.filter((cat) => transactionCategoryMatchesQuery(cat, q, t));
    if (limit == null || limit <= 0) {
        return matched;
    }
    return matched.slice(0, limit);
}

export function getBindingScenarioTypeIcon(categoryType) {
    return categoryType === 'income' ? '✅' : '🔺';
}

export function leafTransactionCategories(categories, includeIds = []) {
    const list = Array.isArray(categories) ? categories : [];
    const groupIds = new Set();
    for (const category of list) {
        const parentId = category?.parent_id ?? category?.parentId;
        if (parentId != null && parentId !== '') {
            groupIds.add(Number(parentId));
        }
    }
    const keepIds = new Set(
        includeIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0),
    );
    return list.filter((category) => {
        if (!category?.id) {
            return false;
        }
        const id = Number(category.id);
        if (keepIds.has(id)) {
            return true;
        }
        return !groupIds.has(id);
    });
}

function transactionCategoryMatchesQuery(category, qLower, t) {
    if (!category?.name) {
        return false;
    }
    const translated = translateTransactionCategory(category.name, t).toLowerCase();
    const raw = String(category.name).toLowerCase();
    return translated.includes(qLower) || raw.includes(qLower);
}


export function formatCategoryName(name) {
  if (name == null || name === '') {
    return '';
  }
  const s = String(name).trim();
  const stripped = s.replace(/^\d+[-\s.–—:]*\s*/u, '').trim();
  return stripped || s;
}

export function formatCategoryLabel(category) {
  if (!category) {
    return '';
  }
  const raw = category.name;
  return formatCategoryName(raw) || raw || '';
}

export function getCategoryLabelWithParent(category, categories) {
  if (!category) {
    return '';
  }
  const list = Array.isArray(categories) ? categories : [];
  const parent = category.parentId
    ? list.find((c) => c.id == category.parentId)
    : null;
  const name = formatCategoryLabel(category);
  if (!parent) {
    return name;
  }
  return `${name} (${formatCategoryLabel(parent)})`;
}

export function filterCategoriesForSelect(categories) {
  const cats = Array.isArray(categories) ? categories : [];
  return cats
    .filter((c) => c && c.status !== false)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export function searchCategoriesLocal(categories, query, limit = 20) {
  const q = typeof query === 'string' ? query.trim().toLowerCase() : '';
  if (q.length < 2) {
    return [];
  }
  return filterCategoriesForSelect(categories)
    .filter((c) => c?.name && categoryMatchesQuery(c, q))
    .slice(0, limit);
}

function categoryMatchesQuery(category, qLower) {
  const raw = String(category.name).toLowerCase();
  const display = formatCategoryName(category.name).toLowerCase();
  return raw.includes(qLower) || display.includes(qLower);
}

export function isRootCategory(category) {
  if (!category) {
    return false;
  }
  return category.parentId == null || category.parentId === '';
}

export function getCategoryDescendantIds(categoryId, categories) {
  const parentId = Number(categoryId);
  if (Number.isNaN(parentId)) {
    return [];
  }
  const list = Array.isArray(categories) ? categories : [];
  const descendants = [];
  const collect = (pid) => {
    list.forEach((category) => {
      if (!category || category.parentId == null || category.parentId === '') {
        return;
      }
      if (Number(category.parentId) !== Number(pid)) {
        return;
      }
      descendants.push(String(category.id));
      collect(category.id);
    });
  };
  collect(parentId);
  return descendants;
}

export function getCategorySelectionWithDescendants(categoryId, categories, selectedIds) {
  const id = String(categoryId);
  const next = [...selectedIds];
  if (!next.includes(id)) {
    next.push(id);
  }
  getCategoryDescendantIds(categoryId, categories).forEach((descId) => {
    if (!next.includes(descId)) {
      next.push(descId);
    }
  });
  return next;
}

export function getCategorySelectionWithoutDescendants(categoryId, categories, selectedIds) {
  const id = String(categoryId);
  const removeIds = new Set([id, ...getCategoryDescendantIds(categoryId, categories)]);
  return selectedIds.filter((item) => !removeIds.has(String(item)));
}

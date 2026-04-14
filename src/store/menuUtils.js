export function dropSalaryReport(items) {
  return (items || []).filter((i) => i && i.id !== "salaries-report");
}

export function stripSalaryMenu(menuItems) {
  if (!menuItems || typeof menuItems !== "object") {
    return menuItems;
  }
  return {
    ...menuItems,
    main: dropSalaryReport(menuItems.main),
    available: dropSalaryReport(menuItems.available),
  };
}

function menuVisible(item, getters) {
  if (!item) return false;
  if (item.id === "salaries-report") return false;
  if (item.id === "simple-orders") {
    if (getters.hasPermission("orders_view")) return false;
    return getters.hasPermission("orders_simple_view");
  }
  if (item.id === "mutual-settlements" && getters.hasPermission("transactions_view")) {
    return false;
  }
  if ((item.id === "org-structure" || item.id === "roles") && getters.hasPermission("users_view")) {
    return false;
  }
  if (item.id === "cash-registers" && getters.hasPermission("transactions_view")) {
    return false;
  }
  if (item.id === "invoices" && getters.hasPermission("transactions_view")) {
    return false;
  }
  if (item.id === "contracts" && getters.hasPermission("projects_view")) {
    return false;
  }
  if (item.permissions?.length) {
    return item.permissions.some((p) => getters.hasPermission(p));
  }
  if (!item.permission) return true;
  return getters.hasPermission(item.permission);
}

export function filterMenu(state, items, getters) {
  if (!items?.length) return [];
  if (!Array.isArray(state.permissions)) return [];
  return items.filter((item) => menuVisible(item, getters));
}

function uniqById(items) {
  const out = [];
  const seen = new Set();
  for (const item of items) {
    if (item?.id && !seen.has(item.id)) {
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

export function mergeMenus(mainItems, availableItems, mapItem = (x) => x) {
  const mainUnique = uniqById(mainItems.map(mapItem));
  const availableUnique = uniqById(availableItems.map(mapItem));
  const mainIds = new Set(mainUnique.map((i) => i.id).filter(Boolean));
  const availableIds = new Set(availableUnique.map((i) => i.id).filter(Boolean));
  return {
    main: mainUnique.filter((item) => item?.id && !availableIds.has(item.id)),
    available: availableUnique.filter((item) => item?.id && !mainIds.has(item.id)),
  };
}

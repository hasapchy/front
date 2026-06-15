const ROUTE_PERMISSION_MAP = {
    '/categories': 'categories_view',
    '/order_statuses': 'order_statuses_view',
    '/order_status_categories': 'order_statuscategories_view',
    '/project_statuses': 'project_statuses_view',
    '/projects': 'projects_view',
    '/task_statuses': 'task_statuses_view',
    '/tasks': 'tasks_view',
    '/transactions': 'transactions_view',
    '/transactions/templates': 'transactions_view',
    '/mutual-settlements': 'mutual_settlements_view',
    '/transfers': 'transfers_view',
    '/cash-registers': 'cash_registers_view',
    '/financial-accounts': 'financial_accounts_view',
    '/invoices': 'invoices_view',
    '/transaction_categories': 'transaction_categories_view',
    '/products': 'products_view',
    '/services': 'products_view',
    '/warehouses': 'warehouse_stocks_view',
    '/admin/warehouses': 'warehouses_view',
    '/simple-orders': 'orders_simple_view',
    '/org-structure': 'departments_view_all',
    '/roles': 'roles_view',
    '/contracts': 'projects_view',
    '/salaries': 'employee_salaries_accrue',
    '/users': 'users_view',
    '/reports': 'reports_view',
    '/reports/income-by-categories': 'reports_view_by_categories',
    '/reports/expense-by-categories': 'reports_view_by_categories',
    '/reports/cashflow': 'reports_view_by_categories',
    '/reports/counterparties': 'reports_view_by_categories',
    '/reports/orders': 'reports_view_by_categories',
    '/reports/contracts': 'reports_view_by_categories',
    '/reports/plan-fact': 'reports_view_by_categories',
    '/leaves': 'leaves_view_all',
    '/leave_types': 'leave_types_view_all',
    '/leads': 'leads_view',
    '/lead_statuses': 'lead_statuses_view',
    '/lead_sources': 'lead_sources_view',
    '/units': 'units_view',
    '/holidays': 'holidays_view',
    '/production-calendar': 'production_calendar_view',
};

const TAB_ICON_MAP = {
    '/orders': 'fas fa-clipboard-list',
    '/simple-orders': 'fas fa-clipboard-check',
    '/order_statuses': 'fas fa-sitemap',
    '/order_status_categories': 'fas fa-layer-group',
    '/transactions': 'fas fa-money-check-alt',
    '/transactions/templates': 'fas fa-clone',
    '/mutual-settlements': 'fas fa-handshake',
    '/transfers': 'fas fa-exchange-alt',
    '/cash-registers': 'fas fa-cash-register',
    '/financial-accounts': 'fas fa-book',
    '/invoices': 'fas fa-file-invoice-dollar',
    '/transaction_categories': 'fas fa-folder-tree',
    '/products': 'fas fa-boxes',
    '/services': 'fas fa-concierge-bell',
    '/project_statuses': 'fas fa-project-diagram',
    '/projects': 'fas fa-tasks',
    '/task_statuses': 'fas fa-project-diagram',
    '/tasks': 'fas fa-tasks',
    '/categories': 'fa-solid fa-tags',
    '/warehouses': 'fas fa-box',
    '/admin/warehouses': 'fas fa-warehouse',
    '/org-structure': 'fas fa-sitemap',
    '/roles': 'fas fa-user-shield',
    '/contracts': 'fas fa-file-signature',
    '/companies': 'fa-solid fa-building',
    '/holidays': 'fas fa-calendar-day',
    '/production-calendar': 'fas fa-calendar-xmark',
    '/salaries': 'fas fa-money-bill-wave',
    '/users': 'fas fa-users',
    '/reports': 'fas fa-chart-pie',
    '/reports/income-by-categories': 'fas fa-arrow-trend-up',
    '/reports/expense-by-categories': 'fas fa-arrow-trend-down',
    '/reports/cashflow': 'fas fa-chart-line',
    '/reports/counterparties': 'fas fa-users',
    '/reports/orders': 'fas fa-file-invoice',
    '/reports/contracts': 'fas fa-file-signature',
    '/reports/plan-fact': 'fas fa-layer-group',
    '/leaves': 'fas fa-calendar-days',
    '/leave_types': 'fas fa-list-ul',
    '/settings/currencies': 'fa-solid fa-coins',
    '/units': 'fa-solid fa-ruler-combined',
    '/settings/currency-history': 'fa-solid fa-chart-line',
    '/leads': 'fas fa-funnel-dollar',
    '/lead_statuses': 'fas fa-stream',
    '/lead_sources': 'fas fa-bullhorn',
};

export function getRoutePermission(path) {
    return ROUTE_PERMISSION_MAP[path];
}

export function getTabIcon(path) {
    return TAB_ICON_MAP[path] || 'fas fa-link';
}

export function calcHeaderTabsFitCount({ tabWidths, availableWidth, moreButtonWidth, gap = 16 }) {
    const tabsCount = tabWidths.length;
    if (!tabsCount || availableWidth <= 0) {
        return 0;
    }
    if (tabWidths.some((width) => width <= 0)) {
        return null;
    }
    const totalWidth = tabWidths.reduce((sum, width, index) => sum + width + (index > 0 ? gap : 0), 0);
    if (totalWidth <= availableWidth) {
        return tabsCount;
    }
    const budget = availableWidth - moreButtonWidth - gap;
    let used = 0;
    let fit = 0;
    for (let i = 0; i < tabWidths.length; i += 1) {
        const tabWidth = tabWidths[i] + (fit > 0 ? gap : 0);
        if (used + tabWidth > budget) {
            break;
        }
        used += tabWidth;
        fit += 1;
    }
    return Math.max(1, Math.min(fit, tabsCount - 1));
}

export function getBindedList(route, store, translate) {
    const binded = route.meta?.binded;
    if (!binded || !Array.isArray(binded)) {
        return [];
    }
    return binded
        .filter((tab) => {
            if (Array.isArray(tab.permissions) && tab.permissions.length > 0) {
                return tab.permissions.some((p) => store.getters.hasPermission(p));
            }
            const routePermission = tab.permission || getRoutePermission(tab.path);
            return !routePermission || store.getters.hasPermission(routePermission);
        })
        .map((tab) => ({
            ...tab,
            name: translate(tab.name),
        }));
}

export function resolveActiveBindedPath(currentPath, list) {
    let best = null;
    let bestLen = -1;
    for (let i = 0; i < list.length; i++) {
        const p = list[i].path;
        if (currentPath === p || currentPath.startsWith(`${p}/`)) {
            if (p.length > bestLen) {
                bestLen = p.length;
                best = p;
            }
        }
    }
    return best;
}

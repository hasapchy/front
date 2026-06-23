export const PAGE_ROUTE_TAB_GROUPS = [
    {
        id: 'tasks',
        tabs: [
            { name: 'tasks', path: '/tasks', icon: 'fas fa-tasks', permissions: ['tasks_view', 'tasks_view_own'] },
            { name: 'taskStatuses', path: '/task_statuses', icon: 'fas fa-project-diagram', permission: 'task_statuses_view' },
        ],
    },
    {
        id: 'orders',
        tabs: [
            { name: 'orders', path: '/orders', icon: 'fas fa-clipboard-list', permission: 'orders_view' },
            { name: 'orders_simple', path: '/simple-orders', icon: 'fas fa-clipboard-check', permission: 'orders_simple_view' },
            { name: 'orderStatuses', path: '/order_statuses', icon: 'fas fa-sitemap', permission: 'order_statuses_view' },
            { name: 'orderStatusCategories', path: '/order_status_categories', icon: 'fas fa-layer-group', permission: 'order_statuscategories_view' },
        ],
    },
    {
        id: 'finance',
        tabs: [
            { name: 'finance', path: '/transactions', icon: 'fas fa-money-check-alt', permission: 'transactions_view' },
            { name: 'transactionTemplates', path: '/transactions/templates', icon: 'fas fa-clone', permission: 'transactions_view' },
            { name: 'mutualSettlements', path: '/mutual-settlements', icon: 'fas fa-handshake', permission: 'mutual_settlements_view' },
            { name: 'transfers', path: '/transfers', icon: 'fas fa-exchange-alt', permission: 'transfers_view' },
            { name: 'cashRegisters', path: '/cash-registers', icon: 'fas fa-cash-register', permission: 'cash_registers_view' },
            { name: 'invoices', path: '/invoices', icon: 'fas fa-file-invoice-dollar', permission: 'invoices_view' },
            { name: 'transactionCategories', path: '/transaction_categories', icon: 'fas fa-folder-tree', permission: 'transaction_categories_view' },
        ],
    },
    {
        id: 'warehouse',
        tabs: [
            { name: 'stock', path: '/warehouses', icon: 'fas fa-boxes-stacked', permission: 'warehouse_stocks_view' },
            { name: 'purchases', path: '/warehouses/purchases', icon: 'fas fa-cart-plus', permission: 'warehouse_purchases_view' },
            { name: 'receipt', path: '/warehouses/receipts', icon: 'fas fa-truck-ramp-box', permission: 'warehouse_receipts_view' },
            { name: 'writeoff', path: '/warehouses/writeoffs', icon: 'fas fa-trash-can', permission: 'warehouse_writeoffs_view' },
            { name: 'warehouseReturnsTab', path: '/warehouses/writeoff-returns', icon: 'fas fa-rotate-left', permission: 'warehouse_writeoffs_view' },
            { name: 'movement', path: '/warehouses/movements', icon: 'fas fa-right-left', permission: 'warehouse_movements_view' },
            {
                name: 'inventory',
                path: '/warehouses/inventories',
                icon: 'fas fa-clipboard-check',
                permissions: ['inventories_view_all', 'inventories_view_own'],
            },
            { name: 'adminWarehouses', path: '/admin/warehouses', icon: 'fas fa-warehouse', permission: 'warehouses_view' },
        ],
    },
    {
        id: 'leads',
        tabs: [
            { name: 'leads', path: '/leads', icon: 'fas fa-funnel-dollar', permission: 'leads_view' },
            { name: 'leadStatuses', path: '/lead_statuses', icon: 'fas fa-stream', permission: 'lead_statuses_view' },
            { name: 'leadSources', path: '/lead_sources', icon: 'fas fa-bullhorn', permission: 'lead_sources_view' },
        ],
    },
    {
        id: 'projects',
        tabs: [
            { name: 'projects', path: '/projects', icon: 'fas fa-tasks', permissions: ['projects_view', 'projects_view_own'] },
            { name: 'projectStatuses', path: '/project_statuses', icon: 'fas fa-project-diagram', permission: 'project_statuses_view' },
            { name: 'contracts', path: '/contracts', icon: 'fas fa-file-signature', permissions: ['projects_view', 'projects_view_own'] },
        ],
    },
    {
        id: 'catalog',
        tabs: [
            { name: 'products', path: '/products', icon: 'fas fa-boxes', permission: 'products_view' },
            { name: 'services', path: '/services', icon: 'fas fa-concierge-bell', permission: 'products_view' },
            { name: 'categories', path: '/categories', icon: 'fa-solid fa-tags', permission: 'categories_view' },
            {
                name: 'unitsSettings',
                path: '/units',
                icon: 'fa-solid fa-ruler-combined',
                permissions: ['units_view', 'units_create', 'units_update', 'units_delete'],
            },
        ],
    },
    {
        id: 'users',
        tabs: [
            { name: 'users', path: '/users', icon: 'fas fa-users', permission: 'users_view' },
            { name: 'orgStructure', path: '/org-structure', icon: 'fas fa-sitemap', permission: 'departments_view_all' },
            { name: 'roles', path: '/roles', icon: 'fas fa-user-shield', permission: 'roles_view' },
            { name: 'salariesPage', path: '/salaries', icon: 'fas fa-money-bill-wave', permission: 'employee_salaries_accrue' },
        ],
    },
    {
        id: 'companies',
        tabs: [
            { name: 'companies', path: '/companies', icon: 'fas fa-building', permission: 'companies_view' },
            { name: 'holidays', path: '/holidays', icon: 'fas fa-calendar-day', permission: 'holidays_view' },
            { name: 'productionCalendar', path: '/production-calendar', icon: 'fas fa-calendar-xmark', permission: 'production_calendar_view' },
        ],
    },
    {
        id: 'reports',
        tabs: [
            { name: 'reports', path: '/reports', icon: 'fas fa-chart-pie', permission: 'reports_view' },
            { name: 'incomesByCategory', path: '/reports/income-by-categories', icon: 'fas fa-arrow-trend-up', permission: 'reports_view_by_categories' },
            { name: 'expensesByCategory', path: '/reports/expense-by-categories', icon: 'fas fa-arrow-trend-down', permission: 'reports_view_by_categories' },
            { name: 'ddsReport', path: '/reports/cashflow', icon: 'fas fa-chart-line', permission: 'reports_view_by_categories' },
            { name: 'counterpartiesReport', path: '/reports/counterparties', icon: 'fas fa-users', permission: 'reports_view_by_categories' },
            { name: 'ordersReport', path: '/reports/orders', icon: 'fas fa-file-invoice', permission: 'reports_view_by_categories' },
            { name: 'contractsReport', path: '/reports/contracts', icon: 'fas fa-file-signature', permission: 'reports_view_by_categories' },
            { name: 'planFactBlueprint', path: '/reports/plan-fact', icon: 'fas fa-layer-group', permission: 'reports_view_by_categories' },
        ],
    },
    {
        id: 'settings-currency',
        tabs: [
            {
                name: 'currencies',
                path: '/settings/currencies',
                icon: 'fa-solid fa-coins',
                permissions: ['currencies_view', 'currencies_view_all'],
            },
            {
                name: 'currencyHistory',
                path: '/settings/currency-history',
                icon: 'fa-solid fa-chart-line',
                permissions: [
                    'currency_history_view',
                    'currency_history_view_all',
                    'currency_history_view_own',
                ],
            },
        ],
    },
    {
        id: 'leaves',
        tabs: [
            { name: 'leaves', path: '/leaves', icon: 'fas fa-calendar-days', permission: 'leaves_view_all' },
            { name: 'leaveTypes', path: '/leave_types', icon: 'fas fa-list-ul', permission: 'leave_types_view_all' },
        ],
    },
];

export function findPageRouteTabGroup(path) {
    let bestGroup = null;
    let bestLen = -1;
    for (const group of PAGE_ROUTE_TAB_GROUPS) {
        for (const tab of group.tabs) {
            if (path === tab.path || path.startsWith(`${tab.path}/`)) {
                if (tab.path.length > bestLen) {
                    bestLen = tab.path.length;
                    bestGroup = group;
                }
            }
        }
    }
    return bestGroup;
}

function isPageRouteTabVisible(tab, store) {
    if (Array.isArray(tab.permissions) && tab.permissions.length > 0) {
        return tab.permissions.some((p) => store.getters.hasPermission(p));
    }
    if (tab.permission) {
        return store.getters.hasPermission(tab.permission);
    }
    return true;
}

export function applyPageTabOrder(tabs, savedOrder) {
    if (!Array.isArray(savedOrder) || savedOrder.length === 0) {
        return tabs;
    }
    const tabByName = new Map(tabs.map((tab) => [tab.name, tab]));
    const ordered = [];
    const seen = new Set();
    for (const name of savedOrder) {
        const tab = tabByName.get(name);
        if (tab) {
            ordered.push(tab);
            seen.add(name);
        }
    }
    for (const tab of tabs) {
        if (!seen.has(tab.name)) {
            ordered.push(tab);
        }
    }
    return ordered;
}

export function getPageRouteTabs(currentPath, store, translate) {
    const group = findPageRouteTabGroup(currentPath);
    if (!group) {
        return [];
    }
    const visibleTabs = group.tabs
        .filter((tab) => isPageRouteTabVisible(tab, store))
        .map((tab) => ({
            ...tab,
            label: translate(tab.name),
            icon: tab.icon || 'fas fa-link',
        }));
    const savedOrder = store.state.pageTabOrders?.[group.id];
    return applyPageTabOrder(visibleTabs, savedOrder);
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

import { createRouter, createWebHistory } from "vue-router";
import store from "@/store";

import SidebarLayout from "@/views/layouts/SidebarLayout.vue";
import BlankLayout from "@/views/layouts/BlankLayout.vue";

import LoginPage from "@/views/pages/auth/LoginPage.vue";
import MaintenancePage from "@/views/pages/MaintenancePage.vue";
import WarehousesStockPage from "@/views/pages/warehouses/WarehousesStockPage.vue";
import WarehousesPurchasesPage from "@/views/pages/warehouses/WarehousesPurchasesPage.vue";
import WarehousesReceiptPage from "@/views/pages/warehouses/WarehousesReceiptPage.vue";
import WarehousesWriteoffPage from "@/views/pages/warehouses/WarehousesWriteoffPage.vue";
import WarehousesMovementPage from "@/views/pages/warehouses/WarehousesMovementPage.vue";
import AdminWarehousesPage from "@/views/pages/admin/warehouses/AdminWarehousesPage.vue";
import WarehousesInventoriesPage from "@/views/pages/warehouses/WarehousesInventoriesPage.vue";
import CategoriesPage from "@/views/pages/categories/CategoriesPage.vue";
import ProductsPage from "@/views/pages/products/ProductsPage.vue";
import ClientsPage from "@/views/pages/clients/ClientsPage.vue";
import CashRegistersPage from "@/views/pages/cash_registers/CashRegistersPage.vue";
import FinancialAccountsPage from "@/views/pages/financial_accounts/FinancialAccountsPage.vue";
import FinancialAccountViewPage from "@/views/pages/financial_accounts/FinancialAccountViewPage.vue";
import JournalEntriesPage from "@/views/pages/journal_entries/JournalEntriesPage.vue";
import JournalEntryViewPage from "@/views/pages/journal_entries/JournalEntryViewPage.vue";
import ProjectsPage from "@/views/pages/projects/ProjectsPage.vue";
import ServicesPage from "@/views/pages/products/ServicesPage.vue";
import TransactionsPage from "@/views/pages/transactions/TransactionsPage.vue";
import TransfersPage from "@/views/pages/transfers/TransfersPage.vue";
import SalesPage from "@/views/pages/sales/SalesPage.vue";
import OrdersPage from "@/views/pages/orders/OrdersPage.vue";
import OrderStatusesPage from "@/views/pages/orders/OrderStatusesPage.vue";
import OrderStatusCategoriesPage from "@/views/pages/orders/OrderStatusCategoriesPage.vue";
import TransactionCategoriesPage from "@/views/pages/transactions/TransactionCategoriesPage.vue";
import TransactionTemplatesPage from "@/views/pages/transactions/TransactionTemplatesPage.vue";
import ProjectStatusesPage from "@/views/pages/projects/ProjectStatusesPage.vue";
import InvoicesPage from "@/views/pages/invoices/InvoicesPage.vue";
import UsersPage from "@/views/pages/users/UsersPage.vue";
import RolesPage from "@/views/pages/roles/RolesPage.vue";
import CompaniesPage from "@/views/pages/companies/CompaniesPage.vue";
import CompanyHolidaysPage from "@/views/pages/company-holidays/CompanyHolidaysPage.vue";
import CompanyProductionCalendarPage from "@/views/pages/company-production-calendar/CompanyProductionCalendarPage.vue";
import CurrencyHistoryPage from "@/views/pages/currencies/CurrencyHistoryPage.vue";
import CurrenciesPage from "@/views/pages/currencies/CurrenciesPage.vue";
import UnitsPage from "@/views/pages/units/UnitsPage.vue";
import LeavesPage from "@/views/pages/leaves/LeavesPage.vue";
import LeaveTypesPage from "@/views/pages/leave_types/LeaveTypesPage.vue";
import MessengerPage from "@/views/pages/messenger/MessengerPage.vue";

// Simple orders pages
import SimpleOrdersPage from "@/views/pages/simple/SimpleOrdersPage.vue";
import SimpleOrderCreatePage from "@/views/pages/simple/SimpleOrderCreatePage.vue";
import MutualSettlementsPage from "@/views/pages/mutual_settlements/MutualSettlementsPage.vue";
import NewsPage from "@/views/pages/news/NewsPage.vue";
import NotFoundPage from "@/views/pages/NotFoundPage.vue";

const ReportsPage = () => import("@/views/pages/reports/ReportsPage.vue");
const ReportByCategoriesPage = () => import("@/views/pages/reports/ReportByCategoriesPage.vue");
const ReportCashflowPage = () => import("@/views/pages/reports/ReportCashflowPage.vue");
const ReportCounterpartiesPage = () => import("@/views/pages/reports/ReportCounterpartiesPage.vue");
const ReportSourceExecutionPage = () => import("@/views/pages/reports/ReportSourceExecutionPage.vue");
const ReportPlanFactBlueprintPage = () => import("@/views/pages/reports/ReportPlanFactBlueprintPage.vue");

const WAREHOUSE_HASH_REDIRECTS = {
  positions: '/warehouses',
  stock: '/warehouses',
  purchases: '/warehouses/purchases',
  posting: '/warehouses/receipts',
  writeoff: '/warehouses/writeoffs',
  writeoff_returns: '/warehouses/writeoff-returns',
  movement: '/warehouses/movements',
  inventory: '/warehouses/inventories',
};

const routes = [
  {
    path: "/",
    name: "Public",
    component: SidebarLayout,
    children: [
      {
        path: "/",
        name: "Home",
        component: NewsPage,
        meta: { title: "news", requiresAuth: true },
      },
      {
        path: "/messenger",
        name: "Messenger",
        component: MessengerPage,
        meta: {
          title: "messenger",
          requiresAuth: true,
          permissions: ["chats_view_all", "chats_view"],
        },
      },
      {
        path: "/sales",
        name: "Sales",
        component: SalesPage,
        meta: {
          title: "sales",
          requiresAuth: true,
          showSearch: true,
          permission: "sales_view",
        },
      },
      {
        path: "/sales/:id",
        name: "SaleView",
        component: SalesPage,
        meta: {
          title: "sales",
          requiresAuth: true,
          showSearch: true,
          permission: "sales_view",
        },
      },
      {
        path: "/tasks",
        name: "Tasks",
        component: () => import("@/views/pages/tasks/TasksPage.vue"),
        meta: {
          title: "tasks",
          requiresAuth: true,
          permissions: ["tasks_view", "tasks_view_own"]
        },
      },
      {
        path: "/tasks/:id",
        name: "TaskView",
        component: () => import("@/views/pages/tasks/TasksPage.vue"),
        meta: {
          title: "tasks",
          requiresAuth: true,
          permissions: ["tasks_view", "tasks_view_own"]
        },
      },
      {
        path: "/news",
        name: "News",
        component: NewsPage,
        meta: {
          title: "news",
          requiresAuth: true,
        },
      },
      {
        path: "/message-templates",
        name: "message_templates",
        component: () => import("@/views/pages/message-templates/MessageTemplatesPage.vue"),
        meta: {
          title: "messageTemplates",
          requiresAuth: true,
          permission: "templates_view",
        },
      },
      {
        path: "/message-templates/:id",
        name: "MessageTemplateView",
        component: () => import("@/views/pages/message-templates/MessageTemplatesPage.vue"),
        meta: {
          title: "messageTemplates",
          requiresAuth: true,
          permission: "templates_view",
        },
      },
      {
        path: "/task_statuses",
        name: "task_statuses",
        component: () => import("@/views/pages/tasks/TaskStatusesPage.vue"),
        meta: {
          title: "taskStatuses",
          requiresAuth: true,
          permission: "task_statuses_view"
        },
      },
      {
        path: "/orders",
        name: "Orders",
        component: OrdersPage,
        meta: {
          title: "orders",
          requiresAuth: true,
          showSearch: true,
          permission: "orders_view"
        },
      },
      {
        path: "/orders/:id",
        name: "OrderView",
        component: OrdersPage,
        meta: {
          title: "orders",
          requiresAuth: true,
          showSearch: true,
          permission: "orders_view"
        },
      },
      {
        path: "/order_statuses",
        name: "order_statuses",
        component: OrderStatusesPage,
        meta: {
          title: "orderStatuses",
          requiresAuth: true,
          permission: "order_statuses_view"
        },
      },
      {
        path: "/order_status_categories",
        name: "order_status_categories",
        component: OrderStatusCategoriesPage,
        meta: {
          title: "orderStatusCategories",
          requiresAuth: true,
          permission: "order_statuscategories_view"
        },
      },
      {
        path: "/invoices",
        name: "Invoices",
        component: InvoicesPage,
        meta: {
          title: "invoices",
          requiresAuth: true,
          showSearch: true,
          permission: "invoices_view"
        },
      },
      {
        path: "/invoices/:id",
        name: "InvoiceView",
        component: InvoicesPage,
        meta: {
          title: "invoices",
          requiresAuth: true,
          showSearch: true,
          permission: "invoices_view"
        },
      },
      {
        path: "/transactions",
        name: "Transactions",
        component: TransactionsPage,
        meta: {
          title: "finance",
          requiresAuth: true,
          showSearch: true,
          permission: "transactions_view"
        },
      },
      {
        path: "/transactions/templates",
        name: "TransactionTemplates",
        component: TransactionTemplatesPage,
        meta: {
          title: "transactionTemplates",
          requiresAuth: true,
          showSearch: false,
          permission: "transactions_view"
        },
      },
      {
        path: "/transactions/:id",
        name: "TransactionView",
        component: TransactionsPage,
        meta: {
          title: "finance",
          requiresAuth: true,
          showSearch: true,
          permission: "transactions_view"
        },
      },
      {
        path: "/transfers",
        name: "Transfers",
        component: TransfersPage,
        meta: {
          title: "transfers",
          requiresAuth: true,
          permission: "transfers_view"
        },
      },
      {
        path: "/warehouses/purchases",
        name: "WarehousePurchases",
        component: WarehousesPurchasesPage,
        meta: {
          title: "purchases",
          requiresAuth: true,
          showSearch: true,
          permission: "warehouse_purchases_view",
        },
      },
      {
        path: "/warehouses/purchases/:id",
        name: "WarehousePurchaseView",
        component: WarehousesPurchasesPage,
        meta: {
          title: "purchases",
          requiresAuth: true,
          showSearch: true,
          permission: "warehouse_purchases_view",
        },
      },
      {
        path: "/warehouses/receipts",
        name: "WarehouseReceipts",
        component: WarehousesReceiptPage,
        meta: {
          title: "receipt",
          requiresAuth: true,
          showSearch: true,
          permission: "warehouse_receipts_view",
        },
      },
      {
        path: "/warehouses/writeoffs",
        name: "WarehouseWriteoffs",
        component: WarehousesWriteoffPage,
        meta: {
          title: "writeoff",
          requiresAuth: true,
          showSearch: true,
          permission: "warehouse_writeoffs_view",
        },
      },
      {
        path: "/warehouses/writeoff-returns",
        name: "WarehouseWriteoffReturns",
        component: WarehousesWriteoffPage,
        props: { returnsOnly: true },
        meta: {
          title: "warehouseReturnsTab",
          requiresAuth: true,
          showSearch: true,
          permission: "warehouse_writeoffs_view",
        },
      },
      {
        path: "/warehouses/movements",
        name: "WarehouseMovements",
        component: WarehousesMovementPage,
        meta: {
          title: "movement",
          requiresAuth: true,
          showSearch: true,
          permission: "warehouse_movements_view",
        },
      },
      {
        path: "/warehouses/inventories",
        name: "WarehouseInventories",
        component: WarehousesInventoriesPage,
        meta: {
          title: "inventory",
          requiresAuth: true,
          permissions: ["inventories_view_all", "inventories_view_own"],
        },
      },
      {
        path: "/warehouses/inventories/:id",
        name: "WarehouseInventoryView",
        component: WarehousesInventoriesPage,
        meta: {
          title: "inventory",
          requiresAuth: true,
          permissions: ["inventories_view_all", "inventories_view_own"],
        },
      },
      {
        path: "/warehouses",
        name: "Warehouses",
        component: WarehousesStockPage,
        meta: {
          title: "positions",
          requiresAuth: true,
          showSearch: true,
          permission: "warehouse_stocks_view"
        },
      },
      {
        path: "/warehouse_purchases",
        redirect: "/warehouses/purchases",
      },
      {
        path: "/warehouse_purchases/:id",
        redirect: (to) => ({ path: `/warehouses/purchases/${to.params.id}` }),
      },
      {
        path: "/inventories",
        redirect: "/warehouses/inventories",
      },
      {
        path: "/inventories/:id/items",
        redirect: (to) => ({ path: `/warehouses/inventories/${to.params.id}` }),
      },
      {
        path: "/clients",
        name: "Clients",
        component: ClientsPage,
        meta: {
          title: "clients",
          requiresAuth: true,
          showSearch: true,
          permission: "clients_view",
        },
      },
      {
        path: "/clients/:id",
        name: "ClientView",
        component: ClientsPage,
        meta: {
          title: "clients",
          requiresAuth: true,
          showSearch: true,
          permission: "clients_view",
        },
      },
      {
        path: "/leads",
        name: "Leads",
        component: () => import("@/views/pages/leads/LeadsPage.vue"),
        meta: {
          title: "leads",
          requiresAuth: true,
          showSearch: true,
          permission: "leads_view"
        },
      },
      {
        path: "/leads/:id",
        name: "LeadView",
        component: () => import("@/views/pages/leads/LeadsPage.vue"),
        meta: {
          title: "leads",
          requiresAuth: true,
          showSearch: true,
          permission: "leads_view"
        },
      },
      {
        path: "/lead_statuses",
        name: "LeadStatuses",
        component: () => import("@/views/pages/leads/LeadStatusesPage.vue"),
        meta: {
          title: "leadStatuses",
          requiresAuth: true,
          permission: "lead_statuses_view"
        },
      },
      {
        path: "/lead_sources",
        name: "LeadSources",
        component: () => import("@/views/pages/leads/LeadSourcesPage.vue"),
        meta: {
          title: "leadSources",
          requiresAuth: true,
          permission: "lead_sources_view"
        },
      },
      {
        path: "/drive",
        name: "Drive",
        component: () => import("@/views/pages/drive/DrivesPage.vue"),
        meta: {
          title: "drive",
          requiresAuth: true,
          permission: "drive_view",
        },
      },
      {
        path: "/projects",
        name: "Projects",
        component: ProjectsPage,
        meta: {
          title: "projects",
          requiresAuth: true,
          showSearch: true,
          permissions: ["projects_view", "projects_view_own"]
        },
      },
      {
        path: "/contracts",
        name: "Contracts",
        component: () => import("@/views/pages/projects/ProjectContractsPage.vue"),
        meta: {
          title: "contracts",
          requiresAuth: true,
          permissions: ["projects_view", "projects_view_own"],
          showSearch: true
        },
      },
      {
        path: "/projects/:id",
        name: "ProjectView",
        component: ProjectsPage,
        meta: {
          title: "projects",
          requiresAuth: true,
          showSearch: true,
          permissions: ["projects_view", "projects_view_own"]
        },
      },
      {
        path: "/project_statuses",
        name: "project_statuses",
        component: ProjectStatusesPage,
        meta: {
          title: "projectStatuses",
          requiresAuth: true,
          permission: "project_statuses_view"
        },
      },
      {
        path: "/admin/warehouses",
        name: "Admin-Warehouses",
        component: AdminWarehousesPage,
        meta: {
          title: "adminWarehouses",
          requiresAuth: true,
          permission: "warehouses_view"
        },
      },
      {
        path: "/categories",
        name: "Categories",
        component: CategoriesPage,
        meta: {
          title: "categories",
          requiresAuth: true,
          permission: "categories_view"
        },
      },
      {
        path: "/transaction_categories",
        name: "transaction_categories",
        component: TransactionCategoriesPage,
        meta: {
          title: "transactionCategories",
          requiresAuth: true,
          permission: "transaction_categories_view"
        },
      },
      {
        path: "/users",
        name: "users",
        component: UsersPage,
        meta: {
          title: "users",
          requiresAuth: true,
          showSearch: true,
          permission: "users_view"
        },
      },
      {
        path: "/salaries",
        name: "salaries",
        component: () => import("@/views/pages/salaries/SalariesPage.vue"),
        meta: {
          title: "salariesPage",
          requiresAuth: true,
          permission: "employee_salaries_accrue"
        },
      },
      {
        path: "/users/:id",
        name: "UserView",
        component: UsersPage,
        meta: {
          title: "users",
          requiresAuth: true,
          showSearch: true,
          permission: "users_view"
        },
      },
      {
        path: "/org-structure",
        name: "org-structure",
        component: () => import("@/views/pages/departments/DepartmentPage.vue"),
        meta: {
          title: "orgStructure",
          requiresAuth: true,
          permission: "departments_view_all"
        },
      },
      {
        path: "/roles",
        name: "roles",
        component: RolesPage,
        meta: {
          title: "roles",
          requiresAuth: true,
          permission: "roles_view"
        },
      },
      {
        path: "/roles/:id",
        name: "RoleView",
        component: RolesPage,
        meta: {
          title: "roles",
          requiresAuth: true,
          permission: "roles_view"
        },
      },
      {
        path: "/companies",
        name: "companies",
        component: CompaniesPage,
        meta: {
          title: "companies",
          requiresAuth: true,
          permission: "companies_view"
        },
      },
      {
        path: "/holidays",
        name: "Holidays",
        component: CompanyHolidaysPage,
        meta: {
          title: "holidays",
          requiresAuth: true,
          permission: "holidays_view"
        },
      },
      {
        path: "/holidays/:id",
        name: "HolidayView",
        component: CompanyHolidaysPage,
        meta: {
          title: "holidays",
          requiresAuth: true,
          permission: "holidays_view"
        },
      },
      {
        path: "/production-calendar",
        name: "ProductionCalendar",
        component: CompanyProductionCalendarPage,
        meta: {
          title: "productionCalendar",
          requiresAuth: true,
          permission: "production_calendar_view"
        },
      },
      {
        path: "/production-calendar/:id",
        name: "ProductionCalendarView",
        component: CompanyProductionCalendarPage,
        meta: {
          title: "productionCalendar",
          requiresAuth: true,
          permission: "production_calendar_view"
        },
      },
      {
        path: "/products",
        name: "Products",
        component: ProductsPage,
        meta: {
          title: "products",
          requiresAuth: true,
          showSearch: true,
          permission: "products_view"
        },
      },
      {
        path: "/products/:id",
        name: "ProductView",
        component: ProductsPage,
        meta: {
          title: "products",
          requiresAuth: true,
          showSearch: true,
          permission: "products_view"
        },
      },
      {
        path: "/services",
        name: "Sevices",
        component: ServicesPage,
        meta: {
          title: "services",
          requiresAuth: true,
          showSearch: true,
          permission: "products_view"
        },
      },
      {
        path: "/services/:id",
        name: "ServiceView",
        component: ServicesPage,
        meta: {
          title: "services",
          requiresAuth: true,
          showSearch: true,
          permission: "products_view"
        },
      },
      {
        path: "/cash-registers",
        name: "Cash-Registers",
        component: CashRegistersPage,
        meta: {
          title: "cashRegisters",
          requiresAuth: true,
          permission: "cash_registers_view"
        },
      },
      {
        path: "/financial-accounts",
        name: "FinancialAccounts",
        component: FinancialAccountsPage,
        meta: {
          title: "financialAccounts",
          requiresAuth: true,
          permission: "financial_accounts_view"
        },
      },
      {
        path: "/journal-entries",
        name: "JournalEntries",
        component: JournalEntriesPage,
        meta: {
          title: "journalEntries",
          requiresAuth: true,
          showSearch: true,
          permission: "journal_entries_view"
        },
      },
      {
        path: "/journal-entries/create",
        redirect: { name: "JournalEntries", query: { create: "1" } },
      },
      {
        path: "/journal-entries/:id",
        name: "JournalEntryView",
        component: JournalEntryViewPage,
        meta: {
          title: "journalEntries",
          requiresAuth: true,
          permission: "journal_entries_view"
        },
      },
      {
        path: "/financial-accounts/:id",
        name: "FinancialAccountView",
        component: FinancialAccountViewPage,
        meta: {
          title: "financialAccounts",
          requiresAuth: true,
          permission: "financial_accounts_view"
        },
      },
      {
        path: "/mutual-settlements",
        name: "MutualSettlements",
        component: MutualSettlementsPage,
        meta: {
          title: "mutualSettlements",
          requiresAuth: true,
          showSearch: true,
          permission: "mutual_settlements_view"
        },
      },
      {
        path: "/reports",
        name: "Reports",
        component: ReportsPage,
        meta: {
          title: "reports",
          requiresAuth: true,
          permission: "reports_view"
        },
      },
      {
        path: "/reports/income-by-categories",
        name: "ReportIncomeByCategories",
        component: ReportByCategoriesPage,
        meta: {
          title: "incomesByCategory",
          requiresAuth: true,
          permission: "reports_view_by_categories",
          reportMode: "income"
        },
      },
      {
        path: "/reports/expense-by-categories",
        name: "ReportExpenseByCategories",
        component: ReportByCategoriesPage,
        meta: {
          title: "expensesByCategory",
          requiresAuth: true,
          permission: "reports_view_by_categories",
          reportMode: "expense"
        },
      },
      {
        path: "/reports/cashflow",
        name: "ReportCashflow",
        component: ReportCashflowPage,
        meta: {
          title: "ddsReport",
          requiresAuth: true,
          permission: "reports_view_by_categories"
        },
      },
      {
        path: "/reports/counterparties",
        name: "ReportCounterparties",
        component: ReportCounterpartiesPage,
        meta: {
          title: "counterpartiesReport",
          requiresAuth: true,
          permission: "reports_view_by_categories"
        },
      },
      {
        path: "/reports/orders",
        name: "ReportOrders",
        component: ReportSourceExecutionPage,
        meta: {
          title: "ordersReport",
          requiresAuth: true,
          permission: "reports_view_by_categories",
          sourceReportType: "orders"
        },
      },
      {
        path: "/reports/contracts",
        name: "ReportContracts",
        component: ReportSourceExecutionPage,
        meta: {
          title: "contractsReport",
          requiresAuth: true,
          permission: "reports_view_by_categories",
          sourceReportType: "contracts"
        },
      },
      {
        path: "/reports/plan-fact",
        name: "ReportPlanFact",
        component: ReportPlanFactBlueprintPage,
        meta: {
          title: "planFactBlueprint",
          requiresAuth: true,
          permission: "reports_view_by_categories"
        },
      },
      {
        path: "/settings/currency-history",
        name: "CurrencyHistory",
        component: CurrencyHistoryPage,
        meta: {
          title: "currencyHistory",
          requiresAuth: true,
          permissions: [
            "currency_history_view",
            "currency_history_view_all",
            "currency_history_view_own",
          ],
        },
      },
      {
        path: "/settings/currencies",
        name: "Currencies",
        component: CurrenciesPage,
        meta: {
          title: "currencies",
          requiresAuth: true,
          permissions: [
            "currencies_view",
            "currencies_view_all",
          ],
        },
      },
      {
        path: "/units",
        name: "UnitsSettings",
        component: UnitsPage,
        meta: {
          title: "unitsSettings",
          requiresAuth: true,
          permissions: ["units_view", "units_create", "units_update", "units_delete"],
        },
      },
      {
        path: "/settings/units",
        redirect: "/units",
      },
      {
        path: "/leaves",
        name: "Leaves",
        component: LeavesPage,
        meta: {
          title: "leaves",
          requiresAuth: true,
          permission: "leaves_view_all"
        },
      },
      {
        path: "/leaves/:id",
        name: "LeaveView",
        component: LeavesPage,
        meta: {
          title: "leaves",
          requiresAuth: true,
          permission: "leaves_view_all"
        },
      },
      {
        path: "/leave_types",
        name: "leave_types",
        component: LeaveTypesPage,
        meta: {
          title: "leaveTypes",
          requiresAuth: true,
          permission: "leave_types_view_all"
        },
      },
      {
        path: "/leave_types/:id",
        name: "LeaveTypeView",
        component: LeaveTypesPage,
        meta: {
          title: "leaveTypes",
          requiresAuth: true,
          permission: "leave_types_view_all"
        },
      },
      {
        path: "/simple-orders",
        name: "SimpleOrders",
        component: SimpleOrdersPage,
        meta: {
          title: "simpleOrders",
          requiresAuth: true,
          permission: "orders_simple_view",
          simpleMode: true,
        },
      },
      {
        path: "/simple-orders/create",
        name: "SimpleOrderCreate",
        component: SimpleOrderCreatePage,
        meta: {
          title: "createOrder",
          requiresAuth: true,
          permission: "orders_simple_create",
          simpleMode: true,
        },
      },
      {
        path: "/simple-orders/:id/edit",
        name: "SimpleOrderEdit",
        component: SimpleOrderCreatePage,
        meta: {
          title: "editOrder",
          requiresAuth: true,
          permission: "orders_simple_update",
          simpleMode: true,
        },
      },
    ],
  },
  {
    path: "/auth",
    name: "Auth",
    component: BlankLayout,
    redirect: "/auth",
    children: [
      {
        path: "/auth/login",
        name: "Login",
        component: LoginPage,
      },
    ],
  },
  {
    path: "/maintenance",
    name: "Maintenance",
    component: BlankLayout,
    children: [
      {
        path: "",
        name: "MaintenancePage",
        component: MaintenancePage,
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: BlankLayout,
    children: [
      {
        path: "",
        name: "NotFoundPage",
        component: NotFoundPage,
        meta: { title: "pageNotFoundTitle" },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) {
      if (document.querySelector(to.hash)) return { el: to.hash };
      return { top: 0 };
    }
    return { top: 0 };
  },
});

router.beforeEach(async (to, from, next) => {
  if (to.path === '/warehouses' && to.hash) {
    const target = WAREHOUSE_HASH_REDIRECTS[to.hash.replace(/^#/, '')];
    if (target) {
      return next({ path: target, replace: true });
    }
  }

  const loggedIn = Boolean(store.state.user);
  if (to.meta.requiresAuth) {
    if (!loggedIn) {
      return next("/auth/login");
    }
  }

  if (to.name === "Login" && loggedIn) {
    return next("/");
  }

  const routePermissions =
    to.meta.permissions?.length > 0
      ? to.meta.permissions
      : to.meta.permission
        ? [to.meta.permission]
        : null;

  if (routePermissions) {
    if (
      !store.state.permissionsLoaded ||
      (store.state.permissionsLoaded && store.state.permissions?.length === 0)
    ) {
      await new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 100;
        const checkPermissions = () => {
          const hasPermissions =
            store.state.permissionsLoaded &&
            store.state.permissions &&
            store.state.permissions.length > 0;
          if (hasPermissions) {
            resolve();
          } else if (attempts >= maxAttempts) {
            resolve();
          } else {
            attempts++;
            setTimeout(checkPermissions, 50);
          }
        };
        checkPermissions();
      });
    }

    const allowed = routePermissions.some((p) => store.getters.hasPermission(p));
    if (!allowed) {
      return next({ path: "/" });
    }
  }

  if (
    !to.meta.showSearch ||
    (from.meta?.title && to.meta?.title && from.meta.title !== to.meta.title)
  ) {
    store.dispatch("setSearchQuery", "");
  }

  next();
});

export default router;

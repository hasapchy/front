import { createRouter, createWebHistory } from "vue-router";
import store from "@/store";
import TokenUtils from "@/utils/tokenUtils";

import SidebarLayout from "@/views/layouts/SidebarLayout.vue";
import BlankLayout from "@/views/layouts/BlankLayout.vue";
import BasementLayout from "@/views/layouts/BasementLayout.vue";

import LoginPage from "@/views/pages/auth/LoginPage.vue";
import HomePage from "@/views/pages/home/HomePage.vue";
import WarehousesPage from "@/views/pages/warehouses/WarehousesPage.vue";
import AdminWarehousesPage from "@/views/pages/admin/warehouses/AdminWarehousesPage.vue";
import CategoriesPage from "@/views/pages/categories/CategoriesPage.vue";
import ProductsPage from "@/views/pages/products/ProductsPage.vue";
import ClientsPage from "@/views/pages/clients/ClientsPage.vue";
import CashRegistersPage from "@/views/pages/cash_registers/CashRegistersPage.vue";
import ProjectsPage from "@/views/pages/projects/ProjectsPage.vue";
import ServicesPage from "@/views/pages/products/ServicesPage.vue";
import TransactionsPage from "@/views/pages/transactions/TransactionsPage.vue";
import TransfersPage from "@/views/pages/transfers/TransfersPage.vue";
import SalesPage from "@/views/pages/sales/SalesPage.vue";
import OrdersPage from "@/views/pages/orders/OrdersPage.vue";
import OrderStatusesPage from "@/views/pages/orders/OrderStatusesPage.vue";
import OrderStatusCategoriesPage from "@/views/pages/orders/OrderStatusCategoriesPage.vue";
import TransactionCategoriesPage from "@/views/pages/transactions/TransactionCategoriesPage.vue";
import ProjectStatusesPage from "@/views/pages/projects/ProjectStatusesPage.vue";
import InvoicesPage from "@/views/pages/invoices/InvoicesPage.vue";
import UsersPage from "@/views/pages/users/UsersPage.vue";
import RolesPage from "@/views/pages/roles/RolesPage.vue";
import CompaniesPage from "@/views/pages/companies/CompaniesPage.vue";
import CurrencyHistoryPage from "@/views/pages/currencies/CurrencyHistoryPage.vue";
import LeavesPage from "@/views/pages/leaves/LeavesPage.vue";
import LeaveTypesPage from "@/views/pages/leave_types/LeaveTypesPage.vue";
import MessengerPage from "@/views/pages/messenger/MessengerPage.vue";

// Basement pages
import BasementOrdersPage from "@/views/pages/basement/BasementOrdersPage.vue";
import BasementOrderCreatePage from "@/views/pages/basement/BasementOrderCreatePage.vue";
import MutualSettlementsPage from "@/views/pages/mutual_settlements/MutualSettlementsPage.vue";
const routes = [
  {
    path: "/",
    name: "Public",
    component: SidebarLayout,
    children: [
      {
        path: "/",
        name: "Home",
        component: HomePage,
        meta: { title: "home", requiresAuth: true },
      },
      {
        path: "/messenger",
        name: "Messenger",
        component: MessengerPage,
        meta: {
          title: "messenger",
          requiresAuth: true,
          permission: "chats_view",
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
        path: "/tasks",
        name: "Tasks",
        component: () => import("@/views/pages/tasks/TasksPage.vue"),  
        meta: {
          title: "tasks",
          requiresAuth: true,
          permission: "tasks_view_all",
          binded: [
            {
              name: "taskStatuses",
              path: "/task_statuses",
            },
          ],
        },
      },
      {
        path: "/task_statuses",
        name: "task_statuses",
        component: () => import("@/views/pages/tasks/TaskStatusesPage.vue"),
        meta: {
          title: "taskStatuses",
          requiresAuth: true,
          permission: "task_statuses_view",
          binded: [
            {
              name: "tasks",
              path: "/tasks",
            },
          ],
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
          permission: "orders_view",
          binded: [
            {
              name: "orderStatuses",
              path: "/order_statuses",
            },
            {
              name: "orderStatusCategories",
              path: "/order_status_categories",
            },
          ],
        },
      },
      {
        path: "/order_statuses",
        name: "order_statuses",
        component: OrderStatusesPage,
        meta: {
          title: "orderStatuses",
          requiresAuth: true,
          permission: "order_statuses_view",
          binded: [
            {
              name: "orders",
              path: "/orders",
            },
            {
              name: "orderStatusCategories",
              path: "/order_status_categories",
            },
          ],
        },
      },
      {
        path: "/order_status_categories",
        name: "order_status_categories",
        component: OrderStatusCategoriesPage,
        meta: {
          title: "orderStatusCategories",
          requiresAuth: true,
          permission: "order_statuscategories_view",
          binded: [
            {
              name: "orders",
              path: "/orders",
            },
            {
              name: "orderStatuses",
              path: "/order_statuses",
            },
          ],
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
          permission: "invoices_view",
          binded: [
            {
              name: "finance",
              path: "/transactions",
            },
            {
              name: "transfers",
              path: "/transfers",
            },
            {
              name: "cashRegisters",
              path: "/cash-registers",
            },
            {
              name: "transactionCategories",
              path: "/transaction_categories",
            },
          ],
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
          permission: "transactions_view",
          binded: [
            {
              name: "mutualSettlements",
              path: "/mutual-settlements",
            },
            {
              name: "transfers",
              path: "/transfers",
            },
            {
              name: "cashRegisters",
              path: "/cash-registers",
            },
            {
              name: "invoices",
              path: "/invoices",
            },
            {
              name: "transactionCategories",
              path: "/transaction_categories",
            },
          ],
        },
      },
      {
        path: "/transfers",
        name: "Transfers",
        component: TransfersPage,
        meta: {
          title: "transfers",
          requiresAuth: true,
          permission: "transfers_view",
          binded: [
            {
              name: "mutualSettlements",
              path: "/mutual-settlements",
            },
            {
              name: "finance",
              path: "/transactions",
            },
            {
              name: "cashRegisters",
              path: "/cash-registers",
            },
            {
              name: "invoices",
              path: "/invoices",
            },
            {
              name: "transactionCategories",
              path: "/transaction_categories",
            },
          ],
        },
      },
      {
        path: "/warehouses",
        name: "Warehouses",
        component: WarehousesPage,
        meta: {
          title: "stock",
          requiresAuth: true,
          showSearch: true,
          permission: "warehouse_stocks_view",
          binded: [
            {
              name: "warehouses",
              path: "/admin/warehouses",
            },
          ],
        },
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
        path: "/projects",
        name: "Projects",
        component: ProjectsPage,
        meta: {
          title: "projects",
          requiresAuth: true,
          permission: "projects_view",
          binded: [
            {
              name: "projectStatuses",
              path: "/project_statuses",
            },
          ],
        },
      },
      {
        path: "/project_statuses",
        name: "project_statuses",
        component: ProjectStatusesPage,
        meta: {
          title: "projectStatuses",
          requiresAuth: true,
          permission: "project_statuses_view",
          binded: [
            {
              name: "projects",
              path: "/projects",
            },
          ],
        },
      },
      {
        path: "/admin/warehouses",
        name: "Admin-Warehouses",
        component: AdminWarehousesPage,
        meta: {
          title: "warehouses",
          requiresAuth: true,
          permission: "warehouses_view",
          binded: [
            {
              name: "stock",
              path: "/warehouses",
            },
          ],
        },
      },
      {
        path: "/categories",
        name: "Categories",
        component: CategoriesPage,
        meta: {
          title: "categories",
          requiresAuth: true,
          permission: "categories_view",
          binded: [
            {
              name: "products",
              path: "/products",
            },
            {
              name: "services",
              path: "/services",
            },
          ],
        },
      },
      {
        path: "/transaction_categories",
        name: "transaction_categories",
        component: TransactionCategoriesPage,
        meta: {
          title: "transactionCategories",
          requiresAuth: true,
          permission: "transaction_categories_view",
          binded: [
            {
              name: "finance",
              path: "/transactions",
            },
            {
              name: "mutualSettlements",
              path: "/mutual-settlements",
            },
            {
              name: "transfers",
              path: "/transfers",
            },
            {
              name: "invoices",
              path: "/invoices",
            },
          ],
        },
      },
      {
        path: "/users",
        name: "users",
        component: UsersPage,
        meta: { title: "users", requiresAuth: true, permission: "users_view" },
      },
      {
        path: "/roles",
        name: "roles",
        component: RolesPage,
        meta: { title: "roles", requiresAuth: true, permission: "roles_view" },
      },
      {
        path: "/companies",
        name: "companies",
        component: CompaniesPage,
        meta: {
          title: "companies",
          requiresAuth: true,
          permission: "companies_view",
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
          permission: "products_view",
          binded: [
            {
              name: "services",
              path: "/services",
            },
            {
              name: "categories",
              path: "/categories",
            },
          ],
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
          permission: "products_view",
          binded: [
            {
              name: "products",
              path: "/products",
            },
            {
              name: "categories",
              path: "/categories",
            },
          ],
        },
      },
      {
        path: "/cash-registers",
        name: "Cash-Registers",
        component: CashRegistersPage,
        meta: {
          title: "cashRegisters",
          requiresAuth: true,
          permission: "cash_registers_view",
          binded: [
            {
              name: "mutualSettlements",
              path: "/mutual-settlements",
            },
            {
              name: "transfers",
              path: "/transfers",
            },
            {
              name: "finance",
              path: "/transactions",
            },
            {
              name: "invoices",
              path: "/invoices",
            },
          ],
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
          permission: "mutual_settlements_view",
          binded: [
            {
              name: "transfers",
              path: "/transfers",
            },
            {
              name: "cashRegisters",
              path: "/cash-registers",
            },
            {
              name: "finance",
              path: "/transactions",
            },
            {
              name: "invoices",
              path: "/invoices",
            },
            {
              name: "transactionCategories",
              path: "/transaction_categories",
            },
          ],
        },
      },
      {
        path: "/settings/currency-history",
        name: "CurrencyHistory",
        component: CurrencyHistoryPage,
        meta: {
          title: "currencyHistory",
          requiresAuth: true,
          permission: "currency_history_view",
        },
      },
      {
        path: "/leaves",
        name: "Leaves",
        component: LeavesPage,
        meta: {
          title: "leaves",
          requiresAuth: true,
          permission: "leaves_view_all",
          binded: [
            {
              name: "leaveTypes",
              path: "/leave_types",
            },
          ],
        },
      },
      {
        path: "/leave_types",
        name: "leave_types",
        component: LeaveTypesPage,
        meta: {
          title: "leaveTypes",
          requiresAuth: true,
          permission: "leave_types_view_all",
          binded: [
            {
              name: "leaves",
              path: "/leaves",
            },
          ],
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

  // Basement worker routes
  {
    path: "/basement",
    component: BasementLayout,
    meta: { requiresBasementAuth: true },
    children: [
      {
        path: "orders",
        name: "BasementOrders",
        component: BasementOrdersPage,
        meta: { title: "orders" },
      },
      {
        path: "orders/create",
        name: "BasementOrderCreate",
        component: BasementOrderCreatePage,
        meta: { title: "createOrder" },
      },
      {
        path: "orders/:id/edit",
        name: "BasementOrderEdit",
        component: BasementOrderCreatePage,
        meta: { title: "editOrder" },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const token = TokenUtils.getToken();
  const user = localStorage.getItem("user");

  let userData = null;
  let isBasementWorker = false;
  let isAdmin = false;

  // Парсим данные пользователя
  try {
    if (user) {
      userData = JSON.parse(user);
      isBasementWorker =
        userData.roles && userData.roles.includes("basement_worker");
      isAdmin =
        userData.isAdmin === true ||
        (userData.roles && userData.roles.includes("admin"));
    }
  } catch {
    userData = null;
  }

  // Проверка для basement маршрутов
  if (to.meta.requiresBasementAuth) {
    if (!token) {
      return next("/auth/login");
    }

    // Только basement_worker или admin могут попасть в basement
    if (!isBasementWorker && !isAdmin) {
      return next("/auth/login");
    }

    // Продолжаем к basement маршруту
    return next();
  }

  // Проверка для обычных маршрутов (основная система)
  if (to.meta.requiresAuth) {
    if (!token) {
      return next("/auth/login");
    }

    // ВАЖНО: Если пользователь ТОЛЬКО basement_worker (не admin), блокируем доступ к основной системе
    if (isBasementWorker && !isAdmin) {
      return next("/basement/orders");
    }
  }

  // Если пользователь пытается попасть на страницу логина, но уже авторизован
  if (to.name === "Login" && token) {
    if (isBasementWorker && !isAdmin) {
      return next("/basement/orders");
    }
    return next("/");
  }

  if (to.meta.permission) {
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

    if (to.meta.permission === "mutual_settlements_view") {
      if (store.getters.hasPermission(to.meta.permission)) {
        return next();
      }
      return next({ path: "/" });
    } else {
      if (!store.getters.hasPermission(to.meta.permission)) {
        return next({ path: "/" });
      }
    }
  }

  if (!to.meta.showSearch) {
    store.dispatch("setSearchQuery", "");
  }

  next();
});

export default router;

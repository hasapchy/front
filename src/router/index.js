import { createRouter, createWebHistory } from "vue-router";
import store from "@/store";

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
import OrderCategoriesPage from "@/views/pages/orders/OrderCategoriesPage.vue";
import OrderAdditionalFieldsPage from "@/views/pages/orders/OrderAdditionalFieldsPage.vue";
import TransactionCategoriesPage from "@/views/pages/transactions/TransactionCategoriesPage.vue";
import ProjectStatusesPage from "@/views/pages/projects/ProjectStatusesPage.vue";
import InvoicesPage from "@/views/pages/invoices/InvoicesPage.vue";
import UsersPage from "@/views/pages/users/UsersPage.vue";
import RolesPage from "@/views/pages/roles/RolesPage.vue";
import CompaniesPage from "@/views/pages/companies/CompaniesPage.vue";
import CurrencyHistoryPage from "@/views/pages/currencies/CurrencyHistoryPage.vue";

// Basement pages
import BasementLoginPage from "@/views/pages/basement/BasementLoginPage.vue";
import BasementOrdersPage from "@/views/pages/basement/BasementOrdersPage.vue";
import BasementOrderCreatePage from "@/views/pages/basement/BasementOrderCreatePage.vue";
import MutualSettlementsPage from "@/views/pages/mutual_settlements/MutualSettlementsPage.vue";
const routes = [
  {
    path: "/",
    name: "Public",
    component: SidebarLayout,
    redirect: "/",
    children: [
      {
        path: "/",
        name: "Home",
        component: HomePage,
        meta: { title: "home", requiresAuth: true },
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
        path: "/orders",
        name: "Orders",
        component: OrdersPage,
        meta: { title: "orders", requiresAuth: true, showSearch: true },
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
          ],
        },
      },
      {
        path: "/warehouses",
        name: "Warehouses",
        component: WarehousesPage,
        meta: { title: "warehouses", requiresAuth: true, showSearch: true },
      },
      {
        path: "/clients",
        name: "Clients",
        component: ClientsPage,
        meta: { title: "clients", requiresAuth: true, showSearch: true },
      },
      {
        path: "/projects",
        name: "Projects",
        component: ProjectsPage,
        meta: { title: "projects", requiresAuth: true },
      },
      {
        path: "/project_statuses",
        name: "project_statuses",
        component: ProjectStatusesPage,
        meta: { 
          title: "projectStatuses", 
          requiresAuth: true,
          permission: "order_statuscategories_view",
          binded: [
            {
              name: "categories",
              path: "/categories",
            },
            {
              name: "orderStatuses",
              path: "/order_statuses",
            },
            {
              name: "transactionCategories",
              path: "/transaction_categories",
            },
            {
              name: "orderAdditionalFields",
              path: "/order_additional_fields",
            },
          ],
        },
      },
      {
        path: "/admin/warehouses",
        name: "Admin-Warehouses",
        component: AdminWarehousesPage,
        meta: { title: "warehouses", requiresAuth: true },
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
              name: "orderStatuses",
              path: "/order_statuses",
            },
            {
              name: "projectStatuses", 
              path: "/project_statuses",
            },
            {
              name: "transactionCategories",
              path: "/transaction_categories",
            },
            {
              name: "orderAdditionalFields",
              path: "/order_additional_fields",
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
              name: "orderStatusCategories",
              path: "/order_status_categories",
            },
            {
              name: "categories",
              path: "/categories",
            },
            {
              name: "projectStatuses", 
              path: "/project_statuses",
            },
            {
              name: "transactionCategories",
              path: "/transaction_categories",
            },
            {
              name: "orderAdditionalFields",
              path: "/order_additional_fields",
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
              name: "orderStatuses",
              path: "/order_statuses",
            },
            {
              name: "categories",
              path: "/categories",
            },
            {
              name: "projectStatuses", 
              path: "/project_statuses",
            },
            {
              name: "transactionCategories",
              path: "/transaction_categories",
            },
            {
              name: "orderAdditionalFields",
              path: "/order_additional_fields",
            },
          ],
        },
      },
      {
        path: "/order_categories",
        name: "order_categories",
        component: OrderCategoriesPage,
        meta: { title: "orderTypes", requiresAuth: true },
      },
      {
        path: "/order_additional_fields",
        name: "order_additional_fields",
        component: OrderAdditionalFieldsPage,
        meta: { 
          title: "orderAdditionalFields", 
          requiresAuth: true,
          permission: "order_categories_view",
          binded: [
            {
              name: "categories",
              path: "/categories",
            },
            {
              name: "orderStatuses",
              path: "/order_statuses",
            },
            {
              name: "projectStatuses", 
              path: "/project_statuses",
            },
            {
              name: "transactionCategories",
              path: "/transaction_categories",
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
              name: "categories",
              path: "/categories",
            },
            {
              name: "orderStatuses",
              path: "/order_statuses",
            },
            {
              name: "projectStatuses", 
              path: "/project_statuses",
            },
            {
              name: "orderAdditionalFields",
              path: "/order_additional_fields",
            },
          ],
        },
      },
      {
        path: "/users",
        name: "users",
        component: UsersPage,
        meta: { title: "users", requiresAuth: true },
      },
      {
        path: "/roles",
        name: "roles",
        component: RolesPage,
        meta: { title: "roles", requiresAuth: true },
      },
      {
        path: "/companies",
        name: "companies",
        component: CompaniesPage,
        meta: { title: "companies", requiresAuth: true },
      },
      {
        path: "/products",
        name: "Products",
        component: ProductsPage,
        meta: {
          title: "products",
          requiresAuth: true,
          showSearch: true,
          binded: [
            {
              name: "services",
              path: "/services",
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
          binded: [
            {
              name: "products",
              path: "/products",
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
          ],
        },
      },
      {
        path: "/settings/performance",
        name: "PerformanceSettings",
        component: () => import("@/views/pages/settings/PerformanceMonitorPage.vue"),
        meta: { 
          title: "performanceMonitor", 
          requiresAuth: true
        },
      },
      {
        path: "/settings/currency-history",
        name: "CurrencyHistory",
        component: CurrencyHistoryPage,
        meta: { 
          title: "currencyHistory", 
          requiresAuth: true,
          permission: "currency_history_view"
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
    path: "/basement/login",
    name: "BasementLogin",
    component: BasementLoginPage,
    meta: { title: "Вход в подвал" }
  },
  {
    path: "/basement",
    component: BasementLayout,
    meta: { requiresBasementAuth: true },
    children: [
      {
        path: "orders",
        name: "BasementOrders",
        component: BasementOrdersPage,
        meta: { title: "Заказы" }
      },
      {
        path: "orders/create",
        name: "BasementOrderCreate",
        component: BasementOrderCreatePage,
        meta: { title: "Создать заказ" }
      },
      {
        path: "orders/:id/edit",
        name: "BasementOrderEdit",
        component: BasementOrderCreatePage,
        meta: { title: "Редактировать заказ" }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  let userData = null;
  let isBasementWorker = false;
  let isAdmin = false;

  // Парсим данные пользователя
  try {
    if (user) {
      userData = JSON.parse(user);
      isBasementWorker = userData.roles && userData.roles.includes('basement_worker');
      isAdmin = userData.roles && userData.roles.includes('admin');
    }
  } catch {
    userData = null;
  }

  // Проверка для basement маршрутов
  if (to.meta.requiresBasementAuth) {
    if (!token) {
      return next("/basement/login");
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
  if (to.name === 'Login' && token) {
    if (isBasementWorker && !isAdmin) {
      return next("/basement/orders");
    }
    return next("/");
  }

  if (to.name === 'BasementLogin' && token) {
    if (isBasementWorker || isAdmin) {
      return next("/basement/orders");
    }
    return next("/");
  }

  const userPermissions = store.getters["permissions"];

  if (to.meta.permission && !userPermissions.includes(to.meta.permission)) {
    return next({ path: "/" });
  }

  if (!to.meta.showSearch) {
    store.dispatch("setSearchQuery", "");
  }

  next();
});

export default router;

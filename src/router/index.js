import { createRouter, createWebHistory } from "vue-router";
import store from "@/store";

import SidebarLayout from "@/views/layouts/SidebarLayout.vue";
import BlankLayout from "@/views/layouts/BlankLayout.vue";

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
import OrderCategoriesPage from "@/views/pages/orders/OrderCategoriesPage.vue";
import OrderAdditionalFieldsPage from "@/views/pages/orders/OrderAdditionalFieldsPage.vue";
import InvoicesPage from "@/views/pages/invoices/InvoicesPage.vue";
import UsersPage from "@/views/pages/users/UsersPage.vue";
import CompaniesPage from "@/views/pages/companies/CompaniesPage.vue";
import SystemSettingsPage from "@/views/pages/settings/SystemSettingsPage.vue";
import CurrencyHistoryPage from "@/views/pages/currencies/CurrencyHistoryPage.vue";

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
          binded: [
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
        path: "/transfers",
        name: "Transfers",
        component: TransfersPage,
        meta: {
          title: "transfers",
          requiresAuth: true,
          binded: [
            {
              name: "finance",
              path: "/transactions",
            },
            {
              name: "cashRegisters",
              path: "/cash-registers",
            },
          ],
        },
      },
      {
        path: "/warehouses",
        name: "Warehouses",
        component: WarehousesPage,
        meta: { title: "warehouses", requiresAuth: true },
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
        path: "/admin/warehouses",
        name: "Admin-Warehouses",
        component: AdminWarehousesPage,
        meta: { title: "warehouses", requiresAuth: true },
      },
      {
        path: "/categories",
        name: "Categories",
        component: CategoriesPage,
        meta: { title: "categories", requiresAuth: true },
      },
      {
        path: "/order_statuses",
        name: "order_statuses",
        component: OrderStatusesPage,
        meta: { title: "orderStatuses", requiresAuth: true },
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
        meta: { title: "orderAdditionalFields", requiresAuth: true },
      },
      {
        path: "/users",
        name: "users",
        component: UsersPage,
        meta: { title: "users", requiresAuth: true },
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
              name: "transfers",
              path: "/transfers",
            },
            {
              name: "finance",
              path: "/transactions",
            },
          ],
        },
      },
      {
        path: "/settings",
        name: "Settings",
        component: SystemSettingsPage,
        meta: { 
          title: "systemSettings", 
          requiresAuth: true,
          permission: "system_settings_view"
        },
      },
      {
        path: "/settings/performance",
        name: "PerformanceSettings",
        component: SystemSettingsPage,
        meta: { 
          title: "performanceMonitor", 
          requiresAuth: true,
          permission: "system_settings_view"
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
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem("token");

  if (to.meta.requiresAuth && !token) {
    return next("/auth/login");
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

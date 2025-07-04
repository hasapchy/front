import { createRouter, createWebHistory } from "vue-router";
import store from "@/store";

import SidebarLayout from "@/views/layouts/SidebarLayout.vue";
import BlankLayout from "@/views/layouts/BlankLayout.vue";

import LoginPage from "@/views/pages/auth/LoginPage.vue";
import HomePage from "@/views/pages/home/HomePage.vue";
import WarehousesPage from "@/views/pages/warehouses/WarehousesPage.vue";
import AppComponentsPage from "@/views/pages/app/AppComponentsPage.vue";
import AdminWarehousesPage from "@/views/pages/admin/warehouses/AdminWarehousesPage.vue";
import AdminCategoriesPage from "@/views/pages/admin/categories/AdminCategoriesPage.vue";
import AdminProductsPage from "@/views/pages/admin/products/AdminProductsPage.vue";
import ClientsPage from "@/views/pages/clients/ClientsPage.vue";
import AdminCashRegistersPage from "@/views/pages/admin/cash_registers/AdminCashRegistersPage.vue";
import ProjectsPage from "@/views/pages/projects/ProjectsPage.vue";
import AdminServicesPage from "@/views/pages/admin/products/AdminServicesPage.vue";
import TransactionsPage from "@/views/pages/transactions/TransactionsPage.vue";
import TransfersPage from "@/views/pages/transfers/TransfersPage.vue";
import SalesPage from "@/views/pages/sales/SalesPage.vue";
import OrdersPage from "@/views/pages/orders/OrdersPage.vue";

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
        meta: { title: "Моя компания", requiresAuth: true },
      },
      {
        path: "/sales",
        name: "Sales",
        component: SalesPage,
        meta: { title: "Продажи", requiresAuth: true, showSearch: true },
      },
       {
        path: "/orders",
        name: "Orders",
        component: OrdersPage,
        meta: { title: "Заказы", requiresAuth: true, showSearch: true },
      },
      {
        path: "/orders",
        name: "Orders",
        component: OrdersPage,
        meta: { title: "Заказы", requiresAuth: true, showSearch: true },
      },
      {
        path: "/transactions",
        name: "Transactions",
        component: TransactionsPage,
        meta: {
          title: "Финансы",
          requiresAuth: true,
          showSearch: true,
          binded: [
            {
              name: "Трансферы",
              path: "/transfers",
            },
            {
              name: "Кассы",
              path: "/admin/cash-registers",
            },
          ],
        },
      },
      {
        path: "/transfers",
        name: "Transfers",
        component: TransfersPage,
        meta: {
          title: "Трансферы",
          requiresAuth: true,
          binded: [
            {
              name: "Финансы",
              path: "/transactions",
            },
            {
              name: "Кассы",
              path: "/admin/cash-registers",
            },
          ],
        },
      },
      {
        path: "/warehouses",
        name: "Warehouses",
        component: WarehousesPage,
        meta: { title: "Склады", requiresAuth: true },
      },
      {
        path: "/clients",
        name: "Clients",
        component: ClientsPage,
        meta: { title: "Клиенты", requiresAuth: true, showSearch: true },
      },
      {
        path: "/projects",
        name: "Projects",
        component: ProjectsPage,
        meta: { title: "Проекты", requiresAuth: true },
      },
      // {
      //   path: "/components",
      //   name: "Components",
      //   component: AppComponentsPage,
      //   meta: { title: "Компоненты", requiresAuth: true },
      // },
      {
        path: "/admin/warehouses",
        name: "Admin-Warehouses",
        component: AdminWarehousesPage,
        meta: { title: "Склады", requiresAuth: true },
      },
      {
        path: "/admin/categories",
        name: "Admin-Categories",
        component: AdminCategoriesPage,
        meta: { title: "Категории", requiresAuth: true },
      },
      {
        path: "/admin/products",
        name: "Admin-Products",
        component: AdminProductsPage,
        meta: {
          title: "Товары",
          requiresAuth: true,
          binded: [
            {
              name: "Услуги",
              path: "/admin/services",
            },
          ],
        },
      },
      {
        path: "/admin/services",
        name: "Admin-Sevices",
        component: AdminServicesPage,
        meta: {
          title: "Услуги",
          requiresAuth: true,
          binded: [
            {
              name: "Товары",
              path: "/admin/products",
            },
          ],
        },
      },
      {
        path: "/admin/cash-registers",
        name: "Admin-Cash-Registers",
        component: AdminCashRegistersPage,
        meta: {
          title: "Кассы",
          requiresAuth: true,
          binded: [
            {
              name: "Трансферы",
              path: "/transfers",
            },
            {
              name: "Финансы",
              path: "/transactions",
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
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem("token");
  if (to.meta.requiresAuth && !token) {
    next("/auth/login");
  } else {
    if (!to.meta.showSearch) {
      store.dispatch("setSearchQuery", "");
    }
    next();
  }
});

export default router;

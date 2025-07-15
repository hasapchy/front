import { createRouter, createWebHistory } from "vue-router";
import store from "@/store";

import SidebarLayout from "@/views/layouts/SidebarLayout.vue";
import BlankLayout from "@/views/layouts/BlankLayout.vue";

import LoginPage from "@/views/pages/auth/LoginPage.vue";
import HomePage from "@/views/pages/home/HomePage.vue";
import WarehousesPage from "@/views/pages/warehouses/WarehousesPage.vue";
import AppComponentsPage from "@/views/pages/app/AppComponentsPage.vue";
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
          title: "Трансферы",
          requiresAuth: true,
          binded: [
            {
              name: "Финансы",
              path: "/transactions",
            },
            {
              name: "Кассы",
              path: "cash-registers",
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
        path: "/categories",
        name: "Categories",
        component: CategoriesPage,
        meta: { title: "Категории", requiresAuth: true },
      },
      {
        path: "/order_statuses",
        name: "order_statuses",
        component: OrderStatusesPage,
        meta: { title: "Статусы заказов", requiresAuth: true },
      },
      {
        path: "/order_categories",
        name: "order_categories",
        component: OrderCategoriesPage,
        meta: { title: "Типы заказов", requiresAuth: true },
      },
      {
        path: "/products",
        name: "Products",
        component: ProductsPage,
        meta: {
          title: "Товары",
          requiresAuth: true,
          binded: [
            {
              name: "Услуги",
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
          title: "Услуги",
          requiresAuth: true,
          binded: [
            {
              name: "Товары",
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

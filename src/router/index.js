import { createRouter, createWebHistory } from "vue-router";

import SidebarLayout from "@/views/layouts/SidebarLayout.vue";
import BlankLayout from "@/views/layouts/BlankLayout.vue";

import LoginPage from "@/views/pages/auth/LoginPage.vue";
import HomePage from "@/views/pages/home/HomePage.vue";
import WarehousesPage from "@/views/pages/warehouses/WarehousesPage.vue";
import AppComponentsPage from "@/views/pages/app/AppComponentsPage.vue";
import AdminWarehousesPage from "@/views/pages/admin/warehouses/AdminWarehousesPage.vue";
import AdminCategoriesPage from "@/views/pages/admin/categories/AdminCategoriesPage.vue";
import AdminProductsPage from "@/views/pages/admin/products/AdminProductsPage.vue";

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
                meta: { title: 'Моя компания', requiresAuth: true }
            },
            {
                path: "/warehouses",
                name: "Warehouses",
                component: WarehousesPage,
                meta: { title: 'Склады', requiresAuth: true }
            },
            {
                path: "/components",
                name: "Components",
                component: AppComponentsPage,
                meta: { title: 'Компоненты', requiresAuth: true }
            },
            {
                path: "/admin/warehouses",
                name: "Admin-Warehouses",
                component: AdminWarehousesPage,
                meta: { title: 'Склады', requiresAuth: true }
            },
            {
                path: "/admin/categories",
                name: "Admin-Categories",
                component: AdminCategoriesPage,
                meta: { title: 'Категории', requiresAuth: true }
            },
            {
                path: "/admin/products",
                name: "Admin-Products",
                component: AdminProductsPage,
                meta: { title: 'Товары', requiresAuth: true }
            },
        ]
    },
    {
        path: "/auth",
        name: "Auth",
        component: BlankLayout,
        redirect: '/auth',
        children: [
            {
                path: "/auth/login",
                name: "Login",
                component: LoginPage
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
});

// Проверяем авторизацию перед каждой навигацией
router.beforeEach(async (to, from, next) => {
    
    const token = localStorage.getItem('token');
    if (to.meta.requiresAuth && !token) {
        next('/auth/login'); // Если нет токена, отправляем на логин
    } else {
        next();
    }
});

export default router;
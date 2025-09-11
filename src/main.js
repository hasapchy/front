import "./assets/main.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

// Настройка часового пояса UTC+5 по умолчанию
const originalDate = window.Date;
window.Date = function(...args) {
  if (args.length === 0) {
    // new Date() - возвращаем текущее время в UTC+5
    const now = new originalDate();
    return new originalDate(now.getTime() + (5 * 60 * 60 * 1000));
  }
  return new originalDate(...args);
};
Object.setPrototypeOf(window.Date, originalDate);
Object.defineProperty(window.Date, 'prototype', { value: originalDate.prototype, writable: false });
Object.getOwnPropertyNames(originalDate).forEach(name => {
  if (name !== 'length' && name !== 'name' && name !== 'prototype') {
    window.Date[name] = originalDate[name];
  }
});

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import i18n from "./i18n";
import AuthController from "./api/AuthController";
import { setStore } from "./store/storeManager";

async function bootstrapApp() {
  const token = localStorage.getItem("token");

  if (token) {
    try {
      const user = await AuthController.getUser();
      store.dispatch("setUser", user);
      store.dispatch("setPermissions", user.permissions);
    } catch (e) {
      console.error("Ошибка при загрузке пользователя:", e);
      localStorage.removeItem("token");
    }
  }

  // Инициализируем storeManager
  setStore(store);

  createApp(App).use(router).use(store).use(i18n).mount("#app");
}

bootstrapApp();

import "./assets/main.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

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

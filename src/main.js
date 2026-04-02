import "./assets/main.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "vue3-toastify/dist/index.css";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import i18n from "./i18n";
import Vue3Toastify from "vue3-toastify";
import { setStore } from "./store/storeManager";
import soundManager from "./utils/soundUtils";
import SpinnerIcon from "./views/components/app/SpinnerIcon.vue";
import { formatNumber, formatCurrency, getStepForDecimals, formatNumberWithRounding, formatCurrencyWithRounding } from "./utils/numberUtils";
import * as browserLocalStorageUi from "./utils/browserLocalStorageUi";

async function bootstrapApp() {
  store.commit("SET_PERMISSIONS_LOADED", false);
  store.dispatch("setPermissions", []);

  // Инициализируем storeManager
  setStore(store);
  
  // Инициализируем soundManager с store
  soundManager.setStore(store);

  const app = createApp(App);
  app.component("SpinnerIcon", SpinnerIcon);
  app.config.globalProperties.$storageUi = browserLocalStorageUi;

  app.config.errorHandler = (err, instance, info) => {
    console.error("Vue error:", err, info, instance);
    try {
      store.dispatch("showNotification", {
        title: i18n.global.t("error"),
        subtitle: err?.message ?? String(err),
        isDanger: true,
      });
    } catch (_) {
      console.error("Error handler failed:", _);
    }
  };

  app.config.globalProperties.$formatNumber = formatNumber;
  app.config.globalProperties.$formatCurrency = formatCurrency;
  app.config.globalProperties.$getStepForDecimals = getStepForDecimals;
  
  app.use(router).use(store).use(i18n).use(Vue3Toastify, {
    autoClose: 10000,
    position: "top-right",
    transition: "bounce",
    hideProgressBar: false,
    pauseOnHover: true,
    closeOnClick: true,
    newestOnTop: true,
    limit: 5,
    clearOnUrlChange: false,
  });

  // Добавляем глобальные методы с доступом к store
  app.config.globalProperties.$formatNumberForCompany = (value, showDecimals = true) => {
    return formatNumberWithRounding(value, showDecimals);
  };
  
  app.config.globalProperties.$formatCurrencyForCompany = (value, currencySymbol = '', showDecimals = true) => {
    return formatCurrencyWithRounding(value, currencySymbol, showDecimals);
  };
  
  app.mount("#app");
}

bootstrapApp();

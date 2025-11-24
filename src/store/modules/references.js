import api from "@/api/axiosInstance";
import basementApi from "@/api/basement/basementAxiosInstance";
import { retryWithExponentialBackoff } from '../utils/retry';

const state = {
  units: [],
  currencies: [],
  users: [],
  orderStatuses: [],
  projectStatuses: [],
  transactionCategories: [],
  productStatuses: [],
  orderStatusesCustomOrder: null,
  loadingFlags: {
    units: false,
    currencies: false,
    users: false,
    orderStatuses: false,
    projectStatuses: false,
    transactionCategories: false,
    productStatuses: false,
  },
};

const mutations = {
  SET_UNITS(state, units) {
    state.units = units;
  },
  SET_CURRENCIES(state, currencies) {
    state.currencies = currencies;
  },
  SET_USERS(state, users) {
    state.users = users;
  },
  SET_ORDER_STATUSES(state, orderStatuses) {
    state.orderStatuses = orderStatuses;
  },
  SET_PROJECT_STATUSES(state, projectStatuses) {
    state.projectStatuses = projectStatuses;
  },
  SET_TRANSACTION_CATEGORIES(state, transactionCategories) {
    state.transactionCategories = transactionCategories;
  },
  SET_PRODUCT_STATUSES(state, productStatuses) {
    state.productStatuses = productStatuses;
  },
  SET_ORDER_STATUSES_CUSTOM_ORDER(state, order) {
    state.orderStatusesCustomOrder = order;
  },
  SET_LOADING_FLAG(state, { type, loading }) {
    state.loadingFlags[type] = loading;
  },
};

const actions = {
  async loadUnits({ commit, state, rootGetters }) {
    if (state.units.length > 0) {
      return;
    }

    commit("SET_LOADING_FLAG", { type: "units", loading: true });

    try {
      const apiInstance = rootGetters['auth/isBasementMode'] ? basementApi : api;
      const response = await apiInstance.get("/app/units");
      const data = response.data.data;
      commit("SET_UNITS", data);
      console.log(`⚙️ Единицы (${data.length})`);
    } catch (error) {
      console.error("Ошибка загрузки единиц измерения:", error);
    } finally {
      commit("SET_LOADING_FLAG", { type: "units", loading: false });
    }
  },
  async loadCurrencies({ commit, state, rootGetters }) {
    if (state.currencies.length > 0) {
      const hasAccessToOtherCurrencies =
        typeof rootGetters['auth/hasPermission'] === "function" &&
        rootGetters['auth/hasPermission']("settings_currencies_view");
      const onlyDefaultInCache = state.currencies.every(
        (c) => (c.isDefault || c.is_default) === true
      );

      if (hasAccessToOtherCurrencies && onlyDefaultInCache) {
        commit("SET_CURRENCIES", []);
      } else {
        if (
          state.currencies[0]?.is_default &&
          !state.currencies[0]?.isDefault
        ) {
          const CurrencyDto = (await import("@/dto/app/CurrencyDto")).default;
          commit(
            "SET_CURRENCIES",
            CurrencyDto.fromApiArray(state.currencies)
          );
        }
        return;
      }
    }

    commit("SET_LOADING_FLAG", { type: "currencies", loading: true });

    try {
      const apiInstance = rootGetters['auth/isBasementMode'] ? basementApi : api;
      const response = await apiInstance.get("/app/currency");
      const data = response.data.data;
      const CurrencyDto = (await import("@/dto/app/CurrencyDto")).default;
      const converted = CurrencyDto.fromApiArray(data);
      commit("SET_CURRENCIES", converted);
      console.log(`💱 Валюты (${converted.length})`);
    } catch (error) {
      console.error("Ошибка загрузки валют:", error);
    } finally {
      commit("SET_LOADING_FLAG", { type: "currencies", loading: false });
    }
  },
  async loadUsers({ commit, state }) {
    if (state.users.length > 0) {
      return;
    }

    commit("SET_LOADING_FLAG", { type: "users", loading: true });

    try {
      const UsersController = (await import("@/api/UsersController")).default;
      const data = await UsersController.getAllItems();
      commit("SET_USERS", data);
      console.log(`👥 Сотрудники (${data.length})`);
    } catch (error) {
      console.error("Ошибка загрузки сотрудников:", error);
      commit("SET_USERS", []);
    } finally {
      commit("SET_LOADING_FLAG", { type: "users", loading: false });
    }
  },
  async loadOrderStatuses({ commit, state }) {
    if (state.orderStatuses.length > 0) {
      return;
    }

    commit("SET_LOADING_FLAG", { type: "orderStatuses", loading: true });

    try {
      const OrderStatusController = (
        await import("@/api/OrderStatusController")
      ).default;
      const data = await OrderStatusController.getAllItems();

      if (state.orderStatusesCustomOrder) {
        const orderArray = state.orderStatusesCustomOrder;
        const orderedData = orderArray
          .map((id) => data.find((status) => status.id === id))
          .filter(Boolean)
          .concat(data.filter((status) => !orderArray.includes(status.id)));
        commit("SET_ORDER_STATUSES", orderedData);
      } else {
        commit("SET_ORDER_STATUSES", data);
      }

      console.log(`📊 Статусы заказов (${data.length})`);
    } catch (error) {
      console.error("Ошибка загрузки статусов заказов:", error);
    } finally {
      commit("SET_LOADING_FLAG", { type: "orderStatuses", loading: false });
    }
  },
  async loadProjectStatuses({ commit, state }) {
    if (state.projectStatuses.length > 0) {
      return;
    }

    commit("SET_LOADING_FLAG", { type: "projectStatuses", loading: true });

    try {
      const ProjectStatusController = (
        await import("@/api/ProjectStatusController")
      ).default;
      const data = await ProjectStatusController.getAllItems();
      commit("SET_PROJECT_STATUSES", data);
      console.log(`🎯 Статусы проектов (${data.length})`);
    } catch (error) {
      console.error("Ошибка загрузки статусов проектов:", error);
    } finally {
      commit("SET_LOADING_FLAG", { type: "projectStatuses", loading: false });
    }
  },
  async loadTransactionCategories({ commit, state }) {
    if (state.transactionCategories.length > 0) {
      return;
    }

    commit("SET_LOADING_FLAG", {
      type: "transactionCategories",
      loading: true,
    });

    try {
      const TransactionCategoryController = (
        await import("@/api/TransactionCategoryController")
      ).default;
      const data = await TransactionCategoryController.getAllItems();
      commit("SET_TRANSACTION_CATEGORIES", data);
      console.log(`💳 Категории транзакций (${data.length})`);
    } catch (error) {
      console.error("Ошибка загрузки категорий транзакций:", error);
    } finally {
      commit("SET_LOADING_FLAG", {
        type: "transactionCategories",
        loading: false,
      });
    }
  },
  async loadProductStatuses({ commit, state }) {
    if (state.productStatuses.length > 0) {
      return;
    }

    commit("SET_LOADING_FLAG", { type: "productStatuses", loading: true });

    try {
      const AppController = (await import("@/api/AppController")).default;
      const data = await retryWithExponentialBackoff(
        () => AppController.getProductStatuses(),
        3
      );
      commit("SET_PRODUCT_STATUSES", data);
      console.log(`🏷️ Статусы товаров (${data.length})`);
    } catch (error) {
      console.error(
        "❌ Ошибка загрузки статусов товаров после всех попыток:",
        error
      );
    } finally {
      commit("SET_LOADING_FLAG", { type: "productStatuses", loading: false });
    }
  },
};

const getters = {
  units: (state) => state.units,
  currencies: (state) => state.currencies,
  users: (state) => state.users,
  orderStatuses: (state) => state.orderStatuses,
  projectStatuses: (state) => state.projectStatuses,
  transactionCategories: (state) => state.transactionCategories,
  productStatuses: (state) => state.productStatuses,
  getUnitById: (state) => (id) => state.units.find((unit) => unit.id === id),
  getUnitName: (state) => (id) => {
    const unit = state.units.find((unit) => unit.id === id);
    return unit ? unit.name : "";
  },
  getUnitShortName: (state) => (id) => {
    const unit = state.units.find((unit) => unit.id === id);
    return unit ? unit.short_name : "";
  },
  getCurrencyById: (state) => (id) =>
    state.currencies.find((currency) => currency.id === id),
  getCurrencySymbol: (state) => (id) => {
    const currency = state.currencies.find((currency) => currency.id === id);
    return currency ? currency.symbol : "Нет валюты";
  },
  usersForCurrentCompany: (state, getters, rootState) => {
    const currentCompanyId = rootState.company?.currentCompany?.id;
    const activeUsers = state.users.filter((user) => Boolean(user?.isActive));
    if (!currentCompanyId) {
      return activeUsers;
    }
    return activeUsers.filter((user) => {
      if (!user.companies || user.companies.length === 0) {
        return false;
      }
      return user.companies.some(
        (company) => Number(company.id) === Number(currentCompanyId)
      );
    });
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};


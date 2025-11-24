import { COMPANY_DATA_FIELDS } from '../constants';
import { 
  loadCompanyScopedData, 
  isCompanyChanged, 
  shouldUseCache,
  handleLoadError,
  waitForLoading,
  loadProductsForSearch
} from '../utils/cacheHelpers';
import { retryWithExponentialBackoff } from '../utils/retry';

const state = {
  warehouses: [],
  cashRegisters: [],
  clients: [],
  clientsData: [],
  products: [],
  services: [],
  lastProducts: [],
  lastProductsData: [],
  allProducts: [],
  allProductsData: [],
  categories: [],
  projects: [],
  projectsData: [],
  projectsDataCompanyId: null,
  loadingFlags: {
    warehouses: false,
    cashRegisters: false,
    clients: false,
    products: false,
    services: false,
    categories: false,
    projects: false,
  },
  loggedDataFlags: {
    warehouses: false,
    cashRegisters: false,
    clients: false,
    categories: false,
    projects: false,
  },
};

const mutations = {
  SET_WAREHOUSES(state, warehouses) {
    state.warehouses = warehouses;
  },
  SET_CASH_REGISTERS(state, cashRegisters) {
    state.cashRegisters = cashRegisters;
  },
  SET_CLIENTS(state, clients) {
    state.clients = clients;
  },
  SET_CLIENTS_DATA(state, clientsData) {
    state.clientsData = clientsData;
  },
  SET_PRODUCTS(state, products) {
    state.products = products;
  },
  SET_SERVICES(state, services) {
    state.services = services;
  },
  SET_LAST_PRODUCTS(state, lastProducts) {
    state.lastProducts = lastProducts;
  },
  SET_LAST_PRODUCTS_DATA(state, lastProductsData) {
    state.lastProductsData = lastProductsData;
  },
  SET_ALL_PRODUCTS(state, allProducts) {
    state.allProducts = allProducts;
  },
  SET_ALL_PRODUCTS_DATA(state, allProductsData) {
    state.allProductsData = allProductsData;
  },
  SET_CATEGORIES(state, categories) {
    state.categories = categories;
  },
  SET_PROJECTS(state, projects) {
    state.projects = projects;
  },
  SET_PROJECTS_DATA(state, projectsData) {
    state.projectsData = projectsData;
  },
  SET_PROJECTS_DATA_COMPANY_ID(state, companyId) {
    state.projectsDataCompanyId = companyId;
  },
  SET_LOADING_FLAG(state, { type, loading }) {
    state.loadingFlags[type] = loading;
  },
  SET_LOGGED_DATA_FLAG(state, { type, logged }) {
    state.loggedDataFlags[type] = logged;
  },
  CLEAR_COMPANY_DATA(state) {
    COMPANY_DATA_FIELDS.forEach((f) => {
      if (state[f] && Array.isArray(state[f])) {
        state[f] = [];
      }
    });
    state.projectsDataCompanyId = null;
    state.loggedDataFlags = {
      warehouses: false,
      cashRegisters: false,
      clients: false,
      categories: false,
      projects: false,
    };
  },
};

const actions = {
  async waitForLoading({ state }, type, maxAttempts = 50) {
    return waitForLoading(state, state.loadingFlags, type, maxAttempts);
  },
  async loadWarehouses({ commit, state, dispatch, rootState }) {
    await loadCompanyScopedData(
      { commit, state, dispatch },
      {
        loadingFlagKey: "warehouses",
        stateKey: "warehouses",
        companyId: rootState.company?.currentCompany?.id,
        clearMutations: ["SET_WAREHOUSES"],
        loggedFlagKey: "warehouses",
        logEmoji: "📦",
        logName: "Склады",
        fetchData: async () => {
          const WarehouseController = (
            await import("@/api/WarehouseController")
          ).default;
          return await WarehouseController.getAllItems();
        },
        errorName: "складов",
      }
    );
  },
  async loadCashRegisters({ commit, state, dispatch, rootState }) {
    await loadCompanyScopedData(
      { commit, state, dispatch },
      {
        loadingFlagKey: "cashRegisters",
        stateKey: "cashRegisters",
        companyId: rootState.company?.currentCompany?.id,
        clearMutations: ["SET_CASH_REGISTERS"],
        loggedFlagKey: "cashRegisters",
        logEmoji: "💰",
        logName: "Кассы",
        fetchData: async () => {
          const CashRegisterController = (
            await import("@/api/CashRegisterController")
          ).default;
          return await CashRegisterController.getAllItems();
        },
        errorName: "касс",
      }
    );
  },
  async loadClients({ commit, state, dispatch, rootState, rootGetters }) {
    if (state.loadingFlags.clients) {
      return dispatch("waitForLoading", "clients");
    }

    const companyId = rootState.company?.currentCompany?.id;
    if (!companyId) {
      commit("SET_CLIENTS", []);
      commit("SET_CLIENTS_DATA", []);
      return;
    }

    const isChanged = isCompanyChanged(rootState.company, companyId);
    if (isChanged) {
      commit("SET_CLIENTS", []);
      commit("SET_CLIENTS_DATA", []);
    }

    if (
      state.clientsData.length > 0 &&
      state.clients.length === 0 &&
      !isChanged
    ) {
      const firstClient = state.clientsData[0];
      const hasSnakeCase =
        firstClient &&
        (firstClient.first_name !== undefined ||
          firstClient.last_name !== undefined);
      const hasCamelCase =
        firstClient &&
        (firstClient.firstName !== undefined ||
          firstClient.lastName !== undefined);

      if (hasCamelCase && !hasSnakeCase) {
        commit("SET_CLIENTS_DATA", []);
        commit("SET_CLIENTS", []);
      } else {
        const ClientDto = (await import("@/dto/client/ClientDto")).default;
        const clients = ClientDto.fromApiArray(state.clientsData);
        commit("SET_CLIENTS", clients);
        return;
      }
    }

    if (shouldUseCache(state, "clients", rootState.company, companyId)) {
      if (!state.loggedDataFlags.clients) {
        console.log(`  👤 Клиенты (${state.clients.length}) - из кэша`);
        commit("SET_LOGGED_DATA_FLAG", { type: "clients", logged: true });
      }
      return;
    }

    commit("SET_LOADING_FLAG", { type: "clients", loading: true });

    try {
      const ClientDto = (await import("@/dto/client/ClientDto")).default;
      const api = (await import("@/api/axiosInstance")).default;

      const response = await retryWithExponentialBackoff(async () => {
        const res = await api.get(`/clients/all`);
        return res.data.data;
      }, 3);

      const plainData = Array.isArray(response) ? response : [];
      commit("SET_CLIENTS_DATA", plainData);
      const clients = ClientDto.fromApiArray(plainData);
      commit("SET_CLIENTS", clients);
      console.log(`  👤 Клиенты (${plainData.length})`);
    } catch (error) {
      commit("SET_CLIENTS", []);
      commit("SET_CLIENTS_DATA", []);
      handleLoadError(dispatch, "клиентов", error);
    } finally {
      commit("SET_LOADING_FLAG", { type: "clients", loading: false });
    }
  },
  async loadProducts({ commit, state }) {
    if (state.products.length > 0) {
      return;
    }

    try {
      const ProductController = (await import("@/api/ProductController"))
        .default;
      const data = await ProductController.getItems(1, true);
      commit("SET_PRODUCTS", data.items);
    } catch (error) {
      console.error("Ошибка загрузки товаров:", error);
      commit("SET_PRODUCTS", []);
    }
  },
  async loadServices({ commit, state }) {
    if (state.services.length > 0) {
      return;
    }

    try {
      const ProductController = (await import("@/api/ProductController"))
        .default;
      const data = await ProductController.getItems(1, false);
      commit("SET_SERVICES", data.items);
    } catch (error) {
      console.error("Ошибка загрузки услуг:", error);
      commit("SET_SERVICES", []);
    }
  },
  async loadCategories({ commit, state, dispatch, rootState }) {
    await loadCompanyScopedData(
      { commit, state, dispatch },
      {
        loadingFlagKey: "categories",
        stateKey: "categories",
        companyId: rootState.company?.currentCompany?.id,
        clearMutations: ["SET_CATEGORIES"],
        loggedFlagKey: "categories",
        logEmoji: "✅",
        logName: "Категории",
        fetchData: async () => {
          const CategoryController = (await import("@/api/CategoryController"))
            .default;
          return await CategoryController.getAllItems();
        },
        errorName: "категорий",
      }
    );
  },
  async loadProjects({ commit, state, dispatch, rootState }) {
    const companyId = rootState.company?.currentCompany?.id;
    if (!companyId) {
      commit("SET_PROJECTS", []);
      commit("SET_PROJECTS_DATA", []);
      return;
    }

    const isChanged = isCompanyChanged(rootState.company, companyId);
    const isProjectsCompanyChanged =
      state.projectsDataCompanyId !== null &&
      state.projectsDataCompanyId !== companyId;

    if (isChanged || isProjectsCompanyChanged) {
      commit("SET_PROJECTS", []);
      commit("SET_PROJECTS_DATA", []);
      commit("SET_PROJECTS_DATA_COMPANY_ID", companyId);
    }

    if (
      state.projectsData.length > 0 &&
      state.projects.length === 0 &&
      state.projectsDataCompanyId === companyId &&
      !isChanged
    ) {
      const ProjectDto = (await import("@/dto/project/ProjectDto")).default;
      const projects = ProjectDto.fromApiArray(state.projectsData);
      commit("SET_PROJECTS", projects);
      return;
    }

    if (
      state.projects.length > 0 &&
      state.projectsDataCompanyId === companyId &&
      !isChanged
    ) {
      if (!state.loggedDataFlags.projects) {
        console.log(`  📋 Проекты (${state.projects.length}) - из кэша`);
        commit("SET_LOGGED_DATA_FLAG", { type: "projects", logged: true });
      }
      return;
    }

    commit("SET_LOADING_FLAG", { type: "projects", loading: true });

    try {
      const ProjectController = (await import("@/api/ProjectController"))
        .default;
      const ProjectDto = (await import("@/dto/project/ProjectDto")).default;

      const data = await retryWithExponentialBackoff(
        () => ProjectController.getAllItems(),
        3
      );
      const plainData = data.map((project) => ({ ...project }));
      commit("SET_PROJECTS_DATA", plainData);
      commit("SET_PROJECTS", ProjectDto.fromApiArray(plainData));
      console.log(`  📋 Проекты (${data.length})`);
    } catch (error) {
      commit("SET_PROJECTS", []);
      commit("SET_PROJECTS_DATA", []);
      handleLoadError(dispatch, "проектов", error);
    } finally {
      commit("SET_LOADING_FLAG", { type: "projects", loading: false });
    }
  },
  async loadLastProducts({ commit, state, rootGetters }) {
    if (
      state.lastProductsData.length > 0 &&
      state.lastProducts.length === 0
    ) {
      const ProductSearchDto = (
        await import("@/dto/product/ProductSearchDto")
      ).default;
      const lastProducts = ProductSearchDto.fromApiArray(
        state.lastProductsData
      );
      commit("SET_LAST_PRODUCTS", lastProducts);
      return;
    }

    if (state.lastProducts.length > 0) {
      return;
    }

    try {
      const results = await loadProductsForSearch(rootGetters, null, 10);
      const ProductSearchDto = (
        await import("@/dto/product/ProductSearchDto")
      ).default;
      const lastProducts = ProductSearchDto.fromApiArray(results.items || []);
      commit("SET_LAST_PRODUCTS", lastProducts);
      commit(
        "SET_LAST_PRODUCTS_DATA",
        (results.items || []).map((item) => ({ ...item }))
      );
    } catch (error) {
      console.error("Ошибка загрузки последних товаров:", error);
      commit("SET_LAST_PRODUCTS", []);
      commit("SET_LAST_PRODUCTS_DATA", []);
    }
  },
  async loadAllProducts({ commit, state, rootGetters }) {
    if (state.allProductsData.length > 0 && state.allProducts.length === 0) {
      const ProductSearchDto = (
        await import("@/dto/product/ProductSearchDto")
      ).default;
      const allProducts = ProductSearchDto.fromApiArray(
        state.allProductsData
      );
      commit("SET_ALL_PRODUCTS", allProducts);
      return;
    }

    if (state.allProducts.length > 0) {
      return;
    }

    try {
      const results = await loadProductsForSearch(rootGetters, true, 1000);
      const ProductSearchDto = (
        await import("@/dto/product/ProductSearchDto")
      ).default;
      const allProducts = ProductSearchDto.fromApiArray(results.items || []);
      commit("SET_ALL_PRODUCTS", allProducts);
      commit(
        "SET_ALL_PRODUCTS_DATA",
        (results.items || []).map((item) => ({ ...item }))
      );
      console.log(
        `✅ Загружено ${allProducts.length} товаров для поиска (кэш на 30 дней)`
      );
    } catch (error) {
      console.error("Ошибка загрузки всех товаров:", error);
      commit("SET_ALL_PRODUCTS", []);
      commit("SET_ALL_PRODUCTS_DATA", []);
    }
  },
};

const getters = {
  warehouses: (state) => state.warehouses,
  cashRegisters: (state) => state.cashRegisters,
  clients: (state) => state.clients,
  products: (state) => state.products,
  services: (state) => state.services,
  lastProducts: (state) => state.lastProducts,
  allProducts: (state) => state.allProducts,
  categories: (state) => state.categories,
  projects: (state) => state.projects,
  activeProjects: (state) =>
    state.projects.filter((p) => p.statusId !== 3 && p.statusId !== 4),
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};


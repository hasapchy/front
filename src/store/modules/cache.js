import { CLEAR_MUTATIONS_MAPPING, GLOBAL_REFERENCE_FIELDS } from '../constants';
import { generateQueryCacheKey } from '../utils/cacheHelpers';

const state = {
  queryCache: {},
};

const mutations = {
  SET_QUERY_CACHE(state, { key, data }) {
    state.queryCache[key] = { data, timestamp: Date.now() };
  },
  CLEAR_QUERY_CACHE(state, prefix = null) {
    if (!prefix) {
      state.queryCache = {};
      return;
    }
    Object.keys(state.queryCache).forEach((key) => {
      if (key.startsWith(prefix)) {
        delete state.queryCache[key];
      }
    });
  },
  CLEAR_QUERY_CACHE_BY_COMPANY(state, companyId) {
    Object.keys(state.queryCache).forEach((key) => {
      if (key.includes(`_company_${companyId}`)) {
        delete state.queryCache[key];
      }
    });
  },
};

const actions = {
  getQueryCache({ state, rootState }, { prefix, params, ttl = 120000 }) {
    const companyId = rootState.company?.currentCompany?.id;
    const key = generateQueryCacheKey(prefix, params, companyId);

    const cached = state.queryCache[key];
    if (!cached) return null;

    if (Date.now() - cached.timestamp > ttl) {
      delete state.queryCache[key];
      return null;
    }

    return cached.data;
  },
  setQueryCache({ commit, rootState }, { prefix, params, data }) {
    const companyId = rootState.company?.currentCompany?.id;
    const key = generateQueryCacheKey(prefix, params, companyId);
    commit("SET_QUERY_CACHE", { key, data });
  },
  invalidateQueryCache({ commit }, { prefix = null, companyId = null }) {
    if (companyId) {
      commit("CLEAR_QUERY_CACHE_BY_COMPANY", companyId);
    } else {
      commit("CLEAR_QUERY_CACHE", prefix);
    }
  },
  invalidateCache(
    { commit, dispatch, rootState },
    { type, companyId = null, skipEventBus = false }
  ) {
    // Очищаем данные через мутации store (persistedstate автоматически синхронизирует с localStorage)
    if (CLEAR_MUTATIONS_MAPPING[type]) {
      // Нужно вызвать мутацию в соответствующем модуле
      // Это будет обрабатываться через root mutations
      commit(`data/${CLEAR_MUTATIONS_MAPPING[type]}`, [], { root: true });
    }

    if (type === "products" || type === "services") {
      commit("data/SET_LAST_PRODUCTS", [], { root: true });
      commit("data/SET_LAST_PRODUCTS_DATA", [], { root: true });
      commit("data/SET_ALL_PRODUCTS", [], { root: true });
      commit("data/SET_ALL_PRODUCTS_DATA", [], { root: true });
      dispatch("invalidateQueryCache", { prefix: "products_list" });
      dispatch("invalidateQueryCache", { prefix: "services_list" });
    }

    const queryCachePrefixes = {
      clients: "clients_list",
      orders: "orders_list",
      sales: "sales_list",
      transactions: "transactions_list",
      invoices: "invoices_list",
      projects: "projects_list",
    };

    if (queryCachePrefixes[type]) {
      dispatch("invalidateQueryCache", {
        prefix: queryCachePrefixes[type],
        companyId,
      });
    }
  },
  onDataCreate({ dispatch }, { type, companyId = null }) {
    dispatch("invalidateCache", { type, companyId });
  },
  onDataUpdate({ dispatch }, { type, companyId = null }) {
    dispatch("invalidateCache", { type, companyId });
  },
  onDataDelete({ dispatch }, { type, companyId = null }) {
    dispatch("invalidateCache", { type, companyId });
  },
  clearCache({ commit }) {
    // Очищаем данные через мутации store (persistedstate автоматически синхронизирует с localStorage)
    commit("data/CLEAR_COMPANY_DATA", null, { root: true });
    commit("CLEAR_QUERY_CACHE");
    GLOBAL_REFERENCE_FIELDS.forEach((type) => {
      if (CLEAR_MUTATIONS_MAPPING[type]) {
        commit(`references/${CLEAR_MUTATIONS_MAPPING[type]}`, [], { root: true });
      }
    });
  },
  onUserChange({ commit }) {
    commit("data/CLEAR_COMPANY_DATA", null, { root: true });
    commit("CLEAR_QUERY_CACHE");
    GLOBAL_REFERENCE_FIELDS.forEach((field) => {
      if (CLEAR_MUTATIONS_MAPPING[field]) {
        commit(`references/${CLEAR_MUTATIONS_MAPPING[field]}`, [], { root: true });
      }
    });
    commit("references/SET_USERS", [], { root: true });
  },
};

const getters = {
  queryCache: (state) => state.queryCache,
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};


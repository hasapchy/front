import api from "@/api/axiosInstance";
import CompanyDto from "@/dto/companies/CompanyDto";
import { clearOldCompanyCache, loadCompanyDataIfNeeded } from '../utils/cacheHelpers';
import { logCompanyRoundingSettings } from '../utils/logging';

const state = {
  currentCompany: null,
  lastCompanyId: null,
  userCompanies: [],
  isChangingCompanyFromThisTab: false,
  isSyncingCompanyFromOtherTab: false,
  loadingFlags: {
    companyData: false,
    currentCompany: false,
    userCompanies: false,
  },
};

const mutations = {
  SET_CURRENT_COMPANY(state, company) {
    if (state.currentCompany?.id === company?.id) {
      return;
    }
    state.currentCompany = company;
    logCompanyRoundingSettings(company);
  },
  SET_LAST_COMPANY_ID(state, companyId) {
    state.lastCompanyId = companyId;
  },
  SET_USER_COMPANIES(state, companies) {
    state.userCompanies = companies;
  },
  SET_LOADING_FLAG(state, { type, loading }) {
    state.loadingFlags[type] = loading;
  },
  SET_IS_CHANGING_COMPANY(state, value) {
    state.isChangingCompanyFromThisTab = value;
  },
  SET_IS_SYNCING_COMPANY_FROM_OTHER_TAB(state, value) {
    state.isSyncingCompanyFromOtherTab = value;
  },
};

const actions = {
  async loadUserCompanies({ commit, state }) {
    if (state.loadingFlags.userCompanies) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!state.loadingFlags.userCompanies) {
            clearInterval(checkInterval);
            resolve(state.userCompanies);
          }
        }, 50);
      });
    }

    if (state.userCompanies?.length > 0) {
      return state.userCompanies;
    }

    commit("SET_LOADING_FLAG", { type: "userCompanies", loading: true });

    try {
      const response = await api.get("/user/companies");
      const companies = CompanyDto.fromApiArray(response.data.data);
      commit("SET_USER_COMPANIES", companies);
      return companies;
    } catch (error) {
      console.error("Ошибка загрузки компаний пользователя:", error);
      return [];
    } finally {
      commit("SET_LOADING_FLAG", { type: "userCompanies", loading: false });
    }
  },
  async loadCurrentCompany({ commit, dispatch, state, rootGetters }) {
    if (state.loadingFlags.currentCompany) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!state.loadingFlags.currentCompany) {
            clearInterval(checkInterval);
            resolve(state.currentCompany);
          }
        }, 50);
      });
    }

    commit("SET_LOADING_FLAG", { type: "currentCompany", loading: true });

    try {
      let company = null;

      if (state.currentCompany?.id) {
        const normalized = new CompanyDto(state.currentCompany);
        commit("SET_CURRENT_COMPANY", normalized);
        company = normalized;
      } else if (state.lastCompanyId && state.userCompanies?.length > 0) {
        const lastCompany = state.userCompanies.find(
          (c) => c.id === state.lastCompanyId
        );
        if (lastCompany) {
          commit("SET_CURRENT_COMPANY", lastCompany);
          company = lastCompany;
        }
      }

      if (!company) {
        const response = await api.get("/user/current-company");
        const companyData = response.data.data;
        if (companyData && companyData.id) {
          company = new CompanyDto(companyData);
          commit("SET_CURRENT_COMPANY", company);
        } else {
          console.warn("[loadCurrentCompany] Компания не найдена в ответе API", {
            responseData: response.data,
            companyData: companyData,
            hasId: companyData?.id
          });
          return null;
        }
      }

      if (company?.id) {
        await loadCompanyDataIfNeeded(dispatch, state);
        await dispatch("auth/refreshUserPermissions", null, { root: true });
      }

      return company;
    } catch (error) {
      console.error(
        "[loadCurrentCompany] Ошибка загрузки текущей компании:",
        error
      );
      return null;
    } finally {
      commit("SET_LOADING_FLAG", { type: "currentCompany", loading: false });
    }
  },
  async setCurrentCompany({ commit, dispatch, state, rootState }, companyId) {
    try {
      const oldCompanyId = state.currentCompany?.id;

      if (oldCompanyId === companyId) {
        return state.currentCompany;
      }

      const response = await api.post("/user/set-company", {
        company_id: companyId,
      });
      const companyData = response.data.data;
      if (!companyData || !companyData.id) {
        throw new Error("Компания не найдена в ответе API");
      }
      const company = new CompanyDto(companyData);

      commit("SET_CURRENT_COMPANY", company);

      if (oldCompanyId && oldCompanyId !== companyId) {
        clearOldCompanyCache(oldCompanyId);
        dispatch("cache/invalidateQueryCache", { companyId: oldCompanyId }, { root: true });
      }

      commit("data/CLEAR_COMPANY_DATA", null, { root: true });
      await dispatch("loadCompanyData");
      await dispatch("auth/refreshUserPermissions", null, { root: true });
      // company-changed теперь обрабатывается через Vuex watchers в компонентах

      return company;
    } catch (error) {
      console.error("Ошибка установки текущей компании:", error);
      commit("SET_LOADING_FLAG", { type: "companyData", loading: false });
      throw error;
    }
  },
  async loadCompanyData({ dispatch, commit, state, rootGetters }) {
    if (rootGetters['auth/isBasementMode']) {
      return;
    }

    if (!state.currentCompany?.id) {
      return;
    }

    if (state.loadingFlags.companyData) {
      return;
    }

    const companyId = state.currentCompany.id;
    commit("SET_LOADING_FLAG", { type: "companyData", loading: true });

    try {
      const criticalLoads = Promise.allSettled([
        dispatch("data/loadWarehouses", null, { root: true }),
        dispatch("data/loadCashRegisters", null, { root: true }),
      ]);

      const otherLoadsPromises = [
        dispatch("data/loadCategories", null, { root: true }),
        dispatch("data/loadClients", null, { root: true }),
        dispatch("data/loadProjects", null, { root: true }),
      ];

      const otherLoads = Promise.allSettled(otherLoadsPromises);

      const [criticalResults, otherResults] = await Promise.all([
        criticalLoads,
        otherLoads,
      ]);

      const allResults = [...criticalResults, ...otherResults];
      const failed = allResults.filter((r) => r.status === "rejected");

      if (failed.length > 0) {
        console.warn(`⚠️ ${failed.length} справочник(ов) не загрузилось`);
        const criticalFailed = criticalResults.filter(
          (r) => r.status === "rejected"
        );
        if (criticalFailed.length > 0) {
          dispatch("ui/showNotification", {
            title: "Предупреждение",
            subtitle: "Некоторые критичные данные не загрузились",
            isDanger: false,
            duration: 3000,
          }, { root: true });
        }
      }

      commit("SET_LAST_COMPANY_ID", companyId);
    } catch (error) {
      console.error("❌ Ошибка загрузки данных компании:", error);
      dispatch("ui/showNotification", {
        title: "Ошибка загрузки",
        subtitle: error.message || "Не удалось загрузить данные компании",
        isDanger: true,
      }, { root: true });
      throw error;
    } finally {
      commit("SET_LOADING_FLAG", { type: "companyData", loading: false });
    }
  },
  onCompanyChange({ commit, dispatch }, { oldCompanyId, newCompanyId }) {
    commit("data/CLEAR_COMPANY_DATA", null, { root: true });
    if (oldCompanyId) {
      dispatch("cache/invalidateQueryCache", { companyId: oldCompanyId }, { root: true });
    }
  },
  async handleCompanyUpdated({ dispatch, state }) {
    await dispatch("loadUserCompanies");

    const currentCompanyId = state.currentCompany?.id;
    if (!currentCompanyId) return;

    try {
      const api = (await import("@/api/axiosInstance")).default;
      const CompanyDto = (await import("@/dto/companies/CompanyDto")).default;
      const response = await api.get("/user/current-company");
      const companyData = response.data.data;
      if (companyData && companyData.id) {
        const updatedCompany = new CompanyDto(companyData);
        dispatch("setCurrentCompany", updatedCompany.id);
      } else {
        console.warn("[handleCompanyUpdated] Компания не найдена в ответе API");
      }
    } catch (error) {
      console.error(
        "[Company Updated] Ошибка при загрузке обновленной компании:",
        error
      );
      const updatedCompany = state.userCompanies?.find(
        (c) => c.id === currentCompanyId
      );
      if (updatedCompany) {
        dispatch("setCurrentCompany", updatedCompany.id);
      }
    }
  },
};

const getters = {
  currentCompany: (state) => state.currentCompany,
  userCompanies: (state) => state.userCompanies,
  currentCompanyId: (state) => state.currentCompany?.id || null,
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};


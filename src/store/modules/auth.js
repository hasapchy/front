import api from "@/api/axiosInstance";
import basementApi from "@/api/basement/basementAxiosInstance";

const state = {
  user: null,
  permissions: [],
  permissionsLoaded: false,
  token: null,
  tokenExpiresAt: null,
  loadingFlags: {
    refreshPermissions: false,
  },
};

const mutations = {
  SET_USER(state, user) {
    state.user = user;
  },
  SET_PERMISSIONS(state, permissions) {
    state.permissions = permissions;
    state.permissionsLoaded = true;
  },
  SET_PERMISSIONS_LOADED(state, loaded) {
    state.permissionsLoaded = loaded;
  },
  SET_TOKEN(state, { token, expiresAt }) {
    state.token = token;
    state.tokenExpiresAt = expiresAt;
  },
  CLEAR_TOKEN(state) {
    state.token = null;
    state.tokenExpiresAt = null;
  },
  SET_LOADING_FLAG(state, { type, loading }) {
    state.loadingFlags[type] = loading;
  },
};

const actions = {
  setUser({ commit }, user) {
    commit("SET_USER", user);
  },
  setPermissions({ commit }, permissions) {
    commit("SET_PERMISSIONS", permissions);
  },
  setToken({ commit }, { token, expiresAt }) {
    commit("SET_TOKEN", { token, expiresAt });
  },
  clearAuth({ commit, dispatch }) {
    commit("CLEAR_TOKEN");
    commit("SET_USER", null);
    commit("SET_PERMISSIONS", []);
    dispatch("cache/onUserChange", null, { root: true });
  },
  async refreshUserPermissions({ commit, getters, state }) {
    if (state.loadingFlags.refreshPermissions) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!state.loadingFlags.refreshPermissions) {
            clearInterval(checkInterval);
            resolve({
              user: state.user,
              permissions: state.permissions,
            });
          }
        }, 50);
      });
    }

    commit("SET_LOADING_FLAG", { type: "refreshPermissions", loading: true });

    try {
      const apiInstance = getters.isBasementMode ? basementApi : api;
      const response = await apiInstance.get("/user/me");
      commit("SET_USER", response.data.user);
      commit("SET_PERMISSIONS", response.data.permissions);
      return response.data;
    } catch (error) {
      console.error("Ошибка обновления прав пользователя:", error);
      throw error;
    } finally {
      commit("SET_LOADING_FLAG", { type: "refreshPermissions", loading: false });
    }
  },
};

const getters = {
  user: (state) => state.user,
  permissions: (state) => state.permissions,
  hasPermission: (state) => (perm) => {
    if (!perm) {
      return true;
    }
    if (perm.startsWith("settings_")) {
      return state.permissions.includes(perm);
    }
    if (
      perm.endsWith("_view") ||
      perm.endsWith("_update") ||
      perm.endsWith("_delete")
    ) {
      const allPerm = perm.replace(/_(view|update|delete)$/, "_$1_all");
      const ownPerm = perm.replace(/_(view|update|delete)$/, "_$1_own");
      return (
        state.permissions.includes(allPerm) ||
        state.permissions.includes(ownPerm)
      );
    }
    return state.permissions.includes(perm);
  },
  token: (state) => state.token,
  tokenExpiresAt: (state) => state.tokenExpiresAt,
  isTokenExpired: (state) => {
    if (!state.token || !state.tokenExpiresAt) {
      return true;
    }
    return Date.now() > state.tokenExpiresAt;
  },
  isBasementMode: (state) => {
    // Проверяем, находимся ли мы в basement режиме по роли пользователя
    return (
      state.user &&
      state.user.roles &&
      state.user.roles.includes("basement_worker")
    );
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};


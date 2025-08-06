import { createStore } from "vuex";

export default createStore({
  state: {
    user: null,
    permissions: [],
    settings_open: false,
    searchQuery: "",
    notification: false,
    notificationTitle: "",
    notificationSubtitle: "",
    notificationIsDanger: false,
  },

  mutations: {
    SET_USER(state, user) {
      state.user = user;
    },
    SET_PERMISSIONS(state, permissions) {
      state.permissions = permissions;
    },
    SET_SETTINGS_OPEN(state, value) {
      state.settings_open = value;
    },
    SET_SEARCH_QUERY(state, query) {
      state.searchQuery = query;
    },
    SHOW_NOTIFICATION(state, { title, subtitle, isDanger }) {
      state.notificationTitle = title;
      state.notificationSubtitle = subtitle;
      state.notificationIsDanger = isDanger;
      state.notification = true;
    },
    CLOSE_NOTIFICATION(state) {
      state.notification = false;
    },
  },

  actions: {
    setSearchQuery({ commit }, query) {
      commit("SET_SEARCH_QUERY", query);
    },
    setUser({ commit }, user) {
      commit("SET_USER", user);
    },
    setPermissions({ commit }, permissions) {
      commit("SET_PERMISSIONS", permissions);
    },
    showNotification({ commit }, { title, subtitle = '', isDanger = false }) {
      commit('SHOW_NOTIFICATION', { title, subtitle, isDanger });
      setTimeout(() => {
        commit('CLOSE_NOTIFICATION');
      }, 10000);
    },
    closeNotification({ commit }) {
      commit('CLOSE_NOTIFICATION');
    },
  },

  getters: {
    user: (state) => state.user,
    permissions: (state) => state.permissions,
    hasPermission: (state) => (perm) => state.permissions.includes(perm),
    notification: (state) => state.notification,
    notificationTitle: (state) => state.notificationTitle,
    notificationSubtitle: (state) => state.notificationSubtitle,
    notificationIsDanger: (state) => state.notificationIsDanger,
  },
});

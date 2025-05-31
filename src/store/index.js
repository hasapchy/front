import { createStore } from 'vuex';

export default createStore({
  state: {
    user: null,
    settings_open: false,
    searchQuery: '',
  },
  mutations: {
    SET_SETTINGS_OPEN(state, value) {
      state.settings_open = value;
    },
    SET_SEARCH_QUERY(state, query) {
      state.searchQuery = query;
    },
  },
  actions: {
    setSearchQuery({ commit }, query) {
      commit('SET_SEARCH_QUERY', query);
    },
  },
  modules: {},
});
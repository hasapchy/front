import { createStore } from 'vuex'


export default createStore({
    state: {
        user: null,
        settings_open: false,
    },
    mutations: {
        SET_SETTINGS_OPEN(state, value) {
            state.settings_open = value;
        }
    },
    actions: {
    },
    modules: {
    }
});
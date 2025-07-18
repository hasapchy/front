export default {
  methods: {
    getApiErrorMessage(e) {
      if (e?.response && e.response.data) {
        if (e.response.data.errors) {
          return Object.values(e.response.data.errors).flat();
        }
        if (e.response.data.message) {
          return [e.response.data.message];
        }
      }
      if (e?.message) return [e.message];
      return ["Ошибка"];
    },
  },
};

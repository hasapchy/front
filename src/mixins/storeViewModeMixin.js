export function createStoreViewModeMixin({ getter, dispatch, modes }) {
  return {
    computed: {
      viewMode: {
        get() {
          return this.$store.getters[getter];
        },
        set(value) {
          if (modes.includes(value)) {
            this.$store.dispatch(dispatch, value);
          }
        },
      },
    },
    methods: {
      changeViewMode(mode) {
        if (modes.includes(mode)) {
          this.viewMode = mode;
        }
      },
    },
  };
}

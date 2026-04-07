const LIST_VIEW_MD_MEDIA = '(min-width: 768px)';

function createViewModeComputed(getter, dispatch, listPageKey, modes) {
  if (listPageKey) {
    return {
      viewMode: {
        get() {
          return this.$store.getters.listPageViewMode(listPageKey);
        },
        set(value) {
          if (modes.includes(value)) {
            this.$store.dispatch('setListPageViewMode', { key: listPageKey, mode: value });
          }
        },
      },
    };
  }
  return {
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
  };
}

export function createStoreViewModeMixin({ getter, dispatch, modes, mobileTableFallback, listPageKey }) {
  const viewModeBlock = createViewModeComputed(getter, dispatch, listPageKey, modes);
  return {
    data() {
      return {
        _listViewMdMql: null,
        _listViewMdMqlHandler: null,
        isMdListViewUp:
          typeof window !== 'undefined'
            ? window.matchMedia(LIST_VIEW_MD_MEDIA).matches
            : true,
      };
    },
    computed: {
      ...viewModeBlock,
      displayViewMode() {
        if (this.isMdListViewUp) {
          return this.viewMode;
        }
        if (this.viewMode === 'kanban' && modes.includes('cards')) {
          return 'cards';
        }
        if (this.viewMode === 'calendar' && modes.includes('cards')) {
          return 'cards';
        }
        if (this.viewMode !== 'table') {
          return this.viewMode;
        }
        if (mobileTableFallback != null && modes.includes(mobileTableFallback)) {
          return mobileTableFallback;
        }
        if (modes.includes('cards')) {
          return 'cards';
        }
        if (modes.includes('kanban')) {
          return 'kanban';
        }
        if (modes.includes('calendar')) {
          return 'calendar';
        }
        return this.viewMode;
      },
      cardListShellKey() {
        return this.displayViewMode === 'table' ? `table-${this.$i18n.locale}` : 'cards';
      },
    },
    methods: {
      changeViewMode(mode) {
        if (modes.includes(mode)) {
          this.viewMode = mode;
        }
      },
    },
    mounted() {
      if (typeof window === 'undefined') {
        return;
      }
      this._listViewMdMql = window.matchMedia(LIST_VIEW_MD_MEDIA);
      this._listViewMdMqlHandler = () => {
        this.isMdListViewUp = this._listViewMdMql.matches;
      };
      this._listViewMdMql.addEventListener('change', this._listViewMdMqlHandler);
      this.isMdListViewUp = this._listViewMdMql.matches;
    },
    beforeUnmount() {
      if (this._listViewMdMql && this._listViewMdMqlHandler) {
        this._listViewMdMql.removeEventListener('change', this._listViewMdMqlHandler);
      }
    },
  };
}

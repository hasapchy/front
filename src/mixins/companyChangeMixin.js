export default {
  computed: {
    currentCompanyId() {
      return this.$store.getters.currentCompanyId;
    }
  },
  
  watch: {
    // Отслеживаем изменение компании через Vuex watcher
    currentCompanyId: {
      handler(newCompanyId, oldCompanyId) {
        if (newCompanyId && newCompanyId !== oldCompanyId) {
          this.onCompanyChanged(newCompanyId);
        }
      },
      immediate: false
    }
  },
  
  async mounted() {
    const currentCompanyId = this.$store.getters.currentCompanyId;
    const lastCompanyId = this.$store.state.company?.lastCompanyId;
    
    if (currentCompanyId && currentCompanyId !== lastCompanyId) {
      await this.onCompanyChanged(currentCompanyId);
    }
  },
  
  beforeUnmount() {
    this._isDestroyed = true;
  },
  
  methods: {
    async onCompanyChanged(companyId) {
      if (this._isDestroyed) return;
      
      if (this.handleCompanyChanged) {
        await this.handleCompanyChanged(companyId);
      } else if (this.fetchItems) {
        await this.fetchItems();
      } else if (this.refreshData) {
        await this.refreshData();
      }
      
      if (!this._isDestroyed && this.showNotification) {
        this.showNotification('Компания изменена', '', false);
      }
    }
  }
};

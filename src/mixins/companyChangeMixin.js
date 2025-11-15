import { eventBus } from '@/eventBus';

export default {
  computed: {
    currentCompanyId() {
      return this.$store.getters.currentCompanyId;
    }
  },
  
  async mounted() {
    eventBus.on('company-changed', this.onCompanyChanged);
    
    const currentCompanyId = this.$store.getters.currentCompanyId;
    const lastCompanyId = this.$store.state.lastCompanyId;
    
    if (currentCompanyId && currentCompanyId !== lastCompanyId) {
      await this.onCompanyChanged(currentCompanyId);
    }
  },
  
  beforeUnmount() {
    this._isDestroyed = true;
    eventBus.off('company-changed', this.onCompanyChanged);
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

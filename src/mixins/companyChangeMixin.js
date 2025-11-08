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
    eventBus.off('company-changed', this.onCompanyChanged);
  },
  
  methods: {
    async onCompanyChanged(companyId) {
      if (this.handleCompanyChanged) {
        await this.handleCompanyChanged(companyId);
        return;
      }
      
      if (this.fetchItems) {
        await this.fetchItems();
      }
      
      if (this.refreshData) {
        await this.refreshData();
      }
      
      if (this.showNotification) {
        this.showNotification('Компания изменена', '', false);
      }
    }
  }
};

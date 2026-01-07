import { eventBus } from '@/eventBus';

export default {
  data() {
    return {
      _companyChangeProcessing: false,
      _lastProcessedCompanyId: null
    };
  },
  
  computed: {
    currentCompanyId() {
      return this.$store.getters.currentCompanyId;
    }
  },
  
  watch: {
    currentCompanyId: {
      handler(newCompanyId, oldCompanyId) {
        if (newCompanyId && newCompanyId !== oldCompanyId && newCompanyId !== this._lastProcessedCompanyId) {
          this.onCompanyChanged(newCompanyId);
        }
      },
      immediate: false
    }
  },
  
  mounted() {
    eventBus.on('company-changed', this.onCompanyChanged);
    this._lastProcessedCompanyId = this.currentCompanyId;
  },
  
  beforeUnmount() {
    this._isDestroyed = true;
    eventBus.off('company-changed', this.onCompanyChanged);
  },
  
  methods: {
    async onCompanyChanged(companyId) {
      if (this._isDestroyed) return;
      if (!companyId) return;
      
      if (this._companyChangeProcessing) {
        return;
      }
      
      if (companyId === this._lastProcessedCompanyId) {
        return;
      }
      
      this._companyChangeProcessing = true;
      
      try {
        this._lastProcessedCompanyId = companyId;
        
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
      } catch (error) {
        console.error('Ошибка при обработке смены компании:', error);
      } finally {
        this._companyChangeProcessing = false;
      }
    }
  }
};

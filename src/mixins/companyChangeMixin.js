import { eventBus } from '@/eventBus';

export default {
  data() {
    return {
      _companyChangeProcessing: false,
      _lastProcessedCompanyId: null,
      _boundOnCompanyChanged: null
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
          this.onCompanyChanged(newCompanyId, oldCompanyId);
        }
      },
      immediate: false
    }
  },

  mounted() {
    this._boundOnCompanyChanged = (companyId) => this.onCompanyChanged(companyId, undefined);
    eventBus.on('company-changed', this._boundOnCompanyChanged);
    this._lastProcessedCompanyId = this.currentCompanyId;
  },

  beforeUnmount() {
    this._isDestroyed = true;
    if (this._boundOnCompanyChanged) {
      eventBus.off('company-changed', this._boundOnCompanyChanged);
    }
  },
  
  methods: {
    async onCompanyChanged(companyId, previousCompanyId) {
      if (this._isDestroyed) return;
      if (!companyId) return;

      if (this._companyChangeProcessing) {
        return;
      }

      if (companyId === this._lastProcessedCompanyId) {
        return;
      }

      this._companyChangeProcessing = true;
      const isInitialLoad = arguments.length === 2 && previousCompanyId == null;

      try {
        this._lastProcessedCompanyId = companyId;

        if (this.handleCompanyChanged) {
          await this.handleCompanyChanged(companyId);
        } else if (this.fetchItems) {
          await this.fetchItems();
        } else if (this.refreshData) {
          await this.refreshData();
        }

        if (!isInitialLoad && !this._isDestroyed && this.showNotification) {
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

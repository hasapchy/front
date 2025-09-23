import { eventBus } from '@/eventBus';

export default {
  computed: {
    currentCompanyId() {
      return this.$store.getters.currentCompanyId;
    }
  },
  
  async mounted() {
    // Слушаем события смены компании
    eventBus.on('company-changed', this.onCompanyChanged);
    
    // Загружаем текущую компанию при инициализации, если её нет в store
    if (!this.currentCompanyId) {
      await this.$store.dispatch('loadCurrentCompany');
    }
  },
  
  beforeUnmount() {
    eventBus.off('company-changed', this.onCompanyChanged);
  },
  
  methods: {
    async onCompanyChanged(companyId) {
      // Перезагружаем данные страницы
      if (this.fetchItems) {
        await this.fetchItems();
      }
      
      // Если есть метод для обновления данных, вызываем его
      if (this.refreshData) {
        await this.refreshData();
      }
      
      // Уведомляем пользователя о смене компании
      this.$store.dispatch('showNotification', {
        title: 'Компания изменена',
        isDanger: false
      });
    }
  }
};

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
    
    // ✅ Если компания отличается от последней, значит произошла смена
    // Это может произойти если компонент смонтировался ПОСЛЕ смены компании
    const currentCompanyId = this.$store.getters.currentCompanyId;
    const lastCompanyId = this.$store.state.lastCompanyId;
    
    if (currentCompanyId && currentCompanyId !== lastCompanyId) {
      // Вызываем обработчик смены компании
      await this.onCompanyChanged(currentCompanyId);
    }
  },
  
  beforeUnmount() {
    eventBus.off('company-changed', this.onCompanyChanged);
  },
  
  methods: {
    async onCompanyChanged(companyId) {
      // ✅ Если компонент имеет специфичный обработчик handleCompanyChanged, используем его
      if (this.handleCompanyChanged) {
        await this.handleCompanyChanged(companyId);
        return;
      }
      
      // Иначе используем логику по умолчанию
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

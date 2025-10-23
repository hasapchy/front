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
    
    // Компания уже загружается глобально в App.vue, не нужно дублировать загрузку
    // Если currentCompanyId нет, значит App.vue еще загружается - просто ждем
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

<template>
  <div class="language-dropdown relative">
    <!-- Кнопка-триггер -->
    <button 
      @click="toggleDropdown"
      class="dropdown-trigger flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
    >
      <span class="flag-icon">{{ currentFlag }}</span>
      <span class="language-name">{{ currentLanguageName }}</span>
      <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': isOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>

    <!-- Выпадающий список -->
    <div 
      v-if="isOpen" 
      class="dropdown-menu absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-lg z-50"
    >
      <div class="py-1">
        <button 
          @click="changeLanguage('tm')"
          class="language-option w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 transition-colors"
          :class="{ 'bg-blue-50 text-blue-700': currentLocale === 'tm' }"
        >
          <span class="flag-icon">🇹🇲</span>
          <span class="text-sm">TM</span>
        </button>
        
        <button 
          @click="changeLanguage('ru')"
          class="language-option w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 transition-colors"
          :class="{ 'bg-blue-50 text-blue-700': currentLocale === 'ru' }"
        >
          <span class="flag-icon">🇷🇺</span>
          <span class="text-sm">RU</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LanguageSwitcher',
  data() {
    return {
      isOpen: false
    }
  },
  computed: {
    currentLocale() {
      return this.$i18n.locale
    },
    currentFlag() {
      return this.currentLocale === 'tm' ? '🇹🇲' : '🇷🇺'
    },
    currentLanguageName() {
      return this.currentLocale === 'tm' ? 'TM' : 'RU'
    }
  },
  mounted() {
    // Закрываем dropdown при клике вне его
    document.addEventListener('click', this.handleClickOutside)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside)
  },
  methods: {
    toggleDropdown() {
      this.isOpen = !this.isOpen
    },
    
    changeLanguage(locale) {
      this.$i18n.locale = locale
      localStorage.setItem('locale', locale)
      
      // Закрываем dropdown
      this.isOpen = false
      
      // Обновляем заголовок страницы
      document.title = this.getPageTitle()
      
      // Можно добавить событие для обновления других компонентов
      this.$emit('language-changed', locale)
      
      // Показываем уведомление о смене языка
      this.showLanguageNotification(locale)
    },
    
    handleClickOutside(event) {
      if (!this.$el.contains(event.target)) {
        this.isOpen = false
      }
    },
    
    getPageTitle() {
      // Получаем текущий путь для определения заголовка
      const path = this.$route.path
      let title = ''
      
      if (path === '/') {
        title = this.$t('home')
      } else if (path.includes('/clients')) {
        title = this.$t('clients')
      } else if (path.includes('/products')) {
        title = this.$t('products')
      } else if (path.includes('/orders')) {
        title = this.$t('orders')
      } else if (path.includes('/sales')) {
        title = this.$t('sales')
      } else if (path.includes('/warehouses')) {
        title = this.$t('warehouses')
      } else if (path.includes('/transactions')) {
        title = this.$t('transactions')
      } else if (path.includes('/settings')) {
        title = this.$t('settings')
      }
      
      return title ? `${title} - Hasapchy` : 'Hasapchy'
    },
    
    showLanguageNotification(locale) {
      const languageName = locale === 'tm' ? this.$t('turkmen') : this.$t('russian')
      const message = locale === 'tm' 
        ? `${this.$t('languageChanged')}: ${languageName}`
        : `${this.$t('languageChanged')}: ${languageName}`
      
      // Создаем простое уведомление
      const notification = document.createElement('div')
      notification.className = 'language-notification'
      notification.textContent = message
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 9999;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
      `
      
      // Добавляем CSS анимацию
      const style = document.createElement('style')
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `
      document.head.appendChild(style)
      
      document.body.appendChild(notification)
      
      // Убираем уведомление через 3 секунды
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      }, 3000)
    }
  }
}
</script>

<style scoped>
.language-dropdown {
  position: relative;
}

.dropdown-trigger {
  min-width: 70px;
  font-weight: 500;
  font-size: 14px;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  width: 160px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: 50;
}

.language-option {
  font-size: 14px;
  width: 100%;
  display: flex;
  align-items: center;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
}


.language-option:first-child {
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
}

.language-option:last-child {
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
}

.flag-icon {
  font-size: 16px;
  line-height: 1;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Адаптивность для мобильных устройств */
@media (max-width: 768px) {
  .dropdown-trigger {
    min-width: 60px;
    padding: 6px 10px;
  }
  
  .dropdown-menu {
    width: 140px;
  }
  
  .language-option {
    padding: 8px 12px;
  }
}
</style>

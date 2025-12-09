<template>
  <div class="language-dropdown relative">

    <button 
      @click="toggleDropdown"
      class="dropdown-trigger flex items-center gap-2 px-3 py-2 bg-white border-0 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
    >
      <div class="flag-icon" :class="`flag-${currentLocale}`">
        <span class="flag-text">{{ currentLanguageName }}</span>
      </div>
      <span class="language-name hidden sm:inline">{{ currentLanguageName }}</span>
      <svg class="w-4 h-4 transition-transform hidden sm:block" :class="{ 'rotate-180': isOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>


    <div 
      v-if="isOpen" 
      class="dropdown-menu absolute top-full mt-1 w-40 bg-white border border-gray-200 rounded shadow-lg z-50"
      :class="isMobile ? 'right-0' : 'left-0'"
    >
      <div class="py-1">
        <button 
          @click="changeLanguage('tm')"
          class="language-option w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 transition-colors"
          :class="{ 'bg-blue-50 text-blue-700': currentLocale === 'tm' }"
        >
          <div class="flag-icon flag-tm">
            <span class="flag-text">TM</span>
          </div>
          <span class="text-sm">TM</span>
        </button>
        
        <button 
          @click="changeLanguage('ru')"
          class="language-option w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 transition-colors"
          :class="{ 'bg-blue-50 text-blue-700': currentLocale === 'ru' }"
        >
          <div class="flag-icon flag-ru">
            <span class="flag-text">RU</span>
          </div>
          <span class="text-sm">RU</span>
        </button>
        
        <button 
          @click="changeLanguage('en')"
          class="language-option w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 transition-colors"
          :class="{ 'bg-blue-50 text-blue-700': currentLocale === 'en' }"
        >
          <div class="flag-icon flag-en">
            <span class="flag-text">EN</span>
          </div>
          <span class="text-sm">EN</span>
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
      isOpen: false,
      isMobile: false
    }
  },
  computed: {
    currentLocale() {
      return this.$i18n.locale
    },

    currentLanguageName() {
      if (this.currentLocale === 'tm') return 'TM'
      if (this.currentLocale === 'en') return 'EN'
      return 'RU'
    }
  },
  mounted() {
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile);
    document.addEventListener('click', this.handleClickOutside)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.checkMobile);
    document.removeEventListener('click', this.handleClickOutside)
  },
  methods: {
    checkMobile() {
      this.isMobile = window.innerWidth < 640;
    },
    toggleDropdown() {
      this.isOpen = !this.isOpen
    },
    
    changeLanguage(locale) {
      this.$i18n.locale = locale
      localStorage.setItem('locale', locale)
      
      this.isOpen = false
      
      document.title = this.getPageTitle()
      
      this.$emit('language-changed', locale)
      
      this.showLanguageNotification(locale)
    },
    
    handleClickOutside(event) {
      if (!this.$el.contains(event.target)) {
        this.isOpen = false
      }
    },
    
    getPageTitle() {
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
      
      return title ? `${title} - Hasapp.online` : 'Hasapp.online'
    },
    
    showLanguageNotification(locale) {
      let languageName
      if (locale === 'tm') {
        languageName = this.$t('turkmen')
      } else if (locale === 'en') {
        languageName = 'English'
      } else {
        languageName = this.$t('russian')
      }
      const message = `${this.$t('languageChanged')}: ${languageName}`
      
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
      
      const style = document.createElement('style')
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `
      document.head.appendChild(style)
      
      document.body.appendChild(notification)
      
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 22px;
  border-radius: 4px;
  color: #fff;
  font-weight: 700;
  font-size: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.flag-text {
  line-height: 1;
}

.flag-tm {
  background: linear-gradient(135deg, #01796f, #0ca678);
}

.flag-ru {
  background: linear-gradient(135deg, #d32f2f, #1565c0);
}

.flag-en {
  background: linear-gradient(135deg, #1e3a8a, #dc2626);
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

@media (max-width: 640px) {
  .dropdown-trigger {
    min-width: auto;
    padding: 6px 8px;
  }
  
  .dropdown-menu {
    width: 120px;
    right: 0;
    left: auto;
  }
  
  .language-option {
    padding: 8px 10px;
    font-size: 13px;
  }
  
  .flag-icon img {
    width: 20px;
    height: 16px;
  }
}
</style>

<template>
  <div
    v-if="embedded"
    ref="dropdownRef"
    class="language-embedded flex flex-wrap gap-1.5"
  >
    <button
      type="button"
      class="language-chip flex items-center justify-center rounded-md border px-2.5 py-1.5 text-sm transition-colors"
      :class="currentLocale === 'tm' ? 'border-[#01796f] bg-emerald-50 text-emerald-900' : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:hover:bg-[var(--surface-muted)]'"
      :aria-label="languageAriaLabel('tm')"
      :aria-pressed="currentLocale === 'tm'"
      @click="changeLanguage('tm')"
    >
      <span
        class="text-[1.35rem] leading-none"
        aria-hidden="true"
      >🇹🇲</span>
    </button>
    <button
      type="button"
      class="language-chip flex items-center justify-center rounded-md border px-2.5 py-1.5 text-sm transition-colors"
      :class="currentLocale === 'ru' ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:hover:bg-[var(--surface-muted)]'"
      :aria-label="languageAriaLabel('ru')"
      :aria-pressed="currentLocale === 'ru'"
      @click="changeLanguage('ru')"
    >
      <span
        class="text-[1.35rem] leading-none"
        aria-hidden="true"
      >🇷🇺</span>
    </button>
    <button
      type="button"
      class="language-chip flex items-center justify-center rounded-md border px-2.5 py-1.5 text-sm transition-colors"
      :class="currentLocale === 'en' ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:hover:bg-[var(--surface-muted)]'"
      :aria-label="languageAriaLabel('en')"
      :aria-pressed="currentLocale === 'en'"
      @click="changeLanguage('en')"
    >
      <span
        class="text-[1.35rem] leading-none"
        aria-hidden="true"
      >🇬🇧</span>
    </button>
  </div>
  <div
    v-else
    ref="dropdownRef"
    class="language-dropdown relative"
  >
    <button 
      type="button"
      class="dropdown-trigger flex items-center gap-2 px-3 py-2 bg-white border-0 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors dark:bg-transparent dark:hover:bg-[var(--surface-muted)]"
      :aria-label="languageAriaLabel(currentLocale)"
      :aria-expanded="isOpen"
      @click="toggleDropdown"
    >
      <span
        class="text-xl leading-none"
        aria-hidden="true"
      >{{ currentLocaleFlag }}</span>
      <svg
        class="w-4 h-4 transition-transform hidden sm:block"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>


    <div 
      v-if="isOpen" 
      class="dropdown-menu absolute top-full z-50 mt-1 w-40 rounded border border-gray-200 bg-white shadow-lg dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]"
      :class="isMobile ? 'right-0' : 'left-0'"
    >
      <div class="py-1">
        <button 
          class="language-option w-full flex items-center justify-center gap-2 px-3 py-2 hover:bg-gray-100 transition-colors dark:hover:bg-[var(--surface-muted)]"
          :class="{ 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200': currentLocale === 'tm' }"
          :aria-label="languageAriaLabel('tm')"
          @click="changeLanguage('tm')"
        >
          <span
            class="text-xl leading-none"
            aria-hidden="true"
          >🇹🇲</span>
        </button>
        
        <button 
          class="language-option w-full flex items-center justify-center gap-2 px-3 py-2 hover:bg-gray-100 transition-colors dark:hover:bg-[var(--surface-muted)]"
          :class="{ 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200': currentLocale === 'ru' }"
          :aria-label="languageAriaLabel('ru')"
          @click="changeLanguage('ru')"
        >
          <span
            class="text-xl leading-none"
            aria-hidden="true"
          >🇷🇺</span>
        </button>
        
        <button 
          class="language-option w-full flex items-center justify-center gap-2 px-3 py-2 hover:bg-gray-100 transition-colors dark:hover:bg-[var(--surface-muted)]"
          :class="{ 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200': currentLocale === 'en' }"
          :aria-label="languageAriaLabel('en')"
          @click="changeLanguage('en')"
        >
          <span
            class="text-xl leading-none"
            aria-hidden="true"
          >🇬🇧</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { getCurrentInstance, onBeforeUnmount, ref } from 'vue';
import { onClickOutside, useWindowSize } from '@vueuse/core';

export default {
  name: 'LanguageSwitcher',
  props: {
    embedded: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const dropdownRef = ref(null);
    const { width } = useWindowSize();
    const instance = getCurrentInstance();
    const stopClickOutside = onClickOutside(dropdownRef, () => {
      if (props.embedded || !instance?.proxy) {
        return;
      }
      instance.proxy.isOpen = false;
    });
    onBeforeUnmount(stopClickOutside);
    return { dropdownRef, windowWidth: width };
  },
  data() {
    return {
      isOpen: false
    }
  },
  computed: {
    isMobile() {
      return this.windowWidth < 640;
    },
    currentLocale() {
      return this.$i18n.locale
    },

    currentLocaleFlag() {
      return this.localeFlagEmoji(this.currentLocale)
    }
  },
  methods: {
    localeFlagEmoji(locale) {
      if (locale === 'tm') return '🇹🇲'
      if (locale === 'ru') return '🇷🇺'
      return '🇬🇧'
    },
    languageAriaLabel(locale) {
      if (locale === 'tm') return 'Türkmençe'
      if (locale === 'ru') return 'Русский'
      return 'English'
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
      } else if (path.startsWith('/admin/warehouses')) {
        title = this.$t('adminWarehouses')
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
  justify-content: center;
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
}
</style>

<template>
  <div class="company-dropdown relative">
    <button 
      @click="toggleDropdown"
      class="dropdown-trigger flex items-center gap-2 px-3 py-2 bg-white border-0 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
    >
      <div class="company-logo">
        <img :src="getCompanyLogo(currentCompany)" 
             :alt="currentCompany?.name" 
             class="w-6 h-6 object-contain rounded">
      </div>
      <span class="company-name">
        <span v-if="isLoadingCompanyData" class="flex items-center gap-1">
          <SpinnerIcon size-class="text-xs" />
          {{ currentCompanyName }}
        </span>
        <span v-else-if="isLoading" class="flex items-center gap-1">
          <SpinnerIcon size-class="text-xs" />
          {{ currentCompanyName }}
        </span>
        <span v-else>{{ currentCompanyName }}</span>
      </span>
      <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': isOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>

    <div 
      v-if="isOpen" 
      class="dropdown-menu absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded shadow-lg z-50"
    >
      <div class="py-1">
        <!-- Список компаний -->
        <button 
          v-for="company in companies" 
          :key="company.id"
          @click="selectCompany(company.id)"
          class="company-option w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 transition-colors"
          :class="{ 'bg-blue-50 text-blue-700': selectedCompanyId === company.id }"
        >
          <div class="company-logo">
            <img :src="getCompanyLogo(company)" 
                 :alt="company.name" 
                 class="w-6 h-6 object-contain rounded">
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-medium">{{ company.name }}</span>
          </div>
        </button>
        
      </div>
    </div>
  </div>
</template>

<script>
import UserCompanyController from '@/api/UserCompanyController';
import { eventBus } from '@/eventBus';
import SpinnerIcon from '@/views/components/app/SpinnerIcon.vue';

export default {
  name: 'CompanySwitcher',
  components: {
    SpinnerIcon
  },
  data() {
    return {
      isOpen: false,
      isLoading: true
    }
  },
  
  computed: {
    companies() {
      return this.$store.getters.userCompanies;
    },
    currentCompany() {
      return this.$store.getters.currentCompany;
    },
    selectedCompanyId() {
      return this.$store.getters.currentCompanyId;
    },
    isLoadingCompanyData() {
      return this.$store.state.loadingFlags?.companyData || false;
    },
    currentCompanyName() {
      if ((this.isLoading || this.isLoadingCompanyData) && !this.currentCompany) {
        return this.$t('loading');
      }
      return this.currentCompany ? this.currentCompany.name : this.$t('selectCompany');
    }
  },
  
  watch: {
    currentCompany: {
      handler(newCompany) {
        if (newCompany && this.isLoading) {
          this.isLoading = false;
        }
      },
      immediate: true
    }
  },
  
  async mounted() {
    // Если компания уже загружена, не показываем индикатор загрузки
    if (this.currentCompany) {
      this.isLoading = false;
    }
    
    try {
      // Загружаем компании только если они еще не загружены
      if (this.companies.length === 0) {
        await this.$store.dispatch('loadUserCompanies');
      }
      
      // Загружаем текущую компанию только если она еще не установлена
      if (!this.currentCompany) {
        await this.$store.dispatch('loadCurrentCompany');
      }
      
      // Если нет выбранной компании, выбираем первую
      if (!this.selectedCompanyId && this.companies.length > 0) {
        await this.selectCompany(this.companies[0].id);
      }
    } catch (error) {
      console.error('Ошибка загрузки компаний:', error);
    } finally {
      this.isLoading = false;
    }
    
    document.addEventListener('click', this.handleClickOutside);
  },
  
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  
  methods: {
    toggleDropdown() {
      this.isOpen = !this.isOpen
    },
    
    getCompanyLogo(company) {
      if (!company) return '/logo.png';
      if (company.logoUrl && typeof company.logoUrl === 'function') {
        const url = company.logoUrl();
        const ver = this.$store.state.logoVersion || 0;
        return url + `&cv=${ver}`;
      }
      if (company.logo && company.logo.length > 0) {
        // Добавляем timestamp для инвалидации кэша браузера
        const timestamp = company.updatedAt ? new Date(company.updatedAt).getTime() : Date.now();
        const ver = this.$store.state.logoVersion || 0;
        return `${import.meta.env.VITE_APP_BASE_URL}/storage/${company.logo}?v=${timestamp}&cv=${ver}`;
      }
      return '/logo.png';
    },
    
    async selectCompany(companyId) {
      this.isOpen = false;
      
      if (companyId === this.selectedCompanyId) {
        return;
      }
      
      try {
        await this.$store.dispatch('setCurrentCompany', companyId);
      } catch (error) {
        console.error('Ошибка при смене компании:', error);
        this.$store.dispatch('showNotification', {
          title: this.$t('errorChangingCompany'),
          subtitle: error.message || 'Не удалось переключить компанию',
          isDanger: true
        });
      }
    },
    
    
    handleClickOutside(event) {
      if (!this.$el.contains(event.target)) {
        this.isOpen = false
      }
    }
  }
}
</script>

<style scoped>
.company-dropdown {
  position: relative;
}

.dropdown-trigger {
  min-width: 120px;
  font-weight: 500;
  font-size: 14px;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  width: 256px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: 50;
}

.company-option {
  font-size: 14px;
  width: 100%;
  display: flex;
  align-items: center;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
}

.company-option:first-child {
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
}

.company-option:last-child {
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
}

.company-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.company-logo img {
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

/* Адаптивность для мобильных устройств */
@media (max-width: 768px) {
  .dropdown-trigger {
    min-width: 100px;
    padding: 6px 10px;
  }
  
  .dropdown-menu {
    width: 200px;
  }
  
  .company-option {
    padding: 8px 12px;
  }
}
</style>

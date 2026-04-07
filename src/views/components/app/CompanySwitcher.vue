<template>
  <div
    ref="dropdownRef"
    class="company-dropdown relative"
    :class="{ 'w-full': embedded }"
  >
    <button 
      type="button"
      class="dropdown-trigger flex items-center gap-2 border-0 bg-white px-3 py-2 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      :class="embedded ? 'w-full min-w-0 justify-between rounded-lg border border-gray-200 text-left' : 'rounded'"
      @click="toggleDropdown"
    >
      <template v-if="currentCompany">
        <div
          class="company-logo"
          :class="{ 'company-logo-fallback': currentCompanyLogoFallback }"
        >
          <img
            :key="`sw-h-${headerLogoKey}`"
            :src="getCompanyLogo(currentCompany)" 
            :alt="currentCompany?.name" 
            class="w-6 h-6 object-contain rounded"
            @error="onCurrentCompanyLogoError"
          >
        </div>
        <span class="company-name min-w-0 truncate">{{ currentCompany.name }}</span>
      </template>
      <template v-else>
        <span class="company-name flex items-center gap-1 min-w-[80px] justify-center">
          <SpinnerIcon size-class="text-xs" />
        </span>
      </template>
      <svg
        class="w-4 h-4 shrink-0 transition-transform"
        :class="[embedded ? 'block' : 'hidden sm:block', { 'rotate-180': isOpen }]"
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
      class="dropdown-menu absolute top-full z-50 mt-1 rounded border border-gray-200 bg-white shadow-lg"
      :class="embedded ? 'left-0 right-0 w-full' : (isMobile ? 'right-0 w-64' : 'left-0 w-64')"
    >
      <div class="py-1">
        <!-- Список компаний -->
        <button 
          v-for="company in companies" 
          :key="company.id"
          class="company-option w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 transition-colors"
          :class="{ 'bg-blue-50 text-blue-700': selectedCompanyId === company.id }"
          @click="selectCompany(company.id)"
        >
          <div
            class="company-logo"
            :class="{ 'company-logo-fallback': companyLogoFallbackIds[company.id] }"
          >
            <img
              :key="`sw-l-${company.id}-${logoVersionKey}`"
              :src="getCompanyLogo(company)" 
              :alt="company.name" 
              class="w-6 h-6 object-contain rounded"
              @error="onListCompanyLogoError(company, $event)"
            >
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
import { getCurrentInstance, onBeforeUnmount, ref } from 'vue';
import { onClickOutside, useWindowSize } from '@vueuse/core';
import SpinnerIcon from '@/views/components/app/SpinnerIcon.vue';
import { applyLogoImageFallback } from '@/constants/imageFallback';

export default {
  name: 'CompanySwitcher',
  components: {
    SpinnerIcon
  },
  props: {
    embedded: {
      type: Boolean,
      default: false
    }
  },
  emits: ['company-changed'],
  setup() {
    const dropdownRef = ref(null);
    const { width } = useWindowSize();
    const instance = getCurrentInstance();
    const stopClickOutside = onClickOutside(dropdownRef, () => {
      if (instance?.proxy) {
        instance.proxy.isOpen = false;
      }
    });
    onBeforeUnmount(stopClickOutside);
    return { dropdownRef, windowWidth: width };
  },
  data() {
    return {
      isOpen: false,
      isLoading: true,
      currentCompanyLogoFallback: false,
      companyLogoFallbackIds: {}
    }
  },
  computed: {
    isMobile() {
      return this.windowWidth < 640;
    },
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
    logoVersionKey() {
      return this.$store.state.logoVersion || 0;
    },
    headerLogoKey() {
      const c = this.currentCompany;
      if (!c) {
        return `0-${this.logoVersionKey}`;
      }
      return `${c.id}-${this.logoVersionKey}`;
    }
  },
  
  watch: {
    logoVersionKey() {
      this.resetCompanyLogoFallbackUi();
    },
    currentCompany: {
      handler(newCompany) {
        this.currentCompanyLogoFallback = false;
        if (newCompany && this.isLoading) {
          this.isLoading = false;
        }
      },
      immediate: true
    },
    '$store.state.appInitializing': {
      handler(initializing) {
        if (initializing === false) {
          this.runLoadIfNeeded();
        }
      }
    }
  },
  
  async mounted() {
    if (this.currentCompany) {
      this.isLoading = false;
    }
    if (this.$store.state.appInitializing) {
      return;
    }
    await this.runLoadIfNeeded();
  },
  methods: {
    applyLogoImageFallback,
    resetCompanyLogoFallbackUi() {
      this.currentCompanyLogoFallback = false;
      this.companyLogoFallbackIds = {};
    },
    onCurrentCompanyLogoError(event) {
      this.applyLogoImageFallback(event);
      this.currentCompanyLogoFallback = true;
    },
    onListCompanyLogoError(company, event) {
      this.applyLogoImageFallback(event);
      if (!company?.id) {
        return;
      }
      this.companyLogoFallbackIds = { ...this.companyLogoFallbackIds, [company.id]: true };
    },
    async runLoadIfNeeded() {
      try {
        if (this.companies.length === 0) {
          await this.$store.dispatch('loadUserCompanies');
        }
        if (!this.currentCompany && !this.$store.state.loadingFlags.currentCompany) {
          await this.$store.dispatch('loadCurrentCompany', { skipPermissionRefresh: true });
        }
        if (!this.selectedCompanyId && this.companies.length > 0) {
          await this.selectCompany(this.companies[0].id);
        }
      } catch (error) {
        console.error('Error loading companies:', error);
      } finally {
        this.isLoading = false;
      }
    },
    toggleDropdown() {
      this.isOpen = !this.isOpen
    },
    
    getCompanyLogo(company) {
      if (!company) return '/logo.png';
      const logoUrl = company.logoUrl?.();
      if (logoUrl) {
        const ver = this.$store.state.logoVersion || 0;
        return logoUrl + `&cv=${ver}`;
      }
      if (company.logo && company.logo.length > 0) {
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
        this.$emit('company-changed');
      } catch (error) {
        console.error('Error changing company:', error);
        this.$store.dispatch('showNotification', {
          title: this.$t('errorChangingCompany'),
          subtitle: error.message || this.$t('errorChangingCompanySubtitle'),
          isDanger: true
        });
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

.company-dropdown.w-full .dropdown-trigger {
  min-width: 0;
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

.company-logo-fallback img {
  border: none;
  box-shadow: none;
}

@media (max-width: 640px) {
  .dropdown-trigger {
    min-width: auto;
    padding: 6px 8px;
  }
  
  .dropdown-menu {
    width: 200px;
    right: 0;
    left: auto;
    max-width: calc(100vw - 16px);
  }
  
  .company-option {
    padding: 8px 10px;
    font-size: 13px;
  }
  
  .company-logo img {
    width: 20px;
    height: 20px;
  }
}
</style>

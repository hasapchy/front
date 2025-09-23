<template>
    <div class="shadow-sm px-4 py-1.5 mb-5 bg-white rounded">
        <div class="container">
            <div class="flex items-center justify-between">
                <div class="flex items-end gap-6">
                    <h1 class="text-xl font-semibold">{{ displayTitle }}</h1>

                    <div class="flex">
                        <router-link v-for="tab in binded" :key="tab.path" :to="tab.path"
                            class="text-[#337AB7] hover:text-[#3571A4] hover:underline font-semibold transition-all mr-4">
                            {{ tab.name }}
                        </router-link>
                    </div>
                </div>

                <div class="flex items-center gap-4">
                    <Search v-if="showSearch" />
                    <SoundToggle />
                    <CompanySwitcher @company-changed="onCompanyChanged" />
                    <LanguageSwitcher @language-changed="onLanguageChanged" />
                    <UserProfileDropdown v-if="$store.state.user" />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AuthController from '@/api/AuthController';
import SettingsController from '@/api/SettingsController';
import Search from '@/views/components/app/search/Search.vue';
import LanguageSwitcher from './LanguageSwitcher.vue';
import CompanySwitcher from './CompanySwitcher.vue';
import SoundToggle from './SoundToggle.vue';
import UserProfileDropdown from './UserProfileDropdown.vue';
import { eventBus } from '@/eventBus';

export default {
    components: {
        Search,
        LanguageSwitcher,
        CompanySwitcher,
        SoundToggle,
        UserProfileDropdown,
    },
    data() {
        const route = useRoute();
        const title = computed(() => route.meta.title ? this.$t(route.meta.title) : this.$t('accountingSystem'));
        const binded = computed(() => {
          if (route.meta.binded) {
            return route.meta.binded.map(tab => ({
              ...tab,
              name: this.$t(tab.name)
            }));
          }
          return [];
        });
        const showSearch = computed(() => route.meta.showSearch || false);
        return {
            title,
            binded,
            showSearch,
            settings: {
                company_name: '',
                company_logo: ''
            }
        };
    },
    
    async mounted() {
        await this.loadSettings();
        eventBus.on('settings-updated', this.loadSettings);
    },
    
    beforeUnmount() {
        eventBus.off('settings-updated', this.loadSettings);
    },
    
    methods: {
        async loadSettings() {
            try {
                const data = await SettingsController.getSettings();
                this.settings = data;
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        },
        
        onLanguageChanged(locale) {
            this.$forceUpdate();
        },
        
        onCompanyChanged(companyId) {
            this.$forceUpdate();
        }
    },
    
    computed: {
        displayTitle() {
            if (this.$route.path === '/' && this.settings.company_name) {
                return this.settings.company_name;
            }
            return this.title;
        }
    }
};
</script>
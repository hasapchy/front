<template>
    <div class="shadow-sm px-4 py-1.5 mb-5 bg-white rounded">
        <div class="container">
            <div class="flex items-center justify-between">
                <div class="flex items-end gap-6">
                    <h1 class="text-xl font-semibold">{{ displayTitle }}</h1>
                    <!-- Табы -->
                    <div class="flex">
                        <router-link v-for="tab in binded" :key="tab.path" :to="tab.path"
                            class="text-[#337AB7] hover:text-[#3571A4] hover:underline font-semibold transition-all mr-4">
                            {{ tab.name }}
                        </router-link>
                    </div>
                </div>

                <div class="flex items-center gap-4">
                    <Search v-if="showSearch" />
                    <LanguageSwitcher @language-changed="onLanguageChanged" />
                    <span v-if="$store.state.user" class="font-semibold mr-5">{{ $store.state.user.name }}</span>
                    <PrimaryButton :icon="'fas fa-sign-out-alt'" :onclick="logout" isLight>
                        {{ $t('logout') }}
                    </PrimaryButton>
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
import PrimaryButton from './buttons/PrimaryButton.vue';
import Search from '@/views/components/app/search/Search.vue';
import LanguageSwitcher from './LanguageSwitcher.vue';
import { eventBus } from '@/eventBus';

export default {
    components: {
        PrimaryButton,
        Search,
        LanguageSwitcher,
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
        // Слушаем события обновления настроек
        eventBus.on('settings-updated', this.loadSettings);
    },
    
    beforeUnmount() {
        // Удаляем слушатель события
        eventBus.off('settings-updated', this.loadSettings);
    },
    
    methods: {
        async logout() {
            await AuthController.logout();
            this.$store.state.user = null;
            this.$router.push('/auth/login');
        },
        
        async loadSettings() {
            try {
                const data = await SettingsController.getSettings();
                this.settings = data;
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        },
        
        onLanguageChanged(locale) {
            // Обновляем заголовок страницы при смене языка
            this.$forceUpdate();
        }
    },
    
    computed: {
        // Переопределяем title для отображения названия компании на главной странице
        displayTitle() {
            if (this.$route.path === '/' && this.settings.company_name) {
                return this.settings.company_name;
            }
            return this.title;
        }
    }
};
</script>
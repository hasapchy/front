<template>
    <div class="shadow-sm px-4 py-1.5 mb-5 bg-white rounded">
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
                    <span v-if="$store.state.user" class="font-semibold mr-5">{{ $store.state.user.name }}</span>
                    <PrimaryButton :icon="'fas fa-sign-out-alt'" :onclick="logout" isLight>
                        {{ $t('logout') }}
                    </PrimaryButton>
                </div>
            </div>
    </div>
</template>

<script>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AuthController from '@/api/AuthController';
import PrimaryButton from './buttons/PrimaryButton.vue';
import Search from '@/views/components/app/search/Search.vue';
import LanguageSwitcher from './LanguageSwitcher.vue';
import CompanySwitcher from './CompanySwitcher.vue';
import SoundToggle from './SoundToggle.vue';
import { eventBus } from '@/eventBus';

export default {
    components: {
        PrimaryButton,
        Search,
        LanguageSwitcher,
        CompanySwitcher,
        SoundToggle,
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
            showSearch
        };
    },
    
    
    methods: {
        async logout() {
            await AuthController.logout();
            this.$store.state.user = null;
            this.$router.push('/auth/login');
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
            // Если мы на главной странице, показываем "Моя компания"
            if (this.$route.path === '/') {
                return this.$t('myCompany');
            }
            return this.title;
        },
        currentCompany() {
            return this.$store.getters.currentCompany;
        }
    }
};
</script>
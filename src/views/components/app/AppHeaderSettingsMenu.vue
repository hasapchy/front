<template>
  <div
    ref="rootRef"
    class="relative"
  >
    <button
      type="button"
      class="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-[var(--nav-accent)] transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--nav-accent)]/40 dark:border-0 dark:bg-white dark:text-[var(--nav-accent)] dark:hover:bg-white/90"
      :aria-label="$t('headerSettings')"
      :aria-expanded="menuOpen"
      @click="menuOpen = !menuOpen"
    >
      <i class="fas fa-cog text-lg" />
    </button>
    <div
      v-show="menuOpen"
      class="absolute right-0 top-full z-[10000] mt-2 w-72 max-w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-gray-200 bg-white py-2 shadow-lg dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]"
    >
      <div class="hidden border-b border-gray-100 px-3 py-2.5 max-[1199px]:block dark:border-[var(--border-subtle)]">
        <div class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-[var(--text-secondary)]">
          {{ $t('company') }}
        </div>
        <CompanySwitcher embedded />
      </div>
      <div class="flex items-center justify-between border-b border-gray-100 px-3 py-2.5 dark:border-[var(--border-subtle)]">
        <span class="text-sm font-medium text-gray-800 dark:text-[var(--text-primary)]">{{ $t('soundLabel') }}</span>
        <SoundToggle size="sm" />
      </div>
      <div class="border-b border-gray-100 px-3 py-2.5 dark:border-[var(--border-subtle)]">
        <div class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-[var(--text-secondary)]">
          {{ $t('languageLabel') }}
        </div>
        <LanguageSwitcher
          embedded
          @language-changed="onLanguageChanged"
        />
      </div>
      <div class="px-3 py-2.5">
        <div class="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-[var(--text-secondary)]">
          {{ $t('themeLabel') }}
        </div>
        <div class="flex overflow-hidden rounded-lg border border-gray-200 dark:border-[var(--border-subtle)]">
          <button
            type="button"
            class="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm transition-colors"
            :class="themeLightButtonClass"
            @click="setUiTheme('light')"
          >
            <i class="fas fa-sun text-amber-500" />
            {{ $t('themeLight') }}
          </button>
          <button
            type="button"
            class="flex flex-1 items-center justify-center gap-1.5 border-l border-gray-200 py-2.5 text-sm transition-colors dark:border-[var(--border-subtle)]"
            :class="themeDarkButtonClass"
            @click="setUiTheme('dark')"
          >
            <i class="fas fa-moon text-sky-400" />
            {{ $t('themeDark') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { onClickOutside } from '@vueuse/core';
import { mapState } from 'vuex';
import SoundToggle from './SoundToggle.vue';
import LanguageSwitcher from './LanguageSwitcher.vue';
import CompanySwitcher from './CompanySwitcher.vue';

export default {
    name: 'AppHeaderSettingsMenu',
    components: {
        SoundToggle,
        LanguageSwitcher,
        CompanySwitcher
    },
    data() {
        return {
            menuOpen: false
        };
    },
    computed: {
        ...mapState({
            uiTheme: (state) => state.uiTheme
        }),
        themeLightButtonClass() {
            if (this.uiTheme === 'light') {
                return 'bg-gray-100 font-medium text-gray-900 dark:bg-[var(--surface-muted)] dark:text-[var(--text-primary)]';
            }
            return 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-[var(--surface-elevated)] dark:text-[var(--text-secondary)] dark:hover:bg-[var(--surface-muted)]';
        },
        themeDarkButtonClass() {
            if (this.uiTheme === 'dark') {
                return 'bg-slate-600 font-medium text-white dark:bg-[#3d4752] dark:text-[var(--text-primary)]';
            }
            return 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-[var(--surface-elevated)] dark:text-[var(--text-secondary)] dark:hover:bg-[var(--surface-muted)]';
        }
    },
    mounted() {
        this._stopClickOutside = onClickOutside(
            this.$refs.rootRef,
            () => {
                this.menuOpen = false;
            }
        );
    },
    beforeUnmount() {
        if (typeof this._stopClickOutside === 'function') {
            this._stopClickOutside();
        }
    },
    methods: {
        setUiTheme(theme) {
            this.$store.commit('SET_UI_THEME', theme);
        },
        onLanguageChanged() {
            this.menuOpen = false;
        }
    }
};
</script>

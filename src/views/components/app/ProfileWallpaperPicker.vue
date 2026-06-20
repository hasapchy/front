<template>
  <div class="border-t border-gray-100 px-3 py-2.5 dark:border-[var(--border-subtle)]">
    <div
      class="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-[var(--text-secondary)]"
    >
      <span class="text-base leading-none" aria-hidden="true">🖼️</span>
      <span>{{ $t('profileWallpaperLabel') }}</span>
    </div>
    <button
      type="button"
      class="flex w-full items-center gap-2.5 rounded-lg border border-gray-200 px-2 py-2 text-left transition-colors hover:border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--nav-accent)]/40 dark:border-[var(--border-subtle)] dark:hover:border-[var(--border-subtle)]"
      :disabled="loading"
      @click="openModal"
    >
      <div
        class="relative h-10 w-16 shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-[var(--surface-muted)]"
        :class="!selectedTheme || selectedTheme.id === 'default' ? 'flex items-center justify-center' : ''"
      >
        <template v-if="loading">
          <i class="fas fa-spinner fa-spin text-sm text-gray-400" />
        </template>
        <template v-else-if="!selectedTheme || selectedTheme.id === 'default'">
          <i class="fas fa-ban text-sm text-gray-400 dark:text-[var(--text-secondary)]" />
        </template>
        <img
          v-else-if="selectedPreview"
          :src="selectedPreview"
          alt=""
          class="h-full w-full object-cover"
        >
      </div>
      <div class="min-w-0 flex-1">
        <div class="truncate text-sm font-medium text-gray-800 dark:text-[var(--text-primary)]">
          {{ selectedLabel }}
        </div>
        <div class="truncate text-xs text-gray-500 dark:text-[var(--text-secondary)]">
          {{ $t('profileWallpaperChoose') }}
        </div>
      </div>
      <i class="fas fa-chevron-right shrink-0 text-xs text-gray-400 dark:text-[var(--text-secondary)]" />
    </button>

    <ProfileWallpaperModal
      :show="modalOpen"
      :catalog="catalog"
      :selected-id="selectedId"
      :ui-theme="uiTheme"
      :loading="loading"
      :saving="saving"
      @close-request="modalOpen = false"
      @select="selectTheme"
    />
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import ProfileWallpaperModal from '@/views/components/app/ProfileWallpaperModal.vue';
import {
  sortProfileWallpaperCatalog,
  wallpaperModeKind as resolveWallpaperModeKind,
} from '@/utils/profileWallpaper';
import { apiErrorMessage } from '@/api/apiErrorMessage';

export default {
  name: 'ProfileWallpaperPicker',
  components: {
    ProfileWallpaperModal,
  },
  props: {
    menuOpen: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['picker-opened'],
  data() {
    return {
      loading: false,
      saving: false,
      loaded: false,
      modalOpen: false,
    };
  },
  computed: {
    ...mapState({
      uiTheme: (state) => state.uiTheme,
    }),
    ...mapGetters(['profileWallpapersCatalog']),
    catalog() {
      const list = Array.isArray(this.profileWallpapersCatalog) ? this.profileWallpapersCatalog : [];
      return sortProfileWallpaperCatalog(list, this.uiTheme);
    },
    selectedId() {
      return this.$store.state.user?.profileWallpaper ?? null;
    },
    selectedTheme() {
      if (!this.selectedId) {
        return this.catalog.find((item) => item.id === 'default') ?? null;
      }
      return this.catalog.find((item) => item.id === this.selectedId) ?? null;
    },
    selectedLabel() {
      if (this.loading) {
        return this.$t('loading');
      }
      if (!this.selectedTheme) {
        return this.$t('profileWallpaperDefault');
      }
      const key = this.selectedTheme.label_key;
      if (key && this.$te(key)) {
        return this.$t(key);
      }
      return this.selectedTheme.id ?? this.$t('profileWallpaperDefault');
    },
    selectedPreview() {
      if (!this.selectedTheme || this.selectedTheme.id === 'default') {
        return null;
      }
      const kind = resolveWallpaperModeKind(this.selectedTheme);
      if (kind === 'light') {
        return this.selectedTheme?.previews?.light ?? null;
      }
      if (kind === 'dark') {
        return this.selectedTheme?.previews?.dark ?? null;
      }
      return this.selectedTheme?.previews?.light ?? this.selectedTheme?.previews?.dark ?? null;
    },
  },
  watch: {
    menuOpen: {
      immediate: true,
      handler(open) {
        if (open) {
          this.ensureCatalogLoaded();
        }
      },
    },
  },
  methods: {
    async openModal() {
      await this.ensureCatalogLoaded();
      this.modalOpen = true;
      this.$emit('picker-opened');
    },
    async ensureCatalogLoaded() {
      if (this.loaded || this.loading) {
        return;
      }
      this.loading = true;
      try {
        await this.$store.dispatch('loadProfileWallpapers');
        this.loaded = true;
      } catch (error) {
        this.$store.dispatch('showNotification', {
          title: this.$t('error'),
          subtitle: error?.message || apiErrorMessage('profileWallpapersGet'),
          isDanger: true,
        });
      } finally {
        this.loading = false;
      }
    },
    async selectTheme(themeId) {
      if (this.saving) {
        return;
      }
      const next = themeId === 'default' ? null : themeId;
      if ((this.selectedId ?? null) === (next ?? null)) {
        return;
      }
      this.saving = true;
      try {
        await this.$store.dispatch('saveProfileWallpaper', next);
      } catch (error) {
        this.$store.dispatch('showNotification', {
          title: this.$t('error'),
          subtitle: error?.message || apiErrorMessage('profileWallpaperUpdate'),
          isDanger: true,
        });
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

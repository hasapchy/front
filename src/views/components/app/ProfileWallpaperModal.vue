<template>
  <FiltersModal
    :show="show"
    :title="$t('profileWallpaperLabel')"
    footer-mode="none"
    panel-class="md:max-w-3xl md:min-w-0"
    @close-request="$emit('close-request')"
  >
    <div
      v-if="loading"
      class="py-8 text-center text-sm text-gray-500 dark:text-[var(--text-secondary)]"
    >
      {{ $t('loading') }}
    </div>
    <div
      v-else
      class="max-h-[min(60vh,32rem)] overflow-y-auto pr-1"
    >
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <button
          v-for="theme in catalog"
          :key="theme.id"
          type="button"
          class="group relative rounded-lg border text-left transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--nav-accent)]/40"
          :class="themeButtonClass(theme)"
          :aria-pressed="isSelected(theme.id)"
          :aria-label="themeLabel(theme)"
          :disabled="saving"
          @click="$emit('select', theme.id)"
        >
          <div
            class="relative aspect-[16/10] overflow-hidden rounded-t-[0.45rem] bg-gray-100 dark:bg-[var(--surface-muted)]"
            :class="theme.id === 'default' ? 'flex items-center justify-center' : ''"
          >
            <template v-if="theme.id === 'default'">
              <i class="fas fa-ban text-2xl text-gray-400 dark:text-[var(--text-secondary)]" />
            </template>
            <template v-else-if="wallpaperModeKind(theme) === 'both'">
              <div class="grid h-full grid-cols-2">
                <img
                  v-if="theme.previews?.light"
                  :src="theme.previews.light"
                  alt=""
                  class="h-full w-full object-cover"
                >
                <img
                  v-if="theme.previews?.dark"
                  :src="theme.previews.dark"
                  alt=""
                  class="h-full w-full object-cover"
                >
              </div>
            </template>
            <img
              v-else-if="primaryPreview(theme)"
              :src="primaryPreview(theme)"
              alt=""
              class="h-full w-full object-cover"
            >
            <div
              v-if="theme.id !== 'default'"
              class="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded bg-black/55 px-1 py-0.5 text-[10px] leading-none text-white"
            >
              <span
                v-if="wallpaperModeKind(theme) === 'light' || wallpaperModeKind(theme) === 'both'"
                aria-hidden="true"
              >☀️</span>
              <span
                v-if="wallpaperModeKind(theme) === 'dark' || wallpaperModeKind(theme) === 'both'"
                aria-hidden="true"
              >🌙</span>
            </div>
            <div
              v-if="isSelected(theme.id)"
              class="absolute inset-0 flex items-center justify-center bg-black/25"
            >
              <span class="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--nav-accent)] text-white shadow">
                <i class="fas fa-check text-sm" aria-hidden="true" />
              </span>
            </div>
          </div>
          <div class="px-2 py-2">
            <div class="truncate text-xs font-medium text-gray-800 dark:text-[var(--text-primary)]">
              {{ themeLabel(theme) }}
            </div>
            <div
              v-if="theme.id !== 'default'"
              class="truncate text-[10px] text-gray-500 dark:text-[var(--text-secondary)]"
            >
              {{ modeHint(theme) }}
            </div>
          </div>
        </button>
      </div>
    </div>
  </FiltersModal>
</template>

<script>
import FiltersModal from '@/views/components/app/forms/FiltersModal.vue';
import {
  isWallpaperAvailableInUiTheme,
  wallpaperModeKind as resolveWallpaperModeKind,
} from '@/utils/profileWallpaper';

export default {
  name: 'ProfileWallpaperModal',
  components: {
    FiltersModal,
  },
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    catalog: {
      type: Array,
      default: () => [],
    },
    selectedId: {
      type: String,
      default: null,
    },
    uiTheme: {
      type: String,
      default: 'light',
    },
    loading: {
      type: Boolean,
      default: false,
    },
    saving: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close-request', 'select'],
  methods: {
    wallpaperModeKind(theme) {
      return resolveWallpaperModeKind(theme);
    },
    isSelected(themeId) {
      if (themeId === 'default') {
        return !this.selectedId;
      }
      return this.selectedId === themeId;
    },
    themeLabel(theme) {
      const key = theme?.label_key;
      if (key && this.$te(key)) {
        return this.$t(key);
      }
      return theme?.id ?? '';
    },
    modeHint(theme) {
      const kind = this.wallpaperModeKind(theme);
      if (kind === 'light') {
        return this.$t('profileWallpaperLightOnly');
      }
      if (kind === 'dark') {
        return this.$t('profileWallpaperDarkOnly');
      }
      if (kind === 'both') {
        return this.$t('profileWallpaperBothModes');
      }
      return '';
    },
    primaryPreview(theme) {
      const kind = this.wallpaperModeKind(theme);
      if (kind === 'light') {
        return theme?.previews?.light ?? null;
      }
      if (kind === 'dark') {
        return theme?.previews?.dark ?? null;
      }
      return theme?.previews?.dark ?? theme?.previews?.light ?? null;
    },
    themeButtonClass(theme) {
      const selected = this.isSelected(theme.id);
      const available = theme.id === 'default' || isWallpaperAvailableInUiTheme(theme, this.uiTheme);
      const classes = [
        selected
          ? 'border-[color:var(--nav-accent)] ring-2 ring-[color:var(--nav-accent)]/35'
          : 'border-gray-200 dark:border-[var(--border-subtle)]',
      ];
      if (!available && theme.id !== 'default') {
        classes.push('opacity-50');
      }
      if (!this.saving) {
        classes.push('hover:border-gray-300 dark:hover:border-[var(--border-subtle)]');
      }
      return classes;
    },
  },
};
</script>

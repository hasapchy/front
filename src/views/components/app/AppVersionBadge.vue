<template>
  <div class="relative select-none z-[2000]">
    <button
      :class="buttonClasses"
      type="button"
      title="Сделайте двойной клик, чтобы увидеть изменения"
      @dblclick.stop="handleDoubleClick"
    >
      <i class="fas fa-code-branch text-[11px]" />
      <span>{{ versionLabel }}</span>
    </button>

    <teleport to="body">
      <transition name="fade">
        <div
          v-if="showNotes"
          class="fixed inset-0 flex items-center justify-center z-[3000]"
        >
          <div
            class="absolute inset-0 bg-white/60 backdrop-blur-sm dark:bg-black/55"
            @click="closeNotes"
          />
          <div class="relative w-full max-w-3xl mx-4 bg-white border border-gray-200 rounded-2xl shadow-2xl p-8 z-[3100] dark:bg-[var(--surface-elevated)] dark:border-white/10">
            <div class="flex items-center justify-between mb-4">
              <div>
                <p class="text-xs uppercase text-gray-400 tracking-wide dark:text-[var(--text-secondary)]">
                  Что обновилось
                </p>
                <p class="text-lg font-semibold text-gray-900 dark:text-[var(--text-primary)]">
                  v{{ selectedVersion.version }}
                </p>
                <p
                  v-if="loadedVersions.length > 1"
                  class="text-xs text-gray-500 mt-1 dark:text-[var(--text-secondary)]"
                >
                  Другую версию можно выбрать в списке
                </p>
              </div>
              <button
                class="text-gray-400 hover:text-gray-600 dark:text-[var(--text-secondary)] dark:hover:text-[var(--text-primary)]"
                type="button"
                @click="closeNotes"
              >
                <i class="fas fa-times " />
              </button>
            </div>
            <div
              v-if="loadedVersions.length > 1"
              class="mb-4"
            >
              <select
                class="mt-1 w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none ring-offset-2 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/15 dark:border-white/15 dark:bg-[var(--input-bg)] dark:text-[var(--text-primary)] dark:focus:border-[var(--nav-accent)] dark:focus:ring-[var(--nav-accent)]/25"
                :value="selectedVersionIndex"
                @change="onVersionSelectChange"
              >
                <option
                  v-for="(version, index) in loadedVersions"
                  :key="version.version"
                  :value="index"
                >
                  v{{ version.version }}
                </option>
              </select>
            </div>
            <ul class="list-disc list-outside text-gray-700 space-y-3 max-h-[420px] overflow-y-auto pl-6 dark:text-[var(--text-primary)]">
              <li
                v-for="(note, index) in releaseNotes"
                :key="index"
              >
                {{ note }}
              </li>
            </ul>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script>
import AppController from '@/api/AppController';

export default {
    name: 'AppVersionBadge',
    props: {
        variant: {
            type: String,
            default: 'light'
        }
    },
    data() {
        return {
            showNotes: false,
            selectedVersionIndex: 0,
            loadedVersions: []
        };
    },
    computed: {
        currentVersion() {
            return (this.loadedVersions && this.loadedVersions[0]) || { version: '', notes: [] };
        },
        selectedVersion() {
            return this.loadedVersions[this.selectedVersionIndex] || this.currentVersion;
        },
        versionLabel() {
            if (!this.currentVersion.version) {
                return 'v—';
            }
            return `v${this.currentVersion.version}`;
        },
        releaseNotes() {
            return this.selectedVersion.notes || [];
        },
        buttonClasses() {
            const base = 'inline-flex items-center gap-1 text-xs font-semibold transition-colors';
            if (this.variant === 'dark') {
                return `${base} text-gray-300 hover:text-white`;
            }
            return `${base} text-gray-500 hover:text-gray-800`;
        }
    },
    mounted() {
        this.loadVersions();
    },
    methods: {
        async loadVersions() {
            try {
                const versions = await AppController.getVersions();
                if (Array.isArray(versions) && versions.length > 0) {
                    this.loadedVersions = versions;
                    this.selectedVersionIndex = 0;
                }
            } catch {
                this.loadedVersions = [];
            }
        },
        handleDoubleClick() {
            this.showNotes = true;
            this.selectedVersionIndex = 0;
        },
        closeNotes() {
            this.showNotes = false;
        },
        selectVersion(index) {
            if (index >= 0 && index < this.loadedVersions.length) {
                this.selectedVersionIndex = index;
            }
        },
        onVersionSelectChange(event) {
            const index = Number(event?.target?.value);
            if (Number.isFinite(index)) {
                this.selectVersion(index);
            }
        }
    }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}

.fade-enter-to,
.fade-leave-from {
    opacity: 1;
    transform: translateY(0);
}
</style>


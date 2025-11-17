<template>
    <div class="relative select-none">
        <button
            class="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
            type="button"
            @click="handleClick"
            title="Сделайте несколько кликов, чтобы увидеть изменения"
        >
            <i class="fas fa-code-branch text-[11px]"></i>
            <span>{{ versionLabel }}</span>
        </button>

        <transition name="fade">
            <div
                v-if="showNotes"
                class="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-50"
            >
                <div class="flex items-center justify-between mb-2">
                    <div>
                        <p class="text-xs uppercase text-gray-400 tracking-wide">Что обновилось</p>
                        <p class="text-sm font-semibold text-gray-800">v{{ selectedVersion.version }}</p>
                    </div>
                    <button class="text-gray-400 hover:text-gray-600" type="button" @click="closeNotes">
                        <i class="fas fa-times text-sm"></i>
                    </button>
                </div>
                <div v-if="versions.length > 1" class="flex flex-wrap gap-2 mb-3">
                    <button
                        v-for="(version, index) in versions"
                        :key="version.version"
                        class="px-3 py-1 rounded-full text-xs font-semibold border transition-colors"
                        :class="index === selectedVersionIndex ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:border-gray-400'"
                        type="button"
                        @click="selectVersion(index)"
                    >
                        v{{ version.version }}
                    </button>
                </div>
                <ul class="list-disc list-inside text-xs text-gray-600 space-y-1 max-h-56 overflow-y-auto pr-1">
                    <li v-for="(note, index) in releaseNotes" :key="index">
                        {{ note }}
                    </li>
                </ul>
            </div>
        </transition>
    </div>
</template>

<script>
import { APP_VERSIONS, CURRENT_APP_VERSION } from '@/constants/appVersion';

const CLICK_THRESHOLD = 3;
const CLICK_TIMEOUT = 1500;

export default {
    name: 'AppVersionBadge',
    data() {
        return {
            clickCount: 0,
            clickTimer: null,
            showNotes: false,
            selectedVersionIndex: 0
        };
    },
    computed: {
        versions() {
            return APP_VERSIONS;
        },
        currentVersion() {
            return CURRENT_APP_VERSION;
        },
        selectedVersion() {
            return APP_VERSIONS[this.selectedVersionIndex] || this.currentVersion;
        },
        versionLabel() {
            return `v${this.currentVersion.version}`;
        },
        releaseNotes() {
            return this.selectedVersion.notes || [];
        }
    },
    methods: {
        handleClick() {
            this.clickCount += 1;

            if (this.clickCount >= CLICK_THRESHOLD) {
                this.showNotes = true;
                this.selectedVersionIndex = 0;
                this.resetClickTracking();
                return;
            }

            this.startClickTimer();
        },
        startClickTimer() {
            if (this.clickTimer) {
                clearTimeout(this.clickTimer);
            }
            this.clickTimer = setTimeout(() => {
                this.resetClickTracking();
            }, CLICK_TIMEOUT);
        },
        resetClickTracking() {
            if (this.clickTimer) {
                clearTimeout(this.clickTimer);
                this.clickTimer = null;
            }
            this.clickCount = 0;
        },
        closeNotes() {
            this.showNotes = false;
        },
        selectVersion(index) {
            if (index >= 0 && index < this.versions.length) {
                this.selectedVersionIndex = index;
            }
        },
        handleOutsideClick(event) {
            if (!this.showNotes) {
                return;
            }
            if (!this.$el.contains(event.target)) {
                this.closeNotes();
            }
        }
    },
    created() {
        document.addEventListener('click', this.handleOutsideClick);
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleOutsideClick);
        this.resetClickTracking();
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


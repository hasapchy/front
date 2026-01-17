<template>
    <div class="relative select-none z-[2000]">
        <button
            :class="buttonClasses"
            type="button"
            @dblclick.stop="handleDoubleClick"
            title="Сделайте двойной клик, чтобы увидеть изменения"
        >
            <i class="fas fa-code-branch text-[11px]"></i>
            <span>{{ versionLabel }}</span>
        </button>

        <teleport to="body">
            <transition name="fade">
                <div
                    v-if="showNotes"
                    class="fixed inset-0 flex items-center justify-center z-[3000]"
                >
                    <div class="absolute inset-0 bg-white bg-opacity-60 backdrop-blur-sm" @click="closeNotes"></div>
                    <div class="relative w-full max-w-3xl mx-4 bg-white border border-gray-200 rounded-2xl shadow-2xl p-8 z-[3100]">
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <p class="text-xs uppercase text-gray-400 tracking-wide">Что обновилось</p>
                                <p class="text-lg font-semibold text-gray-900">v{{ selectedVersion.version }}</p>
                                <p v-if="versions.length > 1" class="text-xs text-gray-500 mt-1">
                                    Чтобы посмотреть другую версию, переключите её ниже
                                </p>
                            </div>
                            <button class="text-gray-400 hover:text-gray-600" type="button" @click="closeNotes">
                                <i class="fas fa-times "></i>
                            </button>
                        </div>
                        <div v-if="versions.length > 1" class="flex flex-wrap gap-2 mb-4">
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
                        <ul class="list-disc list-outside  text-gray-700 space-y-3 max-h-[420px] overflow-y-auto pl-6">
                            <li v-for="(note, index) in releaseNotes" :key="index">
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
import { APP_VERSIONS, CURRENT_APP_VERSION } from '@/constants/appVersion';

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
            loadedVersions: null
        };
    },
    computed: {
        versions() {
            return this.loadedVersions || APP_VERSIONS;
        },
        currentVersion() {
            return (this.versions && this.versions[0]) || CURRENT_APP_VERSION;
        },
        selectedVersion() {
            return this.versions[this.selectedVersionIndex] || this.currentVersion;
        },
        versionLabel() {
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
    methods: {
        async loadVersions() {
            try {
                const versions = await AppController.getVersions();
                if (Array.isArray(versions) && versions.length > 0) {
                    this.loadedVersions = versions;
                    this.selectedVersionIndex = 0;
                }
            } catch (e) {
                this.loadedVersions = null;
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
            if (index >= 0 && index < this.versions.length) {
                this.selectedVersionIndex = index;
            }
        }
    },
    mounted() {
        this.loadVersions();
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


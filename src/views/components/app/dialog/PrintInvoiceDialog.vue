<template>
    <teleport to="body">
        <transition name="fade-dialog">
            <div v-if="dialog" class="relative z-50">
                <div class="fixed inset-0 z-10 overflow-y-auto pointer-events-none">
                    <div class="flex min-h-full items-center justify-center p-4 text-center">
                        <div
                            class="w-full max-w-md transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all pointer-events-auto"
                            @click.stop>
                            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div class="sm:flex sm:items-start">
                                    <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                        <h3 class="font-semibold text-gray-900 text-lg mb-4">
                                            {{ $t('printInvoice') || 'Распечатать счет' }}
                                        </h3>
                                        <div class="mt-2">
                                            <label class="block mb-2 text-sm font-semibold">
                                                {{ $t('selectPdfVariant') || 'Выберите вариант PDF' }}
                                            </label>
                                            <div class="space-y-2">
                                                <label class="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                                    <input type="checkbox" v-model="selectedVariants" value="short"
                                                        class="mr-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                    <span>{{ $t('shortPdf') || 'Краткий' }}</span>
                                                </label>
                                                <label class="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                                                    <input type="checkbox" v-model="selectedVariants" value="detailed"
                                                        class="mr-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                                    <span>{{ $t('detailedPdf') || 'Подробный' }}</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="my-4 flex space-x-2 mx-5 justify-end">
                                <PrimaryButton :onclick="onPrint" icon="fas fa-print"
                                    :disabled="selectedVariants.length === 0" :is-loading="loading">
                                    {{ $t('print') || 'Печать' }}
                                </PrimaryButton>
                                <PrimaryButton :onclick="onClose" icon="fas fa-times" :isLight="true">
                                    {{ $t('cancel') }}
                                </PrimaryButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </teleport>
</template>

<script>
import PrimaryButton from '../buttons/PrimaryButton.vue';

export default {
    components: {
        PrimaryButton
    },
    props: {
        dialog: {
            type: Boolean,
            required: true
        },
        loading: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close', 'print'],
    data() {
        return {
            selectedVariants: []
        };
    },
    watch: {
        dialog(newVal) {
            if (!newVal) {
                this.selectedVariants = [];
            }
        }
    },
    methods: {
        onClose() {
            this.$emit('close');
        },
        onPrint() {
            if (this.selectedVariants.length === 0) {
                return;
            }
            this.$emit('print', [...this.selectedVariants]);
        }
    }
};
</script>

<style>
.fade-dialog-enter-active,
.fade-dialog-leave-active {
    transition: opacity 0.15s ease-out, transform 0.15s ease-out;
}

.fade-dialog-enter-from,
.fade-dialog-leave-to {
    opacity: 0;
}

.fade-dialog-enter-to,
.fade-dialog-leave-from {
    opacity: 1;
}
</style>


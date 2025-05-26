<template>
    <teleport to="body">
        <transition name="fade-dialog">
            <div v-if="dialog" class="fixed z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                <div class="fixed inset-0 bg-black/50 transition-opacity" aria-hidden="true"></div>
                <div class="fixed inset-0 z-50 w-screen overflow-y-auto">
                    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <div
                            class="transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div class="sm:flex sm:items-start">
                                    <div
                                        class="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:size-10">
                                        <svg class="size-6 text-red-600" fill="none" viewBox="0 0 24 24"
                                            stroke-width="1.5" stroke="currentColor" aria-hidden="true"
                                            data-slot="icon">
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                        </svg>
                                    </div>
                                    <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 class="text-base font-semibold text-gray-900" id="modal-title">{{ title }}
                                        </h3>
                                        <div class="mt-2">
                                            <p class="text-sm text-gray-500">{{ descr }}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="my-4 flex space-x-2 mx-5 justify-end">
                                <PrimaryButton :is-danger="true" :onclick="onConfirm">{{ confirmText }}</PrimaryButton>
                                <PrimaryButton :is-light="true" :onclick="onLeave">{{ leaveText }}</PrimaryButton>
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
        title: {
            type: String,
            required: false,
            default: 'Подтверждение'
        },
        descr: {
            type: String,
            required: false,
            default: 'Вы действительно хотите закрыть? Изменения не сохранятся.'
        },
        confirmText: {
            type: String,
            required: false,
            default: 'Закрыть'
        },
        leaveText: {
            type: String,
            required: false,
            default: 'Остаться'
        },
        dialog: {
            type: Boolean,
            required: true
        },
        onLeave: {
            type: Function,
            required: true
        },
        onConfirm: {
            type: Function,
            required: true
        }
    }
}
</script>

<style scoped>
.fade-dialog-enter-active,
.fade-dialog-leave-active {
    transition: opacity 0.15s ease-out;
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
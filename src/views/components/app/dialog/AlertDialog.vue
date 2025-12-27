<template>
    <teleport to="body">
        <transition name="fade-dialog">
            <div v-if="dialog" class="relative z-50">
                <div class="fixed inset-0 transition-opacity"></div>
                <div class="fixed inset-0 z-10 overflow-y-auto">
                    <div class="flex min-h-full items-center justify-center p-4 text-center">
                        <div
                            class="w-full max-w-lg transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all">
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
                                        <h3 class="font-semibold text-gray-900 text-base" id="modal-title" style="font-size: 16px;">{{ displayTitle }}
                                        </h3>
                                        <div class="mt-2">
                                            <p class="text-sm text-gray-500" v-html="displayDescr">
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="my-4 flex space-x-2 mx-5 justify-end">
                                <PrimaryButton :is-danger="true" :onclick="onConfirm" :is-loading="confirmLoading">{{ displayConfirmText }}
                                </PrimaryButton>
                                <PrimaryButton :is-light="true" :onclick="onLeave">{{ displayLeaveText }}</PrimaryButton>
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
            default: ''
        },
        descr: {
            type: String,
            required: false,
            default: ''
        },
        confirmText: {
            type: String,
            required: false,
            default: ''
        },
        leaveText: {
            type: String,
            required: false,
            default: ''
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
        },
        confirmLoading: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    computed: {
        displayTitle() {
            return this.title || this.$t('attention');
        },
        displayDescr() {
            return this.descr || this.$t('confirmCloseWithoutSaving');
        },
        displayConfirmText() {
            return this.confirmText || this.$t('closeWithoutSaving');
        },
        displayLeaveText() {
            return this.leaveText || this.$t('stay');
        }
    }
}
</script>

<style>
.fade-dialog-enter-active,
.fade-dialog-leave-active {
    transition: opacity 0.15s ease-out, transform 0.15s ease-out;
}

.fade-dialog-enter-from,
.fade-dialog-leave-to


    {
    opacity: 0;

}

.fade-dialog-enter-to,
.fade-dialog-leave-from {
    opacity: 1;

}
</style>
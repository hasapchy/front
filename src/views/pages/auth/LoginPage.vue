<template>
    <div>
        <div class="flex justify-center items-center flex-col min-h-screen bg-gray-100 p-3 md:p-5">
            <div ref="container" :class="[
                'bg-white rounded-xl shadow-2xl relative overflow-hidden w-full max-w-4xl min-h-[400px] md:min-h-[480px]',
                isRightPanelActive ? 'right-panel-active' : ''
            ]">
                <div :class="[
                    'relative md:absolute top-0 left-0 w-full md:w-1/2 h-full transition-all duration-600 ease-in-out',
                    isRightPanelActive ? 'hidden md:block md:translate-x-full z-10' : 'z-20'
                ]">
                    <form
                        class="bg-white flex items-center justify-center flex-col px-6 py-8 md:px-12 md:py-10 h-full text-center"
                        method="POST" action="/" @submit.prevent="login">
                        <div class="mb-6 w-full flex justify-center">
                            <img src="/logo.png" alt="Lebizli Tehnologiya Merkezi"
                                class="h-16 w-auto object-contain mx-auto" />
                        </div>
                        <h1 class="font-bold text-2xl md:text-3xl mb-2.5 mt-0">{{ $t('login') }}</h1>
                        <span class="text-xs text-gray-500 mb-5">{{ $t('loginUseAccount') }}</span>

                        <input id="email" type="email" :placeholder="$t('enterEmail')" @input="clearErrors" :class="[
                            'bg-gray-100 border-none py-3 px-4 my-2 w-full text-sm focus:outline-none',
                            v$.email.$error ? 'border-2 border-red-500 bg-red-50' : ''
                        ]" name="email" required autocomplete="email" v-model="email" autofocus />
                        <ValidationErrorMessage :show="v$.email.$error" :messages="v$.email.$errors" />

                        <div class="relative w-full">
                            <input id="password" :type="showPassword ? 'text' : 'password'"
                                :placeholder="$t('enterPassword')" @input="clearErrors" :class="[
                                    'bg-gray-100 border-none py-3 px-4 my-2 w-full text-sm focus:outline-none pr-12',
                                    v$.password.$error ? 'border-2 border-red-500 bg-red-50' : ''
                                ]" name="password" required autocomplete="current-password" v-model="password" />
                            <button type="button" @click="togglePasswordVisibility"
                                class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-500 p-0 flex items-center hover:text-gray-700"
                                :title="$t('togglePasswordVisibility')">
                                <svg v-if="!showPassword" class="h-5 w-5" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            </button>
                        </div>
                        <ValidationErrorMessage :show="v$.password.$error" :messages="v$.password.$errors" />

                        <div class="flex items-center w-full my-4 text-xs">
                            <input type="checkbox" name="remember" id="remember" v-model="remember"
                                class="w-auto mr-2 cursor-pointer" />
                            <label for="remember" class="cursor-pointer select-none">{{ $t('rememberMe') }}</label>
                        </div>

                        <button type="submit" :disabled="loading"
                            class="rounded-full border border-[#337AB7] bg-[#337AB7] text-white text-xs font-bold py-3 px-11 uppercase tracking-wider transition-transform duration-80 cursor-pointer mt-2.5 w-full disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 focus:outline-none hover:bg-[#3571A4] hover:border-[#3571A4]">
                            {{ loading ? $t('loggingIn') : $t('login') }}
                        </button>
                        <button type="button" @click="togglePanel"
                            class="md:hidden mt-4 text-xs text-gray-500 hover:text-gray-700 focus:outline-none">
                            {{ $t('noAccountSignUp') }}
                        </button>
                    </form>
                </div>

                <div :class="[
                    'relative md:absolute top-0 left-0 w-full md:w-1/2 h-full transition-all duration-600 ease-in-out z-10',
                    isRightPanelActive ? 'block opacity-100 z-50 md:translate-x-full md:animate-show' : 'hidden md:block opacity-0 md:opacity-0'
                ]">
                    <form
                        class="bg-white flex items-center justify-center flex-col px-6 py-8 md:px-12 md:py-10 h-full text-center"
                        method="POST" action="/" @submit.prevent="handleSignUp">
                        <div class="mb-6 w-full flex justify-center">
                            <img src="/logo.png" alt="Lebizli Tehnologiya Merkezi"
                                class="h-16 w-auto object-contain mx-auto" />
                        </div>
                        <h1 class="font-bold text-2xl md:text-3xl mb-2.5 mt-0">{{ $t('createAccount') }}</h1>
                        <span class="text-xs text-gray-500 mb-5">{{ $t('useEmailForRegistration') }}</span>

                        <input type="text" :placeholder="$t('name')" v-model="signUpForm.name"
                            class="bg-gray-100 border-none py-3 px-4 my-2 w-full text-sm focus:outline-none" />

                        <input type="email" :placeholder="$t('enterEmail')" v-model="signUpForm.email"
                            class="bg-gray-100 border-none py-3 px-4 my-2 w-full text-sm focus:outline-none" />

                        <div class="relative w-full">
                            <input :type="showSignUpPassword ? 'text' : 'password'" :placeholder="$t('enterPassword')"
                                v-model="signUpForm.password"
                                class="bg-gray-100 border-none py-3 px-4 my-2 w-full text-sm focus:outline-none pr-12" />
                            <button type="button" @click="showSignUpPassword = !showSignUpPassword"
                                class="absolute right-4 top-1/2 transform -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-500 p-0 flex items-center hover:text-gray-700"
                                :title="$t('togglePasswordVisibility')">
                                <svg v-if="!showSignUpPassword" class="h-5 w-5" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            </button>
                        </div>

                        <button type="submit"
                            class="rounded-full border border-[#337AB7] bg-[#337AB7] text-white text-xs font-bold py-3 px-11 uppercase tracking-wider transition-transform duration-80 cursor-pointer mt-2.5 w-full active:scale-95 focus:outline-none hover:bg-[#3571A4] hover:border-[#3571A4]">
                            {{ $t('signUp') }}
                        </button>
                        <button type="button" @click="togglePanel"
                            class="md:hidden mt-4 text-xs text-gray-500 hover:text-gray-700 focus:outline-none">
                            {{ $t('alreadyHaveAccountSignIn') }}
                        </button>
                    </form>
                </div>

                <div id="login-overlay" :class="[
                    'hidden md:block absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-600 ease-in-out z-100',
                    isRightPanelActive ? '-translate-x-full' : ''
                ]">
                    <div :class="[
                        'bg-gradient-to-r from-[#337AB7] to-[#3571A4] text-white relative -left-full h-full w-[200%] transition-transform duration-600 ease-in-out',
                        isRightPanelActive ? 'translate-x-1/2' : 'translate-x-0'
                    ]">
                        <div :class="[
                            'absolute flex items-center justify-center flex-col px-10 text-center top-0 h-full w-1/2 right-0 transition-transform duration-600 ease-in-out',
                            isRightPanelActive ? 'translate-x-0' : 'translate-x-0'
                        ]">
                            <h1 class="font-bold text-3xl mb-5 mt-0 text-white">
                                {{ $t('welcomeBack') }}
                            </h1>
                            <p class="text-sm font-light leading-5 tracking-wide my-5 mx-0 text-white">
                                {{ $t('signInToContinue') }}
                            </p>

                            <button type="button" @click="togglePanel"
                                class="rounded-full border border-white bg-transparent text-white text-xs font-bold py-3 px-11 uppercase tracking-wider transition-transform duration-80 cursor-pointer mt-2.5 focus:outline-none active:scale-95">
                                {{ $t('signUp') }}
                            </button>

                            <div class="mt-10 w-full">
                                <p class="font-bold text-lg mb-5">Lebizli Tehnologiya Merkezi</p>
                                <div class="flex flex-col gap-2.5 items-center">
                                    <a href="tel:+99312753713"
                                        class="text-white text-sm no-underline flex items-center gap-2 transition-opacity duration-300 hover:opacity-80">
                                        <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        +993 12 75 37 13
                                    </a>
                                    <a href="mailto:info@ltm.studio"
                                        class="text-white text-sm no-underline flex items-center gap-2 transition-opacity duration-300 hover:opacity-80">
                                        <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        info@ltm.studio
                                    </a>
                                    <a href="https://ltm.studio" target="_blank"
                                        class="text-white text-sm no-underline flex items-center gap-2 transition-opacity duration-300 hover:opacity-80">
                                        <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                        ltm.studio
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div :class="[
                            'absolute flex items-center justify-center flex-col px-10 text-center top-0 h-full w-1/2 left-0 transition-transform duration-600 ease-in-out',
                            isRightPanelActive ? 'translate-x-0' : '-translate-x-1/5'
                        ]">
                            <h1 class="font-bold text-3xl mb-5 mt-0 text-white">
                                {{ $t('helloFriend') }}
                            </h1>
                            <p class="text-sm font-light leading-5 tracking-wide my-5 mx-0 text-white">
                                {{ $t('enterDetailsToStart') }}
                            </p>

                            <button type="button" @click="togglePanel"
                                class="rounded-full border border-white bg-transparent text-white text-xs font-bold py-3 px-11 uppercase tracking-wider transition-transform duration-80 cursor-pointer mt-2.5 focus:outline-none active:scale-95">
                                {{ $t('login') }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script>
import useVuelidate from '@vuelidate/core';
import { required, email, minLength } from '@vuelidate/validators';
import ValidationErrorMessage from '@/views/components/app/forms/ValidationErrorMessage.vue';
import AuthController from '@/api/AuthController';
import { isSimpleWorkerOnly } from '@/utils/userUtils';
import notificationMixin from '@/mixins/notificationMixin';

export default {
    components: {
        ValidationErrorMessage
    },
    mixins: [notificationMixin],
    data() {
        return {
            v$: useVuelidate(),
            email: '',
            password: '',
            remember: false,
            loading: false,
            showPassword: false,
            isRightPanelActive: false,
            showSignUpPassword: false,
            signUpForm: {
                name: '',
                email: '',
                password: ''
            }
        }
    },
    validations() {
        return {
            email: { required, email },
            password: { required, minLength: minLength(6) }
        }
    },
    methods: {
        togglePanel() {
            this.isRightPanelActive = !this.isRightPanelActive;
        },
        async login() {
            this.v$.$validate();
            if (this.v$.$error) {
                return;
            }
            this.loading = true;
            try {
                const loginData = await AuthController.login(this.email, this.password, this.remember);

                if (isSimpleWorkerOnly(loginData.user)) {
                    this.$store.dispatch('setUser', loginData.user);
                    this.$store.dispatch('setPermissions', loginData.user?.permissions || []);
                    this.$router.push('/simple-orders');
                } else {
                    const userData = await AuthController.getUser();
                    this.$store.dispatch('setUser', userData.user);
                    this.$store.dispatch('setPermissions', userData.user?.permissions || []);
                    this.$router.push('/');
                }
            } catch (error) {
                let errorTitle = this.$t('authErrorTitle');
                let errorMessage = this.$t('invalidLoginOrPassword');

                if (error.response?.status === 429) {
                    errorTitle = this.$t('tooManyAttempts');
                    errorMessage = this.$t('waitBeforeRetry');
                } else if (error.response?.status === 403) {
                    errorTitle = this.$t('accessDenied');
                    errorMessage = error.response?.data?.message || this.$t('accountDisabled');
                } else if (error.response?.status === 401) {
                    errorMessage = error.response?.data?.message || error.response?.data?.error || this.$t('invalidLoginOrPassword');
                } else if (error.response?.data?.error) {
                    errorMessage = error.response.data.error;
                } else if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.message) {
                    errorMessage = error.message;
                }

                this.showNotification(errorTitle, errorMessage, true);
            }
            this.loading = false;
        },
        handleSignUp() {
            this.showNotification(this.$t('registration'), this.$t('registrationUnavailable'), true);
        },
        clearErrors() {
            this.v$.$reset();
        },
        togglePasswordVisibility() {
            this.showPassword = !this.showPassword;
        }
    }
}
</script>

<style scoped>
.duration-600 {
    transition-duration: 600ms;
}

.z-100 {
    z-index: 100;
}

@keyframes show {

    0%,
    49.99% {
        opacity: 0;
        z-index: 1;
    }

    50%,
    100% {
        opacity: 1;
        z-index: 50;
    }
}

.animate-show {
    animation: show 0.6s;
}

@media (max-width: 768px) {
    .form-container {
        width: 100% !important;
    }

    .overlay-container {
        display: none;
    }

    #login-overlay {
        display: none !important;
    }
}

@media (min-width: 768px) {
    #login-overlay {
        display: block !important;
    }
}
</style>
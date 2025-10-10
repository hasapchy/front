<template>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-12">
        <div class="w-full max-w-md">
            <!-- Logo or Title Section -->
            <div class="text-center mb-8 animate-fade-in">
                <div class="inline-flex items-center justify-center mb-4">
                    <img 
                        src="/logo.jpg" 
                        alt="Lebizli tehnologia merezi" 
                        class="h-20 w-auto object-contain"
                    >
                </div>
                <h1 class="text-3xl font-bold text-gray-800 mb-2">Добро пожаловать</h1>
                <p class="text-gray-600">Войдите в свой аккаунт</p>
            </div>

            <!-- Login Card -->
            <div class="bg-white shadow-2xl rounded-2xl overflow-hidden animate-slide-up">
                <div class="px-8 py-10">
                    <form method="POST" action="/" @submit.prevent="login">
                        <!-- Email Field -->
                        <div class="mb-6">
                            <label for="email" class="block text-gray-700 text-sm font-semibold mb-2">
                                Email
                            </label>
                            <input 
                                id="email" 
                                type="email" 
                                @input="clearErrors"
                                :class="[
                                    'w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2',
                                    v$.email.$error 
                                        ? 'border-red-500 focus:ring-red-500' 
                                        : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                                ]"
                                name="email" 
                                required 
                                autocomplete="email" 
                                v-model="email" 
                                autofocus
                                placeholder="example@email.com"
                            >
                            <ValidationErrorMessage :show="v$.email.$error" :messages="v$.email.$errors" />
                        </div>

                        <!-- Password Field -->
                        <div class="mb-6">
                            <label for="password" class="block text-gray-700 text-sm font-semibold mb-2">
                                Пароль
                            </label>
                            <div class="relative">
                                <input 
                                    id="password" 
                                    :type="showPassword ? 'text' : 'password'" 
                                    @input="clearErrors"
                                    :class="[
                                        'w-full px-4 pr-12 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2',
                                        v$.password.$error 
                                            ? 'border-red-500 focus:ring-red-500' 
                                            : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                                    ]"
                                    name="password" 
                                    required 
                                    autocomplete="current-password" 
                                    v-model="password"
                                    placeholder="Введите пароль"
                                >
                                <button
                                    type="button"
                                    @click="togglePasswordVisibility"
                                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none"
                                    title="Показать/скрыть пароль"
                                >
                                    <svg v-if="!showPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                </button>
                            </div>
                            <ValidationErrorMessage :show="v$.password.$error" :messages="v$.password.$errors" />
                        </div>

                        <!-- Remember Me Checkbox -->
                        <div class="mb-6">
                            <div class="flex items-center">
                                <input 
                                    class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer" 
                                    type="checkbox" 
                                    name="remember"
                                    id="remember" 
                                    v-model="remember"
                                >
                                <label class="ml-2 text-sm text-gray-700 cursor-pointer select-none" for="remember">
                                    Запомнить меня
                                </label>
                            </div>
                        </div>

                        <!-- Login Button -->
                        <PrimaryButton 
                            :onclick="login" 
                            :is-loading="loading" 
                            :is-info="true" 
                            :is-full="true"
                            class="shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                        >
                            Войти
                        </PrimaryButton>
                    </form>
                </div>
            </div>

            <!-- Footer - Company Info -->
            <div class="text-center mt-8 animate-fade-in-delay">
                <div class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg px-6 py-5 mb-4">
                    <div class="flex items-center justify-center mb-3">
                        <div class="w-12 h-12 flex items-center justify-center mr-3">
                            <img 
                                src="https://ltm.studio/assets/images/ltm.png" 
                                alt="Lebizli tehnologia merezi" 
                                class="h-12 w-auto object-contain"
                            >
                        </div>
                        <div class="text-left">
                            <p class="text-sm font-semibold text-gray-800">Разработано компанией</p>
                            <p class="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Lebizli tehnologia merezi</p>
                        </div>
                    </div>
                    
                    <div class="border-t border-gray-200 pt-3 mt-3 space-y-2">
                        <div class="flex items-center justify-center text-sm text-gray-600 hover:text-blue-600 transition-colors">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <a href="tel:+99312753713" class="hover:underline">+993 12 75 37 13</a>
                        </div>
                        
                        <div class="flex items-center justify-center text-sm text-gray-600 hover:text-blue-600 transition-colors">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <a href="mailto:info@ltm.studio" class="hover:underline">info@ltm.studio</a>
                        </div>
                        
                        <div class="flex items-center justify-center text-sm text-gray-600 hover:text-blue-600 transition-colors">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            <a href="https://ltm.studio" target="_blank" class="hover:underline">ltm.studio</a>
                        </div>
                    </div>
                </div>
                
                <p class="text-sm text-gray-600">
                    © 2025 Lebizli tehnologia merezi. Все права защищены
                </p>
            </div>
        </div>
    </div>
</template>

<script>
import useVuelidate from '@vuelidate/core';
import { required, email, minLength } from '@vuelidate/validators';
import ValidationErrorMessage from '@/views/components/app/forms/ValidationErrorMessage.vue';
import AuthController from '@/api/AuthController';

import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';

export default {
    components: {
        ValidationErrorMessage,
        PrimaryButton
    },
    data() {
        return {
            v$: useVuelidate(),
            email: '',
            password: '',
            remember: false,
            loading: false,
            showPassword: false
        }
    },
    validations() {
        return {
            email: { required, email },
            password: { required, minLength: minLength(6) }
        }
    },
    methods: {
        async login() {
            this.v$.$validate();
            if (this.v$.$error) {
                return;
            }
            this.loading = true;
            try {
                await AuthController.login(this.email, this.password, this.remember);
                const userData = await AuthController.getUser();
                this.$store.dispatch('setUser', userData.user);
                this.$store.dispatch('setPermissions', userData.permissions);

                this.$router.push('/');
            } catch (error) {
                const errorMessage = error.response?.data?.error || error.message || 'Ошибка авторизации';
                alert(errorMessage);
            }
            this.loading = false;

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
@keyframes fade-in {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes slide-up {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fade-in-delay {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in {
    animation: fade-in 0.6s ease-out;
}

.animate-slide-up {
    animation: slide-up 0.6s ease-out 0.2s both;
}

.animate-fade-in-delay {
    animation: fade-in-delay 0.8s ease-out 0.5s both;
}

/* Hover эффект для кнопки */
button:hover svg {
    transform: scale(1.1);
    transition: transform 0.2s ease;
}

/* Плавное появление иконок */
a:hover svg {
    transform: translateX(2px);
    transition: transform 0.2s ease;
}

/* Пульсация логотипа компании */
@keyframes pulse-subtle {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
}

.bg-white\/80:hover img {
    animation: pulse-subtle 2s ease-in-out infinite;
}

/* Плавный поворот логотипа при загрузке */
img {
    transition: transform 0.3s ease;
}

img:hover {
    transform: scale(1.05);
}
</style>
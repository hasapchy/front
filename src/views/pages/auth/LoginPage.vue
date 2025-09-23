<template>
    <div class="container mx-auto px-4">
        <div class="flex justify-center items-center h-screen">
            <div class="w-full max-w-md">
                <div class="bg-white shadow-md rounded-lg">
                    <div class="bg-gray-200 px-6 py-4 rounded-t-lg">Вход</div>

                    <div class="px-6 py-4">
                        <form method="POST" action="/">
                            <div class="mb-4">
                                <label for="email" class="block text-gray-700 text-sm font-bold mb-2">Email</label>
                                <div>
                                    <input id="email" type="email" @input="clearErrors"
                                        :class="{ 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline': true, 'border-red-500': v$.email.$error }"
                                        name="email" required autocomplete="email" v-model="email" autofocus>
                                    <ValidationErrorMessage :show="v$.email.$error" :messages="v$.email.$errors" />
                                </div>
                            </div>

                            <div class="mb-4">
                                <label for="password" class="block text-gray-700 text-sm font-bold mb-2">Пароль</label>

                                <div>
                                    <input id="password" type="password" @input="clearErrors"
                                        :class="{ 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline': true, 'border-red-500': v$.password.$error }"
                                        name="password" required autocomplete="current-password" v-model="password">
                                    <ValidationErrorMessage :show="v$.password.$error"
                                        :messages="v$.password.$errors" />

                                </div>
                            </div>

                            <div class="mb-4">
                                <div class="flex items-center">
                                    <input class="form-check-input mr-2 leading-tight" type="checkbox" name="remember"
                                        id="remember" v-model="remember">
                                    <label class="text-sm" for="remember">
                                        Запомнить меня
                                    </label>
                                </div>
                            </div>
                            <PrimaryButton :onclick="login" :is-loading="loading" :is-info="true" :is-full="true">Войти
                            </PrimaryButton>
                        </form>
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
            loading: false
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
                const user = await AuthController.getUser();
                this.$store.dispatch('setUser', user);
                this.$store.dispatch('setPermissions', user.permissions);

                this.$router.push('/');
            } catch (error) {
                const errorMessage = error.response?.data?.error || error.message || 'Ошибка авторизации';
                alert(errorMessage);
            }
            this.loading = false;

        },
        clearErrors() {
            this.v$.$reset();
        }
    }
}

</script>
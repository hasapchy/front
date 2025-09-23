<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ $t('editProfile') }}</h2>
        
        <form>
            <!-- Photo Upload -->
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('profilePhoto') }}</label>
                <div>
                    <input 
                        type="file" 
                        @change="onFileChange" 
                        ref="imageInput"
                    >
                </div>
                <div v-if="selected_image" class="mt-2 ml-3 p-3 bg-gray-100 rounded">
                    <img :src="selected_image" alt="Selected Image" class="w-32 h-32 object-cover rounded">
                    <button @click="() => { this.selected_image = null; this.image = null }"
                        class="mt-2 text-red-500 text-sm">{{ $t('removeImage') }}</button>
                </div>
                <div v-else-if="$store.state.user?.photo && $store.state.user.photo !== ''" class="mt-2 ml-3 p-3 bg-gray-100 rounded">
                    <img :src="getUserPhotoSrc($store.state.user)" alt="Current Photo" class="w-32 h-32 object-cover rounded">
                    <button @click="() => { this.$store.state.user.photo = '' }"
                        class="mt-2 text-red-500 text-sm">{{ $t('removeImage') }}</button>
                </div>
            </div>

            <!-- Name -->
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('name') }}</label>
                <input 
                    v-model="form.name" 
                    type="text" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <!-- Email -->
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('email') }}</label>
                <input 
                    v-model="form.email" 
                    type="email" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <!-- Current Password -->
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('currentPassword') }}</label>
                <input 
                    v-model="form.currentPassword" 
                    type="password" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    :placeholder="$t('enterCurrentPassword')"
                />
            </div>

            <!-- New Password -->
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('newPassword') }}</label>
                <input 
                    v-model="form.newPassword" 
                    type="password" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    :placeholder="$t('enterNewPassword')"
                />
            </div>

        </form>
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">
        </PrimaryButton>
    </div>

    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import UsersController from '@/api/UsersController';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import userPhotoMixin from '@/mixins/userPhotoMixin';

export default {
    mixins: [getApiErrorMessage, formChangesMixin, userPhotoMixin],
    emits: ['saved', 'saved-error', 'close-request'],
    components: { PrimaryButton, AlertDialog },
    data() {
        return {
            saveLoading: false,
            form: {
                name: '',
                email: '',
                currentPassword: '',
                newPassword: ''
            },
            selected_image: null,
            image: '',
        };
    },
    computed: {
        userPhoto() {
            if (this.$store.state.user?.photo) {
                return `${import.meta.env.VITE_APP_BASE_URL}/storage/${this.$store.state.user.photo}`;
            }
            return null;
        }
    },
    mounted() {
        this.loadUserData();
    },
    methods: {
        loadUserData() {
            this.$nextTick(() => {
                this.saveInitialState();
            });
        },

        onFileChange(event) {
            const file = event.target.files[0];
            if (file) {
                this.selected_image = URL.createObjectURL(file);
            }
        },


        handleCloseRequest() {
            if (this.checkForChanges()) {
                this.closeConfirmDialog = true;
            } else {
                this.closeForm();
            }
        },

        getFormState() {
            return {
                name: this.form.name,
                email: this.form.email,
                currentPassword: this.form.currentPassword,
                newPassword: this.form.newPassword,
                selected_image: this.selected_image,
                image: this.image
            };
        },

        confirmClose() {
            this.closeConfirmDialog = false;
            this.closeForm();
        },

        cancelClose() {
            this.closeConfirmDialog = false;
        },

        closeForm() {
            this.selected_image = null;
            this.image = '';
            if (this.$refs.imageInput) {
                this.$refs.imageInput.value = null;
            }
            this.$emit('close-request');
        },


        async save() {
            this.saveLoading = true;
            try {
                const updateData = {
                    name: this.form.name,
                    email: this.form.email,
                };
                
                if (this.form.currentPassword) {
                    updateData.current_password = this.form.currentPassword;
                }
                
                if (this.form.newPassword) {
                    updateData.password = this.form.newPassword;
                }
                
                if (this.$store.state.user && this.$store.state.user.photo === '') {
                    updateData.photo = '';
                }
                
                const savedUser = await UsersController.updateProfile(updateData, this.$refs.imageInput?.files[0]);
                
                this.$store.commit('SET_USER', savedUser.user);
                
                this.form.name = savedUser.user.name;
                this.form.email = savedUser.user.email;
                this.form.currentPassword = '';
                this.form.newPassword = '';
                
                if (savedUser.user && savedUser.user.photo) {
                    this.selected_image = this.getUserPhotoSrc(savedUser.user);
                    this.image = savedUser.user.photo;
                } else {
                    this.selected_image = null;
                    this.image = '';
                }
                if (this.$refs.imageInput) {
                    this.$refs.imageInput.value = null;
                }
                
                this.resetFormChanges();
                this.$emit('saved');
            } catch (e) {
                this.$emit('saved-error', this.getApiErrorMessage(e));
            }
            this.saveLoading = false;
        }
    },
    watch: {
        '$store.state.user': {
            handler(newUser) {
                if (newUser) {
                    this.form = {
                        name: newUser.name || '',
                        email: newUser.email || '',
                        currentPassword: '',
                        newPassword: ''
                    };
                    this.selected_image = this.getUserPhotoSrc(newUser);
                    this.image = newUser.photo || '';
                }
            },
            deep: true,
            immediate: true
        }
    }
};
</script>

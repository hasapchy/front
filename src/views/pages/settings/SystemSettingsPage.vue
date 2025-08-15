<template>
    <div class="flex flex-col overflow-auto h-full p-4">
       <div class="mb-4">
            <label class="required">{{ $t('companyName') }}</label>
            <input 
                type="text" 
                v-model="form.company_name" 
                :placeholder="$t('enterCompanyName')"
            />
        </div>

        <div class="mb-4">
            <label class="">{{ $t('companyLogo') }}</label>
            <div class="flex items-center space-x-4">
                <div class="flex-1">
                    <input 
                        type="file" 
                        @change="handleLogoChange"
                        accept="image/*"
                        ref="logoInput"
                    />
                    <div class="text-xs text-gray-500 mt-1">
                        {{ $t('recommendedSize') }}. {{ $t('supportedFormats') }}
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-4">
            <PrimaryButton 
                icon="fas fa-save" 
                :onclick="saveSettings" 
                :is-loading="saveLoading"
                :disabled="!$store.getters.hasPermission('system_settings_update')">
                {{ $t('save') }}
            </PrimaryButton>
        </div>
    </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import SettingsController from '@/api/SettingsController';
import SettingsDto from '@/dto/app/SettingsDto';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import { eventBus } from '@/eventBus';

export default {
    name: 'SystemSettingsPage',
    
    components: {
        PrimaryButton
    },
    
    mixins: [getApiErrorMessage, formChangesMixin],
    
    data() {
        return {
            form: new SettingsDto(),
            currentLogo: '',
            saveLoading: false
        };
    },
    
    async mounted() {
        await this.loadSettings();
    },
    
    methods: {
        getFormState() {
            return {
                company_name: this.form.company_name,
                company_logo: this.form.company_logo
            };
        },
        
        async loadSettings() {
            try {
                const data = await SettingsController.getSettings();
                this.form = new SettingsDto(data);
                this.currentLogo = data.company_logo;
                this.resetFormChanges();
            } catch (error) {
                this.$store.dispatch('showError', this.getApiErrorMessage(error));
            }
        },
        
        handleLogoChange(event) {
            const file = event.target.files[0];
            if (file) {
                this.form.company_logo = file;
                this.markFormChanged();
            }
        },
        
        async saveSettings() {
            if (!this.$store.getters.hasPermission('system_settings_update')) {
                this.$store.dispatch('showError', this.$t('noPermissionSettings'));
                return;
            }

            this.saveLoading = true;
            try {
                await SettingsController.updateSettings(this.form);
                this.$store.dispatch('showSuccess', this.$t('settingsSavedSuccessfully'));
                await this.loadSettings(); // Перезагрузить настройки
                this.resetFormChanges();
                
                // Отправляем событие об обновлении настроек
                eventBus.emit('settings-updated');
            } catch (error) {
                this.$store.dispatch('showError', this.getApiErrorMessage(error));
            } finally {
                this.saveLoading = false;
            }
        }
    }
};
</script> 
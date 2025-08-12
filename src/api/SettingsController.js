import api from './axiosInstance';

class SettingsController {
    async getSettings() {
        try {
            const response = await api.get('/settings');
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении настроек:', error);
            throw error;
        }
    }

    async updateSettings(data) {
        try {
            if (data.company_logo instanceof File) {
                const formData = new FormData();
                formData.append('company_name', data.company_name || '');
                formData.append('company_logo', data.company_logo);

                const response = await api.post('/settings', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                return response.data;
            } else {
                const response = await api.post('/settings', {
                    company_name: data.company_name || ''
                });
                return response.data;
            }
        } catch (error) {
            console.error('Ошибка при обновлении настроек:', error);
            throw error;
        }
    }
}

export default new SettingsController();
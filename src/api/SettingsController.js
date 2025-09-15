import api from './axiosInstance';

class SettingsController {
    async getSettings(companyId = null) {
        try {
            const params = companyId ? { company_id: companyId } : {};
            const response = await api.get('/settings', { params });
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении настроек:', error);
            throw error;
        }
    }

    async getUserCompanies() {
        try {
            const response = await api.get('/settings/user-companies');
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении компаний пользователя:', error);
            throw error;
        }
    }

    async updateSettings(data) {
        try {
            if (data.company_logo instanceof File) {
                const formData = new FormData();
                formData.append('company_name', data.company_name || '');
                formData.append('company_logo', data.company_logo);
                if (data.company_id) {
                    formData.append('company_id', data.company_id);
                }

                const response = await api.post('/settings', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                return response.data;
            } else {
                const response = await api.post('/settings', {
                    company_name: data.company_name || '',
                    company_id: data.company_id || null
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
import api from './axiosInstance';

export default {
    async getItems(page = 1, search = null, dateFilter = 'all_time', startDate = null, endDate = null) {
        const params = {
            page,
            search,
            date_filter: dateFilter,
            start_date: startDate,
            end_date: endDate
        };

        // Удаляем пустые параметры
        Object.keys(params).forEach(key => {
            if (params[key] === null || params[key] === undefined || params[key] === '') {
                delete params[key];
            }
        });

        const response = await api.get('/project_transactions', { params });
        return response.data;
    },

    async storeItem(data) {
        const response = await api.post('/project_transactions', data);
        return response.data;
    },

    async updateItem(id, data) {
        const response = await api.put(`/project_transactions/${id}`, data);
        return response.data;
    },

    async deleteItem(id) {
        const response = await api.delete(`/project_transactions/${id}`);
        return response.data;
    },

    async getItem(id) {
        const response = await api.get(`/project_transactions/${id}`);
        return response.data;
    },

    async getTotalAmount(dateFilter = 'all_time', startDate = null, endDate = null) {
        const params = {
            date_filter: dateFilter,
            start_date: startDate,
            end_date: endDate
        };

        // Удаляем пустые параметры
        Object.keys(params).forEach(key => {
            if (params[key] === null || params[key] === undefined || params[key] === '') {
                delete params[key];
            }
        });

        const response = await api.get('/project_transactions/total', { params });
        return response.data;
    },

    async getProjectIncomes(projectId, page = 1, search = null, dateFilter = 'all_time', startDate = null, endDate = null) {
        const params = {
            project_id: projectId,
            page,
            search,
            date_filter: dateFilter,
            start_date: startDate,
            end_date: endDate
        };

        // Удаляем пустые параметры
        Object.keys(params).forEach(key => {
            if (params[key] === null || params[key] === undefined || params[key] === '') {
                delete params[key];
            }
        });

        const response = await api.get('/transactions/project-incomes', { params });
        return response.data;
    }
};

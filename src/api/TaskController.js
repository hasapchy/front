import axiosInstance from './axiosInstance';

class TaskController {
    async getItems(page = 1, search = '', status = '', perPage = 20) {
        const params = {
            page,
            per_page: perPage,
        };
        
        if (search) params.search = search;
        if (status && status !== 'all') params.status = status;
        
        const response = await axiosInstance.get('/tasks', { params });
        return response.data;
    }

    async getItem(id) {
        const response = await axiosInstance.get(`/tasks/${id}`);
        return response.data;
    }

    async createItem(data) {
        const response = await axiosInstance.post('/tasks', data);
        return response.data;
    }

    async updateItem(id, data) {
        const response = await axiosInstance.put(`/tasks/${id}`, data);
        return response.data;
    }

    async deleteItem(id) {
        const response = await axiosInstance.delete(`/tasks/${id}`);
        return response.data;
    }

    async completeTask(id) {
        const response = await axiosInstance.post(`/tasks/${id}/complete`);
        return response.data;
    }

    async acceptTask(id) {
        const response = await axiosInstance.post(`/tasks/${id}/accept`);
        return response.data;
    }

    async returnTask(id) {
        const response = await axiosInstance.post(`/tasks/${id}/return`);
        return response.data;
    }
}

export default new TaskController();

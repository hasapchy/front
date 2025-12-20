import BaseController from './BaseController';
import PaginatedResponse from '@/dto/app/PaginatedResponseDto';
import TaskDto from '@/dto/task/TaskDto';
import api from './axiosInstance';

class TaskController extends BaseController {
    static async getItems(page = 1, search = '', status = '', perPage = 20, dateFrom = null, dateTo = null) {
        const params = {};
        
        if (search) params.search = search;
        if (status && status !== 'all' && status !== '') params.status = status;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        
        const data = await super.getItems('/tasks', page, perPage, params);
        
        const items = TaskDto.fromApiArray(data.data || []);

        
        const response = new PaginatedResponse(
            items,
            data.meta?.current_page || 1,
            data.meta?.next_page || null,
            data.meta?.last_page || 1,
            data.meta?.total || 0
        );
        return response;
    }

    static async getItem(id) {
        const data = await super.getItem('/tasks', id);
        if (!data || !data.data) {
            return null;
        }
        // Backend возвращает { data: TaskResource }, а не { item: ... }
        return TaskDto.fromApiArray([data.data])[0] || null;
    }

    static async createItem(item) {
        return await super.storeItem('/tasks', item);
    }

    static async updateItem(id, item) {
        return await super.updateItem('/tasks', id, item);
    }

    static async deleteItem(id) {
        return await super.deleteItem('/tasks', id);
    }

    static async completeTask(id) {
        return await super.handleRequest(
            async () => {
                const response = await api.post(`/tasks/${id}/complete`);
                return response.data;
            },
            `Ошибка при завершении задачи: ${id}`
        );
    }

    static async acceptTask(id) {
        return await super.handleRequest(
            async () => {
                const response = await api.post(`/tasks/${id}/accept`);
                return response.data;
            },
            `Ошибка при принятии задачи: ${id}`
        );
    }

    static async returnTask(id) {
        return await super.handleRequest(
            async () => {
                const response = await api.post(`/tasks/${id}/return`);
                return response.data;
            },
            `Ошибка при возврате задачи: ${id}`
        );
    }

    static async uploadFiles(id, files) {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files[]', file);
        });
        return await super.handleRequest(
            async () => {
                const response = await api.post(`/tasks/${id}/files`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                return response.data.files;
            },
            `Ошибка при загрузке файлов задачи: ${id}`
        );
    }

    static async deleteFile(id, filePath) {
        return await super.handleRequest(
            async () => {
                const response = await api.post(`/tasks/${id}/delete-file`, {
                    path: filePath
                });
                return response.data.files;
            },
            `Ошибка при удалении файла задачи: ${id}`
        );
    }
}

export default TaskController;

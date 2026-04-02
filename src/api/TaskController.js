import BaseController from './BaseController';
import { apiErrorMessage } from './apiErrorMessage';
import PaginatedResponse from '@/dto/app/PaginatedResponseDto';
import TaskDto from '@/dto/task/TaskDto';

class TaskController extends BaseController {
    static async getItems(page = 1, search = '', status = '', perPage = 20, dateFrom = null, dateTo = null) {
        const params = {};
        
        if (search) params.search = search;
        if (status && status !== 'all' && status !== '') params.status = status;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        
        const data = await super.getItems('/tasks', page, perPage, params);
        
        const items = TaskDto.fromApiArray(data.items);

        
        const response = new PaginatedResponse(
            items,
            data.current_page,
            data.next_page,
            data.last_page,
            data.total
        );
        return response;
    }
 
    static async getItem(id) {
        const data = await super.getItem('/tasks', id);
        return TaskDto.fromApi(data);
    }

    static async getOverdueCount() {
        const data = await super.getData('/tasks/overdue-count');
        return data.count;
    }

    static async createItem(item) {
        return super.storeItem('/tasks', item);
    }

    static async updateItem(id, item) {
        return super.updateItem('/tasks', id, item);
    }

    static async deleteItem(id) {
        return super.deleteItem('/tasks', id);
    }

    static async completeTask(id) {
        return super.post(`/tasks/${id}/complete`);
    }

    static async acceptTask(id) {
        return super.post(`/tasks/${id}/accept`);
    }

    static async returnTask(id) {
        return super.post(`/tasks/${id}/return`);
    }

    static async uploadFiles(id, files) {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files[]', file);
        });
        return super.handleRequest(
            async () => {
                const response = await super.post(`/tasks/${id}/files`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                return response.data;
            },
            apiErrorMessage('taskFilesLoad', { id })
        );
    }

    static async deleteFile(id, filePath) {
        return super.handleRequest(
            async () => {
                const response = await super.post(`/tasks/${id}/delete-file`, {
                    path: filePath
                });
                return response.data;
            },
            apiErrorMessage('taskFileDelete', { id })
        );
    }
}

export default TaskController;

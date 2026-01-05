import api from './axiosInstance';
import ProjectTransactionDto from '../dto/project/ProjectTransactionDto';
import PaginatedResponse from '@/dto/app/PaginatedResponseDto';
import BaseController from './BaseController';

export default class ProjectTransactionController extends BaseController {
    static async getItems(projectId, params = {}) {
        return super.handleRequest(
            async () => {
                const response = await api.get(`/projects/${projectId}/transactions`, { params });
                const items = ProjectTransactionDto.fromApiArray(response.data.items || []);
                return new PaginatedResponse(
                    items,
                    response.data.current_page,
                    response.data.next_page,
                    response.data.last_page,
                    response.data.total
                );
            },
            'Error fetching project transactions:'
        );
    }

    static async getListItems(projectId) {
        return super.handleRequest(
            async () => {
                const response = await api.get(`/projects/${projectId}/transactions/all`);
                return ProjectTransactionDto.fromApiArray(response.data || []);
            },
            'Error fetching all project transactions:'
        );
    }

    static async getItem(id) {
        return super.handleRequest(
            async () => {
                const response = await api.get(`/project-transactions/${id}`);
                return ProjectTransactionDto.fromApi(response.data.item);
            },
            'Error fetching project transaction:'
        );
    }

    static async storeItem(projectId, item) {
        return super.handleRequest(
            async () => {
                const transactionData = {
                    project_id: projectId,
                    user_id: item.userId || item.user_id,
                    type: item.type,
                    amount: item.amount,
                    currency_id: item.currencyId || item.currency_id,
                    category_id: item.categoryId || item.category_id || null,
                    note: item.note || null,
                    date: item.date
                };

                const response = await api.post(`/projects/${projectId}/transactions`, transactionData);
                return {
                    item: ProjectTransactionDto.fromApi(response.data.item),
                    message: response.data.message
                };
            },
            'Error creating project transaction:'
        );
    }

    static async updateItem(id, item) {
        return super.handleRequest(
            async () => {
                const transactionData = {
                    type: item.type,
                    amount: item.amount,
                    currency_id: item.currencyId || item.currency_id,
                    category_id: item.categoryId || item.category_id || null,
                    note: item.note || null,
                    date: item.date
                };

                const response = await api.put(`/project-transactions/${id}`, transactionData);
                return {
                    item: ProjectTransactionDto.fromApi(response.data.item),
                    message: response.data.message
                };
            },
            'Error updating project transaction:'
        );
    }

    static async deleteItem(id) {
        return super.handleRequest(
            async () => {
                const response = await api.delete(`/project-transactions/${id}`);
                return {
                    message: response.data.message
                };
            },
            'Error deleting project transaction:'
        );
    }
}


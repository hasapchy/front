import api from './axiosInstance';
import ProjectContractDto from '../dto/project/ProjectContractDto';
import PaginatedResponse from '@/dto/app/PaginatedResponseDto';
import BaseController from './BaseController';

export default class ProjectContractController extends BaseController {
    static async getItems(projectId, params = {}) {
        return super.handleRequest(
            async () => {
                const response = await api.get(`/projects/${projectId}/contracts`, { params });
                const items = ProjectContractDto.fromApiArray(response.data.items || []);
                return new PaginatedResponse(
                    items,
                    response.data.current_page,
                    response.data.next_page,
                    response.data.last_page,
                    response.data.total
                );
            },
            'Error fetching project contracts:'
        );
    }

    static async getListItems(projectId) {
        return super.handleRequest(
            async () => {
                const response = await api.get(`/projects/${projectId}/contracts/all`);
                return ProjectContractDto.fromApiArray(response.data || []);
            },
            'Error fetching all project contracts:'
        );
    }

    static async getItem(id) {
        return super.handleRequest(
            async () => {
                const response = await api.get(`/contracts/${id}`);
                return ProjectContractDto.fromApiArray([response.data.item])[0] || null;
            },
            'Error fetching contract:'
        );
    }

    static async storeItem(projectId, item) {
        return super.handleRequest(
            async () => {
                const contractData = {
                    ...item,
                    projectId: projectId,
                    id: null
                };
                const contractDto = ProjectContractDto.fromApiArray([contractData])[0];

                const response = await api.post(`/projects/${projectId}/contracts`, contractDto.toApi());
                return {
                    item: ProjectContractDto.fromApiArray([response.data.item])[0] || null,
                    message: response.data.message
                };
            },
            'Error creating contract:'
        );
    }

    static async updateItem(id, item) {
        return super.handleRequest(
            async () => {
                const contractData = {
                    ...item,
                    id: id
                };
                const contractDto = ProjectContractDto.fromApiArray([contractData])[0];

                const response = await api.put(`/contracts/${id}`, contractDto.toApi());
                return {
                    item: ProjectContractDto.fromApiArray([response.data.item])[0] || null,
                    message: response.data.message
                };
            },
            'Error updating contract:'
        );
    }

    static async deleteItem(id) {
        return super.handleRequest(
            async () => {
                const response = await api.delete(`/contracts/${id}`);
                return {
                    message: response.data.message
                };
            },
            'Error deleting contract:'
        );
    }
}

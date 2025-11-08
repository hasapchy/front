import api from './axiosInstance';
import ProjectContractDto from '../dto/project/ProjectContractDto';
import PaginatedResponse from '@/dto/app/PaginatedResponseDto';

class ProjectContractController {
    async getItems(projectId, params = {}) {
        try {
            const response = await api.get(`/projects/${projectId}/contracts`, { params });
            const items = ProjectContractDto.fromApiArray(response.data.items);
            const paginatedResponse = new PaginatedResponse(
                items,
                response.data.current_page,
                response.data.next_page,
                response.data.last_page,
                response.data.total
            );
            return {
                success: true,
                data: paginatedResponse
            };
        } catch (error) {
            console.error('Error fetching project contracts:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async getAllItems(projectId) {
        try {
            const response = await api.get(`/projects/${projectId}/contracts/all`);
            return {
                success: true,
                items: ProjectContractDto.fromApiArray(response.data)
            };
        } catch (error) {
            console.error('Error fetching all project contracts:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async getItem(id) {
        try {
            const response = await api.get(`/contracts/${id}`);
            return {
                success: true,
                item: ProjectContractDto.fromApiArray([response.data.item])[0] || null
            };
        } catch (error) {
            console.error('Error fetching contract:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async storeItem(projectId, item) {
        try {
            const contractData = {
                ...item,
                projectId: projectId,
                id: null
            };
            const contractDto = ProjectContractDto.fromApiArray([contractData])[0];

            const response = await api.post(`/projects/${projectId}/contracts`, contractDto.toApi());
            return {
                success: true,
                item: ProjectContractDto.fromApiArray([response.data.item])[0] || null,
                message: response.data.message
            };
        } catch (error) {
            console.error('Error creating contract:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async updateItem(id, item) {
        try {
            const contractData = {
                ...item,
                id: id
            };
            const contractDto = ProjectContractDto.fromApiArray([contractData])[0];

            const response = await api.put(`/contracts/${id}`, contractDto.toApi());
            return {
                success: true,
                item: ProjectContractDto.fromApiArray([response.data.item])[0] || null,
                message: response.data.message
            };
        } catch (error) {
            console.error('Error updating contract:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async deleteItem(id) {
        try {
            const response = await api.delete(`/contracts/${id}`);
            return {
                success: true,
                message: response.data.message
            };
        } catch (error) {
            console.error('Error deleting contract:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }
}

export default new ProjectContractController();

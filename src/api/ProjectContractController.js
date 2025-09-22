import api from './axiosInstance';
import ProjectContractDto from '../dto/project/ProjectContractDto';

class ProjectContractController {
    async getItems(projectId, params = {}) {
        try {
            const response = await api.get(`/projects/${projectId}/contracts`, { params });
            return {
                success: true,
                data: {
                    items: response.data.data.items.map(item => ProjectContractDto.fromApi(item)),
                    currentPage: response.data.data.current_page,
                    lastPage: response.data.data.last_page,
                    perPage: response.data.data.per_page,
                    total: response.data.data.total
                }
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
                items: response.data.data.map(item => ProjectContractDto.fromApi(item))
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
                item: ProjectContractDto.fromApi(response.data.data)
            };
        } catch (error) {
            console.error('Error fetching contract:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    async createItem(projectId, data) {
        try {
            const contractDto = new ProjectContractDto(
                null,
                projectId,
                data.number,
                data.amount,
                data.currencyId,
                data.currencyName,
                data.currencyCode,
                data.currencySymbol,
                data.date,
                data.returned,
                data.files,
                data.note
            );

            const response = await api.post(`/projects/${projectId}/contracts`, contractDto.toApi());
            return {
                success: true,
                item: ProjectContractDto.fromApi(response.data.data),
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

    async updateItem(id, data) {
        try {
            const contractDto = new ProjectContractDto(
                id,
                data.projectId,
                data.number,
                data.amount,
                data.currencyId,
                data.currencyName,
                data.currencyCode,
                data.currencySymbol,
                data.date,
                data.returned,
                data.files,
                data.note
            );

            const response = await api.put(`/contracts/${id}`, contractDto.toApi());
            return {
                success: true,
                item: ProjectContractDto.fromApi(response.data.data),
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

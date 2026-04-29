import ProjectContractDto from '../dto/project/ProjectContractDto';
import PaginatedResponse from '@/dto/app/PaginatedResponseDto';
import BaseController from './BaseController';

export default class ProjectContractController extends BaseController {
    static async getItems(projectId, params = {}) {
        return super.handleRequest(
            async () => {
                const {
                    page = 1,
                    perPage = 20,
                    ...queryParams
                } = params;
                const data = await super.getItems(`/projects/${projectId}/contracts`, page, perPage, queryParams);
                const items = ProjectContractDto.fromApiArray(data.items);
                return new PaginatedResponse(
                    items,
                    data.current_page,
                    data.next_page,
                    data.last_page,
                    data.total
                );
            },
            'Error fetching project contracts:'
        );
    }

    static async getListItems(projectId) {
        return super.handleRequest(
            async () => {
                const data = await super.getData(`/projects/${projectId}/contracts/all`);
                return ProjectContractDto.fromApiArray(data);
            },
            'Error fetching all project contracts:'
        );
    }

    static async getItem(id) {
        return super.handleRequest(
            async () => {
                const data = await super.getData(`/contracts/${id}`);
                return ProjectContractDto.fromApi(data);
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
                const contractDto = ProjectContractDto.fromObject(contractData);

                const response = await super.post(`/projects/${projectId}/contracts`, contractDto.toApi());
                return {
                    item: ProjectContractDto.fromApi(response.data.item),
                    message: response.message
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
                const contractDto = ProjectContractDto.fromObject(contractData);

                const response = await super.patch(`/contracts/${id}`, contractDto.toApi());
                return {
                    item: ProjectContractDto.fromApi(response.data.item),
                    message: response.message
                };
            },
            'Error updating contract:'
        );
    }

    static async deleteItem(id) {
        return super.handleRequest(
            async () => {
                const response = await super.delete(`/contracts/${id}`);
                return {
                    message: response.message
                };
            },
            'Error deleting contract:'
        );
    }
    static async getAllItems(params = {}) {
        return super.handleRequest(
            async () => {
                const {
                    page = 1,
                    perPage = 20,
                    ...queryParams
                } = params;
                const data = await super.getItems('/contracts', page, perPage, queryParams);
                const items = ProjectContractDto.fromApiArray(data.items);
                return new PaginatedResponse(
                    items,
                    data.current_page,
                    data.next_page,
                    data.last_page,
                    data.total
                );
            },
            'Error fetching all contracts:'
        );
    }

}

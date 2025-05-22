import PaginatedResponse from '@/dto/app/PaginatedResponseDto';
import api from './axiosInstance';
import ClientDto from '@/dto/client/ClientDto';

export default class ClientController {
    static async getItems(page = 1) {
        try {
            const response = await api.get(`/clients?page=${page}`);
            const data = response.data;
            console.log(data);
            // Преобразуем полученные данные в DTO
            const items = data.items.map(item => {
                return new ClientDto(
                    item.id,
                    item.client_type,
                    item.balance,
                    item.is_supplier,
                    item.is_conflict,
                    item.first_name,
                    item.last_name,
                    item.contact_person,
                    item.address,
                    item.note,
                    item.status,
                    item.discount_type,
                    item.discount,
                    item.created_at,
                    item.updated_at,
                    item.emails,
                    item.phones,
                 
                );
            });

            const paginatedResponse = new PaginatedResponse(items, data.current_page, data.next_page, data.last_page, data.total);

            return paginatedResponse;
        } catch (error) {
            console.error('Ошибка при получении клиентов:', error);
            throw error;
        }
    }

    static async search(term) {
        try {
            const response = await api.get(`/clients/search?search_request=${term}`);
            const data = response.data;
            console.log(data);
            // Преобразуем полученные данные в DTO
            const items = data.map(item => {
                return new ClientDto(
                    item.id,
                    item.client_type,
                    item.balance,
                    item.is_supplier,
                    item.is_conflict,
                    item.first_name,
                    item.last_name,
                    item.contact_person,
                    item.address,
                    item.note,
                    item.status,
                    item.discount_type,
                    item.discount,
                    item.created_at,
                    item.updated_at,
                    item.emails,
                    item.phones,
                   
                );
            });
            return items;
        } catch (error) {
            console.error('Ошибка при поиске клиентов:', error);
            throw error;
        }
    }

    // static async getAllItems() {
    //     try {
    //         const response = await api.get(`/categories/all`);
    //         const data = response.data;
    //         console.log(data);
    //         // Преобразуем полученные данные в DTO
    //         const items = data.map(item => {
    //             return new CategoryDto(
    //                 item.id,
    //                 item.name,
    //                 item.parent_id,
    //                 item.parent_name,
    //                 item.user_id,
    //                 item.user_name,
    //                 item.users,
    //                 item.created_at,
    //                 item.updated_at,
    //             );
    //         });
    //         return items;
    //     } catch (error) {
    //         console.error('Ошибка при получении категорий:', error);
    //         throw error;
    //     }
    // }

    static async storeItem(item) {
        try {
            const { data } = await api.post('/clients', item);
            return data;
        } catch (error) {
            console.error('Ошибка при создании клиента:', error);
            throw error;
        }
    }

    static async updateItem(id, item) {
        try {
            const { data } = await api.put(`/clients/${id}`, item);
            return data;
        } catch (error) {
            console.error('Ошибка при обновлении клиента:', error);
            throw error;
        }
    }

    // static async deleteItem(id) {
    //     try {
    //         const { data } = await api.delete(`/categories/${id}`);
    //         return data;
    //     } catch (error) {
    //         console.error('Ошибка при удалении категории:', error);
    //         throw error;
    //     }
    // }
}
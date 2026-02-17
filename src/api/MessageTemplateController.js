import BaseController from './BaseController';
import PaginatedResponse from '@/dto/app/PaginatedResponseDto';
import MessageTemplateDto from '@/dto/messageTemplate/MessageTemplateDto';
import api from './axiosInstance';

class MessageTemplateController extends BaseController {
    static async getItems(page = 1, search = '', perPage = 20, type = null) {
        const params = {};
        if (search) params.search = search;
        if (type) params.type = type;
        
        const data = await super.getItems('/message-templates', page, perPage, params);
        const items = MessageTemplateDto.fromApiArray(data.items || []);
        
        return new PaginatedResponse(
            items,
            data.current_page || 1,
            data.next_page || null,
            data.last_page || 1,
            data.total || 0
        );
    }

    static async getListItems(type = null) {
        const params = {};
        if (type) params.type = type;
        const data = await super.getListItems('/message-templates', params);
        return MessageTemplateDto.fromApiArray(data || []);
    }

    static async getItem(id) {
        const data = await super.getItem('/message-templates', id);
        if (!data || !data.item) return null;
        return new MessageTemplateDto(
            data.item.id,
            data.item.type,
            data.item.name,
            data.item.content,
            data.item.company_id,
            data.item.company,
            data.item.creator_id,
            data.item.user,
            data.item.is_active,
            data.item.created_at,
            data.item.updated_at
        );
    }

    static async createItem(item) {
        return await super.storeItem('/message-templates', item);
    }

    static async updateItem(id, item) {
        return await super.updateItem('/message-templates', id, item);
    }

    static async deleteItem(id) {
        return await super.deleteItem('/message-templates', id);
    }

    static async batchDelete(ids) {
        const response = await api.post('/message-templates/batch-delete', { ids });
        return response.data;
    }

    static async getTypes() {
        const response = await api.get('/message-templates/types');
        return response.data.types || [];
    }
}

export default MessageTemplateController;


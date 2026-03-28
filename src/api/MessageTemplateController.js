import BaseController from './BaseController';
import PaginatedResponse from '@/dto/app/PaginatedResponseDto';
import MessageTemplateDto from '@/dto/messageTemplate/MessageTemplateDto';

class MessageTemplateController extends BaseController {
    static async getItems(page = 1, search = '', perPage = 20, type = null) {
        const params = {};
        if (search) params.search = search;
        if (type) params.type = type;
        
        const data = await super.getItems('/message-templates', page, perPage, params);
        const items = MessageTemplateDto.fromApiArray(data.items);
        
        return new PaginatedResponse(
            items,
            data.current_page,
            data.next_page,
            data.last_page,
            data.total
        );
    }

    static async getListItems(type = null) {
        const params = {};
        if (type) params.type = type;
        const data = await super.getListItems('/message-templates', params);
        return MessageTemplateDto.fromApiArray(data);
    }

    static async getItem(id) {
        const data = await super.getItem('/message-templates', id);
        return new MessageTemplateDto(
            data.id,
            data.type,
            data.name,
            data.content,
            data.company_id,
            data.company,
            data.creator_id,
            data.creator,
            data.is_active,
            data.created_at,
            data.updated_at
        );
    }

    static async createItem(item) {
        return super.storeItem('/message-templates', item);
    }

    static async updateItem(id, item) {
        return super.updateItem('/message-templates', id, item);
    }

    static async deleteItem(id) {
        return super.deleteItem('/message-templates', id);
    }

    static async batchDelete(ids) {
        return super.post('/message-templates/batch-delete', { ids });
    }

    static async getTypes() {
        return super.getData('/message-templates/types');
    }
}

export default MessageTemplateController;


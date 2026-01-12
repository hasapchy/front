import BaseController from './BaseController';
import PaginatedResponse from '@/dto/app/PaginatedResponseDto';
import NewsDto from '@/dto/news/NewsDto';
import api from './axiosInstance';

class NewsController extends BaseController {
    static async getItems(page = 1, search = '', perPage = 20, dateFrom = null, dateTo = null, authorId = null) {
        const params = {};
        if (search) params.search = search;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        if (authorId) params.author_id = authorId;
        
        const data = await super.getItems('/news', page, perPage, params);
        const items = NewsDto.fromApiArray(data.items || []);
        
        return new PaginatedResponse(
            items,
            data.current_page || 1,
            data.next_page || null,
            data.last_page || 1,
            data.total || 0
        );
    }

    static async getListItems() {
        const data = await super.getListItems('/news');
        return NewsDto.fromApiArray(data || []);
    }

    static async getItem(id) {
        const data = await super.getItem('/news', id);
        if (!data || !data.item) return null;
        return new NewsDto(
            data.item.id,
            data.item.title,
            data.item.content,
            data.item.author?.id || null,
            data.item.author || null,
            data.item.company?.id || null,
            data.item.company || null,
            data.item.created_at,
            data.item.updated_at
        );
    }

    static async createItem(item) {
        return await super.storeItem('/news', item);
    }

    static async updateItem(id, item) {
        return await super.updateItem('/news', id, item);
    }

    static async deleteItem(id) {
        return await super.deleteItem('/news', id);
    }
}

export default NewsController;




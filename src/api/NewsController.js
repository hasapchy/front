import BaseController from './BaseController';
import PaginatedResponse from '@/dto/app/PaginatedResponseDto';
import NewsDto from '@/dto/news/NewsDto';

class NewsController extends BaseController {
    static async getItems(page = 1, search = '', perPage = 20, dateFrom = null, dateTo = null, authorId = null) {
        const params = {};
        if (search) params.search = search;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        if (authorId) params.author_id = authorId;
        
        const data = await super.getItems('/news', page, perPage, params);
        const items = NewsDto.fromApiArray(data.items);
        
        return new PaginatedResponse(
            items,
            data.current_page,
            data.next_page,
            data.last_page,
            data.total
        );
    }

    static async getListItems() {
        const data = await super.getListItems('/news');
        return NewsDto.fromApiArray(data);
    }

    static async getItem(id) {
        const data = await super.getItem('/news', id);
        return new NewsDto(
            data.id,
            data.title,
            data.content,
            data.author?.id || null,
            data.author || null,
            data.company?.id || null,
            data.company || null,
            data.created_at,
            data.updated_at
        );
    }

    static async createItem(item) {
        return super.storeItem('/news', item);
    }

    static async updateItem(id, item) {
        return super.updateItem('/news', id, item);
    }

    static async deleteItem(id) {
        return super.deleteItem('/news', id);
    }
}

export default NewsController;




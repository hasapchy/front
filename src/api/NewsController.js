import BaseController from './BaseController';
import PaginatedResponse from '@/dto/app/PaginatedResponseDto';
import NewsDto from '@/dto/news/NewsDto';
import { normalizeReactions } from '@/utils/reactionUtils';

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
        return NewsDto.fromApiItem(data);
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

    static async setReaction(newsId, emoji) {
        const body = await super.post(`/news/${newsId}/reaction`, { emoji });
        const reactions = body?.data?.reactions ?? body?.reactions ?? [];
        return normalizeReactions(reactions);
    }

    static async markViewed(newsId) {
        const body = await super.post(`/news/${newsId}/view`, {});
        return body?.data || {};
    }

    static async acknowledge(newsId) {
        const body = await super.post(`/news/${newsId}/acknowledge`, {});
        return body?.data || {};
    }
}

export default NewsController;

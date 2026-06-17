import PaginatedResponse from '@/dto/app/PaginatedResponseDto';
import JournalEntryDto from '@/dto/journal/JournalEntryDto';
import BaseController from './BaseController';
import { apiErrorMessage } from './apiErrorMessage';

export default class JournalEntryController extends BaseController {
    static async getItems(page = 1, perPage = 20, filters = {}, signal = null) {
        return super.handleRequest(async () => {
            const config = { params: { page, per_page: perPage, ...filters } };
            if (signal) {
                config.signal = signal;
            }
            const responseData = await super.getData('/journal/entries', config);
            const items = JournalEntryDto.fromApiArray(responseData.items ?? []);
            const meta = responseData.meta ?? {};

            return new PaginatedResponse(
                items,
                meta.current_page ?? page,
                meta.next_page ?? null,
                meta.last_page ?? 1,
                meta.total ?? items.length,
                meta,
            );
        }, apiErrorMessage('journalEntryList'));
    }

    static async getItem(id) {
        return super.handleRequest(async () => {
            const responseData = await super.getItem('/journal/entries', id);
            return JournalEntryDto.fromApi(responseData.item);
        }, apiErrorMessage('journalEntry'));
    }

    static async store(payload) {
        return super.handleRequest(async () => {
            const responseData = await super.store('/journal/entries', payload);
            return JournalEntryDto.fromApi(responseData.item);
        }, apiErrorMessage('journalEntryCreate'));
    }

    static async post(id) {
        return super.handleRequest(async () => {
            const responseData = await super.postData(`/journal/entries/${id}/post`);
            return JournalEntryDto.fromApi(responseData.item);
        }, apiErrorMessage('journalEntryPost'));
    }

    static async reverse(id, reason = null) {
        return super.handleRequest(async () => {
            const responseData = await super.postData(`/journal/entries/${id}/reverse`, { reason });
            return JournalEntryDto.fromApi(responseData.item);
        }, apiErrorMessage('journalEntryReverse'));
    }
}

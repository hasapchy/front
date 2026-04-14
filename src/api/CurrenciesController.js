import PaginatedResponse from '@/dto/app/PaginatedResponseDto';
import CurrencyDto from '@/dto/app/CurrencyDto';
import BaseController from './BaseController';

export default class CurrenciesController extends BaseController {
    static async getItems(page = 1, perPage = 20) {
        const data = await super.getItems('/settings/currencies', page, perPage);
        const items = CurrencyDto.fromApiArray(data.items);
        return new PaginatedResponse(
            items,
            data.current_page,
            data.next_page,
            data.last_page,
            data.total
        );
    }
}

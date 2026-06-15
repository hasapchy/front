import BaseController from './BaseController';
import { apiErrorMessage } from './apiErrorMessage';
import FinancialAccountDto from '@/dto/financial/FinancialAccountDto';

export default class FinancialAccountController extends BaseController {
    static async getItems() {
        return super.handleRequest(async () => {
            const responseData = await super.getData('/financial/accounts');
            return FinancialAccountDto.fromApiArray(responseData.items ?? []);
        }, apiErrorMessage('financialAccountList'));
    }

    static async getItem(id) {
        return super.handleRequest(async () => {
            const responseData = await super.getItem('/financial/accounts', id);
            return {
                account: FinancialAccountDto.fromApi(responseData.item),
                history: responseData.history ?? { items: [], meta: {} },
            };
        }, apiErrorMessage('financialAccount'));
    }

    static async getHistory(id, page = 1, perPage = 20, filters = {}) {
        return super.handleRequest(async () => {
            const responseData = await super.getData(`/financial/accounts/${id}/history`, {
                params: { page, per_page: perPage, ...filters },
            });
            return {
                items: responseData.items ?? [],
                meta: responseData.meta ?? {},
            };
        }, apiErrorMessage('financialAccountHistory'));
    }
}

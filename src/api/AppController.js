import UnitDto from '../dto/app/UnitDto';
import CurrencyDto from '../dto/app/CurrencyDto';
import api from './axiosInstance';
import ProductStatusDto from '@/dto/product/ProductStatusDto';
import TransactionCategoryDto from '@/dto/transaction/TransactionCategoryDto';

class AppController {
    async getCurrencies() {
        try {
            const response = await api.get('/app/currency');
            const data = response.data;
            console.log(data);
            return data.map(item => new CurrencyDto(
                {
                    id: item.id,
                    code: item.code,
                    name: item.name,
                    symbol: item.symbol,
                    is_default: item.is_default,
                    is_report: item.is_report,
                    status: item.status
                }
            ));
        } catch (error) {
            console.error('Error fetching currencies:', error);
            throw error;
        }
    }

    async getUnits() {
        try {
            const response = await api.get('/app/units');
            const data = await response.data;
            console.log(data);

            return data.map(item => new UnitDto(
                item.id,
                item.name,
                item.short_name,
                item.calc_area
            ));
        } catch (error) {
            console.error('Error fetching units:', error);
            throw error;
        }
    }
    async getProductStatuses() {
        try {
            const response = await api.get('/app/product_statuses');
            const data = await response.data;
            console.log(data);

            return data.map(item => new ProductStatusDto(
                {
                    id: item.id,
                    name: item.name
                }
            ));
        } catch (error) {
            console.error('Error fetching product statuses:', error);
            throw error;
        }
    }
    async getTransactionCategories() {
        try {
            const response = await api.get('/app/transaction_categories');
            const data = await response.data;
            console.log(data);

            return data.map(item => new TransactionCategoryDto(
                {
                    id: item.id,
                    name: item.name,
                    type: item.type
                }
            ));
        } catch (error) {
            console.error('Error fetching transaction categories:', error);
            throw error;
        }
    }
}

export default new AppController();
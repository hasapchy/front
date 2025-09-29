import api from "./axiosInstance";

export default class CategoriesController {
    // Получить только родительские категории (первого уровня)
    static async getParentCategories() {
        try {
            const response = await api.get('/categories/parents');
            return response.data;
        } catch (error) {
            console.error('Ошибка при получении родительских категорий:', error);
            throw error;
        }
    }
}

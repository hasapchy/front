import PaginatedResponse from "@/dto/app/PaginatedResponseDto";
import TransactionCategoryDto from "@/dto/transaction/TransactionCategoryDto";
import api from "./axiosInstance";

export default class TransactionCategoryController {
  static async getItems(page = 1, per_page = 10) {
    const response = await api.get(`/transaction_categories?page=${page}&per_page=${per_page}`);
    const data = response.data;
    const items = (data.items || []).map(
      (item) =>
        new TransactionCategoryDto({
          id: item.id,
          name: item.name,
          type: item.type,
          user_id: item.user_id,
          user_name: item.user_name,
          created_at: item.created_at,
          updated_at: item.updated_at
        })
    );
    return new PaginatedResponse(
      items,
      data.current_page,
      data.next_page,
      data.last_page,
      data.total
    );
  }

    static async getAllItems() {
        const response = await api.get(`/transaction_categories/all`);
        return (response.data || []).map(
            (item) =>
                new TransactionCategoryDto({
                    id: item.id,
                    name: item.name,
                    type: item.type,
                    user_id: item.user_id,
                    user_name: item.user_name,
                    created_at: item.created_at,
                    updated_at: item.updated_at
                })
        );
    }

  static async storeItem(item) {
    const { data } = await api.post("/transaction_categories", item);
    return data;
  }

  static async updateItem(id, item) {
    const { data } = await api.put(`/transaction_categories/${id}`, item);
    return data;
  }

  static async deleteItem(id) {
    const { data } = await api.delete(`/transaction_categories/${id}`);
    return data;
  }
}

import api from './axiosInstance';
import BaseController from './BaseController';

const ENDPOINT = 'recurring-transactions';

export default class RecurringTransactionController {
  static async getItems(page = 1, perPage = 20) {
    return BaseController.handleRequest(async () => {
      const response = await api.get(ENDPOINT, { params: { page, per_page: perPage } });
      return response.data;
    }, `Ошибка при получении списка: ${ENDPOINT}`);
  }

  static async getItem(id) {
    return BaseController.handleRequest(async () => {
      const response = await api.get(`${ENDPOINT}/${id}`);
      return response.data?.item ?? response.data;
    }, `Ошибка при получении: ${ENDPOINT}/${id}`);
  }

  static async storeItem(payload) {
    return BaseController.handleRequest(async () => {
      const response = await api.post(ENDPOINT, payload);
      return response.data;
    }, `Ошибка при создании: ${ENDPOINT}`);
  }

  static async updateItem(id, payload) {
    return BaseController.handleRequest(async () => {
      const response = await api.put(`${ENDPOINT}/${id}`, payload);
      return response.data;
    }, `Ошибка при обновлении: ${ENDPOINT}/${id}`);
  }

  static async deleteItem(id) {
    return BaseController.handleRequest(async () => {
      const response = await api.delete(`${ENDPOINT}/${id}`);
      return response.data;
    }, `Ошибка при удалении: ${ENDPOINT}/${id}`);
  }

  static async stopItem(id) {
    return BaseController.handleRequest(async () => {
      const response = await api.put(`${ENDPOINT}/${id}`, { is_active: false });
      return response.data;
    }, `Ошибка при остановке: ${ENDPOINT}/${id}`);
  }
}

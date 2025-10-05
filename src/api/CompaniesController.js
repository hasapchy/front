import { CompanyDto } from "@/dto/companies/CompanyDto";
import api from "./axiosInstance";

const CompaniesController = {
  async getItems(page = 1, per_page = 10) {
    const { data } = await api.get(`/companies?page=${page}&per_page=${per_page}`);
    return {
      items: CompanyDto.fromArray(data.data || []),
      currentPage: data.current_page,
      lastPage: data.last_page,
    };
  },

  async storeItem(payload) {
    const { data } = await api.post("/companies", payload);
    return data;
  },

  async updateItem(id, payload) {
    const { data } = await api.put(`/companies/${id}`, payload);
    return data;
  },

  async deleteItem(id) {
    const { data } = await api.delete(`/companies/${id}`);
    return data;
  },
};

export default CompaniesController;

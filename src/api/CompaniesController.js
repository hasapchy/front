import { CompanyDto } from "@/dto/companies/CompanyDto";
import api from "./axiosInstance";

const CompaniesController = {
  async getItems() {
    const { data } = await api.get(`/companies`);
    return {
      items: CompanyDto.fromArray(data),
      currentPage: 1,
      lastPage: 1,
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

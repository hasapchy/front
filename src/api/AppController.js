import UnitDto from "../dto/app/UnitDto";
import CurrencyDto from "../dto/app/CurrencyDto";
import api from "./axiosInstance";
import ProductStatusDto from "@/dto/product/ProductStatusDto";
import TransactionCategoryDto from "@/dto/transaction/TransactionCategoryDto";
import OrderStatusDto from "@/dto/order/OrderStatusDto";
import OrderStatusCategoryDto from "@/dto/order/OrderStatusCategoryDto";
import OrderCategoryDto from "@/dto/order/OrderCategoryDto";

class AppController {
  async getCurrencies() {
    try {
      const response = await api.get("/app/currency");
      const data = response.data;
      // console.log(data);
      return data.map(
        (item) =>
          new CurrencyDto({
            id: item.id,
            code: item.code,
            name: item.name,
            symbol: item.symbol,
            is_default: item.is_default,
            is_report: item.is_report,
            status: item.status,
          })
      );
    } catch (error) {
      console.error("Error fetching currencies:", error);
      throw error;
    }
  }

  async getUnits() {
    try {
      const response = await api.get("/app/units");
      const data = await response.data;
      // console.log(data);

      return data.map(
        (item) =>
          new UnitDto(item.id, item.name, item.short_name, item.calc_area)
      );
    } catch (error) {
      console.error("Error fetching units:", error);
      throw error;
    }
  }
  async getProductStatuses() {
    try {
      const response = await api.get("/app/product_statuses");
      const data = await response.data;
      // console.log(data);

      return data.map(
        (item) =>
          new ProductStatusDto({
            id: item.id,
            name: item.name,
          })
      );
    } catch (error) {
      console.error("Error fetching product statuses:", error);
      throw error;
    }
  }
  async getTransactionCategories() {
    try {
      const response = await api.get("/app/transaction_categories");
      const data = await response.data;
      // console.log(data);

      return data.map(
        (item) =>
          new TransactionCategoryDto({
            id: item.id,
            name: item.name,
            type: item.type,
          })
      );
    } catch (error) {
      console.error("Error fetching transaction categories:", error);
      throw error;
    }
  }
  async getOrderStatuses() {
    try {
      const response = await api.get("/app/order_statuses");
      const data = response.data;
      return data.map((item) => {
        // item: { id, name, category_id, category: { id, name, user_id, color } }
        let categoryDto = null;
        if (item.category) {
          categoryDto = new OrderStatusCategoryDto(
            item.category.id,
            item.category.name,
            item.category.user_id,
            item.category.color
          );
        }
        return new OrderStatusDto(
          item.id,
          item.name,
          item.category_id,
          categoryDto
        );
      });
    } catch (error) {
      console.error("Error fetching order statuses:", error);
      throw error;
    }
  }
  async getOrderCategories() {
    try {
      const response = await api.get("/app/order_categories");
      const data = response.data;
      return data.map((item) => new OrderCategoryDto(item.id, item.name));
    } catch (error) {
      console.error("Error fetching order categories:", error);
      throw error;
    }
  }
}

export default new AppController();

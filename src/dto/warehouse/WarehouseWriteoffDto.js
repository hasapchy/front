import { dayjsDate } from "@/utils/dateUtils";
import WarehouseWriteoffProductDto from "./WarehouseWriteoffProductDto";

export default class WarehouseWriteoffDto {
  constructor(
    id,
    warehouseId,
    warehouseName,
    products = null,
    note = "",
    userId,
    userName,
    createdAt = "",
    updatedAt = ""
  ) {
    this.id = id;
    this.warehouseId = warehouseId;
    this.warehouseName = warehouseName;
    /** @type {Array<WarehouseWriteoffProductDto> | null} */
    this.products = products;
    this.note = note;
    this.userId = userId;
    this.userName = userName;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  productsHtmlList() {
    if (this.products === null) {
      return "";
    }
    var res = "<ul>";
    this.products.forEach((product) => {
      res += `<li style="display: flex; align-items: center; gap: 10px;">`;
      if (product.productImage !== null) {
        res += `<img src="${product.imgUrl()}" alt="" width="20px" class="rounded">`;
      }
      res += `${product.productName} - ${product.quantity}${product.unitShortName}</li>`;
    });
    res += "</ul>";
    return res;
  }

  

  formatCreatedAt() {
    return dayjsDate(this.createdAt);
  }

  formatUpdatedAt() {
    return dayjsDate(this.updatedAt);
  }
}

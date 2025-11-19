import { getImageUrl, createFromApiArray } from "@/utils/dtoUtils";
import { formatNumber } from "@/utils/numberUtils";

export default class ProductSearchDto {
  constructor({
    id,
    type,
    name,
    description,
    sku,
    image,
    category_id,
    category_name,
    categories = [],
    stock_quantity,
    unit_id,
    unit_name,
    unit_short_name,
    retail_price,
    wholesale_price,
    purchase_price,
  }) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.description = description;
    this.sku = sku;
    this.image = image;
    this.categoryId = category_id;
    this.categoryName = category_name;
    this.categories = categories;
    this.stockQuantity = stock_quantity ?? 0;
    this.unitId = unit_id;
    this.unitName = unit_name;
    this.unitShortName = unit_short_name;
    this.retailPrice = retail_price;
    this.wholesalePrice = wholesale_price;
    this.purchasePrice = purchase_price;
  }

  typeName() {
    return this.type == 1 ? "product" : "service";
  }

  icons() {
    if (this.typeName() === "product") {
      return '<i class="fas fa-box text-[#3571A4] mr-2" title="Товар"></i>';
    } else {
      return '<i class="fas fa-concierge-bell text-[#3571A4] mr-2" title="Услуга"></i>';
    }
  }

  imgUrl() {
    return getImageUrl(this.image);
  }

  retailPriceFormatted() {
    let price = this.retailPrice;
    return this.priceFormatted(price);
  }

  wholesalePriceFormatted() {
    let price = this.wholesalePrice;
    return this.priceFormatted(price);
  }

  priceFormatted(price) {
    if (typeof price !== "number") {
      price = parseFloat(price);
    }
    return isNaN(price) ? "" : formatNumber(price, 2, false);
  }

  static fromApiArray(dataArray) {
    return createFromApiArray(dataArray, data => {
      let stock_quantity = data.stock_quantity;
      if (stock_quantity === undefined || stock_quantity === null) {
        stock_quantity = data.warehouse_quantity || 
                        data.quantity_on_warehouse || 
                        data.warehouse_stock || 
                        data.warehouse_stock_quantity ||
                        data.current_stock || 
                        data.stock_on_warehouse ||
                        data.quantity || 0;
      }
      
      const dto = new ProductSearchDto({
        id: data.id,
        type: data.type,
        name: data.name,
        description: data.description,
        sku: data.sku,
        image: data.image,
        category_id: data.category_id,
        category_name: data.category_name,
        categories: data.categories || [],
        stock_quantity: stock_quantity,
        unit_id: data.unit_id,
        unit_name: data.unit_name,
        unit_short_name: data.unit_short_name,
        retail_price: data.retail_price,
        wholesale_price: data.wholesale_price,
        purchase_price: data.purchase_price,
      });
      
      return dto;
    }).filter(Boolean);
  }
}
